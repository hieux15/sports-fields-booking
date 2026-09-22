# Sports Fields Booking

Sân thể thao booking system for the Vietnamese market. The repository is a
monorepo split into a NestJS REST API and a Next.js web client.

## Project structure

```
sports-fields-booking/
├── backend/     NestJS 11 REST API + Prisma 6 + PostgreSQL   (http://localhost:3000)
└── frontend/    Next.js 16 + React 19 + Tailwind v4 + shadcn/ui (http://localhost:3001)
```

## Prerequisites

- Node.js >= 20.9.0 (Next.js 16 requirement; developed on Node 22)
- A PostgreSQL database (the seed config targets a Supabase pooler) whose role
  can run `CREATE EXTENSION btree_gist` (used by the booking overlap guard)

## Backend

```bash
cd backend
npm install                 # or npm ci
cp .env.example .env        # then fill in real DATABASE_URL / DIRECT_URL / JWT_SECRET
npx prisma generate
npx prisma migrate deploy   # apply migrations
npx prisma db seed          # optional: demo owner, customer, court and booking
npm run start:dev           # http://localhost:3000
```

Useful scripts:

```bash
npm run build        # nest build -> dist/
npm run start:prod   # node dist/main
npm test             # unit tests (jest)
npm run test:cov     # unit tests + coverage report
npm run test:e2e     # e2e tests (needs a reachable database)
npm run typecheck    # tsc --noEmit
npm run lint         # eslint --fix
npm run lint:check   # eslint, no --fix
npm run format       # prettier --write
npm run format:check # prettier --check
```

### API documentation (Swagger)

The API is documented with `@nestjs/swagger` and generated from the same
decorators the runtime uses, so it cannot drift silently:

- Swagger UI: <http://localhost:3000/docs>
- OpenAPI JSON: <http://localhost:3000/docs-json>

Set `SWAGGER_ENABLED=false` to turn both off. To try protected routes, call
`POST /auth/login` with a demo account, then paste the returned `access_token`
into the **Authorize** dialog. `src/swagger.spec.ts` asserts that every route
listed below exists in the document and that bearer auth is attached to the
authenticated ones.

### Environment variables (`backend/.env`)

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string (pooled, used by the app) |
| `DIRECT_URL` | Direct connection string (used for migrations) |
| `PORT` | HTTP port, default `3000` |
| `JWT_SECRET` | Secret used to sign JWT access tokens (min 32 characters, validated at startup) |
| `JWT_EXPIRES_IN` | Access token lifetime, default `7d` |
| `CORS_ORIGIN` | Comma-separated allowed browser origins, default `http://localhost:3001` |
| `SWAGGER_ENABLED` | Set to `false` to disable `/docs` and `/docs-json` (default: enabled) |

### API overview

All routes are served without an `/api` prefix. Protected routes expect
`Authorization: Bearer <access_token>`.

| Method | Route | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/` | public | Health check (`Hello World!`) |
| `GET` | `/health` | public | Deployment health check: pings the database and answers `503` when it is down |
| `POST` | `/auth/register` | public | Create a `CUSTOMER` account, returns the user (no token) |
| `POST` | `/auth/login` | public | Returns `{ access_token }` only, call `/users/me` for the profile |
| `GET` | `/users/me` | authenticated | Current user profile |
| `PATCH` | `/users/me` | authenticated | Update `name` / `phone` |
| `GET` | `/courts` | public | Paginated list with server-side search, filters, sort and pagination |
| `GET` | `/courts/me` | `OWNER` | Your own courts, sorted by `name` |
| `GET` | `/courts/:id` | public | Court detail including owner name and phone |
| `POST` | `/courts` | `OWNER` | Create a court |
| `PATCH` | `/courts/:id` | `OWNER` | Update one of your courts |
| `DELETE` | `/courts/:id` | `OWNER` | Delete one of your courts (see the note below) |
| `GET` | `/courts/:id/bookings` | `OWNER` | Bookings of one of your courts |
| `POST` | `/bookings` | `CUSTOMER` | Create a booking |
| `GET` | `/bookings/me` | `CUSTOMER` | Your bookings, each with its court |
| `GET` | `/bookings/:id` | `CUSTOMER` | One of your bookings |
| `PATCH` | `/bookings/:id/cancel` | `CUSTOMER` / `OWNER` | Cancel a booking |
| `PATCH` | `/bookings/:id/confirm` | `OWNER` | Confirm a booking made on one of your courts |

Notes for API consumers:

- `GET /courts` answers a paginated envelope
  (`{ items, total, page, limit, totalPages }`) instead of a bare array. All
  parameters are optional: `q` (matches name or address, case-insensitive),
  `type`, `minPrice`, `maxPrice`, `page` (default `1`), `limit` (default `12`,
  max `50`) and `sort` (`name_asc` | `name_desc` | `price_asc` | `price_desc`).
  Every sort order adds `id` as a tie-break so a row never jumps between pages,
  and unknown query parameters are rejected with `400`.
- Rate limiting is global at 120 requests/minute per IP (`429` beyond that) and
  tightened to 10/minute on `POST /auth/login` and `POST /auth/register`, plus
  20/minute on `POST /bookings`.
- Startup fails fast: `DATABASE_URL`, `DIRECT_URL` and a `JWT_SECRET` of at least
  32 characters are mandatory, so a misconfigured deploy stops immediately
  instead of signing tokens with `undefined`.

- `Court.pricePerHour` is a Prisma `Decimal`, so it is serialised as a **string**
  (for example `"200000"`). Convert it with `Number()` before doing any math.
- A global `ValidationPipe` runs with `whitelist` and `forbidNonWhitelisted`,
  so request bodies must contain only the documented fields.
- Errors use the standard Nest shape `{ statusCode, message, error }` where
  `message` can be a `string` or a `string[]`.
- `GET /courts/me` is declared before `GET /courts/:id`, so the literal path
  `me` is never swallowed by the `:id` parameter.
- `DELETE /courts/:id` answers `400` while the court still has bookings whose
  `status` is not `CANCELLED` (`message` reports how many are left). When it
  succeeds it first deletes the `CANCELLED` bookings of that court in the same
  transaction, which keeps the `Booking.courtId` foreign key valid.
- `POST /users/become-owner` creates a court, so it applies the same schedule and
  price rules as `POST /courts`: `openTime`/`closeTime` must match `HH:mm` and
  `openTime < closeTime`, and the price must stay inside the same range. An
  invalid payload is rejected with `400` before the transaction starts, so a
  failed upgrade never leaves an `OWNER` account without a court.
- `POST /bookings` answers `409` when the court already has a booking whose
  `status` is not `CANCELLED` and whose `[startTime, endTime)` overlaps the
  requested range. The same rule is enforced by a database constraint, so two
  simultaneous requests cannot both succeed (see the note below).

### Booking overlap guard (database constraints)

`POST /bookings` is protected twice: the service pre-checks and returns a
friendly `409`, and PostgreSQL enforces the invariant so that any other writer
(another instance, a script, a manual query) cannot create the same overlap.

| Object | Definition / purpose |
| --- | --- |
| `btree_gist` | extension created by the migration, required by the exclusion constraint |
| `booking_no_overlap` | `EXCLUDE USING gist ("courtId" WITH =, tsrange("startTime", "endTime", '[)') WITH &&) WHERE ("status" <> 'CANCELLED')` |
| `booking_time_range_valid` | `CHECK ("startTime" < "endTime")` |

Prerequisites and behaviour to keep in mind:

- `npx prisma migrate deploy` needs a role that is allowed to run
  `CREATE EXTENSION IF NOT EXISTS btree_gist`.
- The migrations fail (and change nothing) if the data already violates the new
  constraints, so overlapping bookings that are not `CANCELLED` (and rows with
  `startTime >= endTime`) must be fixed before deploying.
- Ranges are half-open `[startTime, endTime)`, so back-to-back bookings such as
  10:00-11:00 and 11:00-12:00 are both valid.
- `CANCELLED` bookings are ignored by the constraint, so a cancelled slot can be
  booked again.
- Prisma cannot express `EXCLUDE` in `schema.prisma`, therefore the constraints
  live in the raw SQL migrations and `prisma migrate diff` reports no drift.
- `npm run test:e2e` includes `test/bookings.e2e-spec.ts`, which runs against the
  configured database and asserts one `201` plus one `409` for two concurrent
  requests; it loads `backend/.env` through `setupFiles` and cleans up its own
  data.

#### Pre-deploy data check (legacy databases)

A database created from these migrations already satisfies the constraints, so this
check is only needed when the data predates them - for example when a dump of the
old database is restored. Run both queries before `prisma migrate deploy`: the
migrations fail (and change nothing) while violating rows remain.

```sql
-- Bookings that are not cancelled and overlap another booking on the same court
SELECT a."id", b."id", a."courtId", a."status", b."status"
FROM "Booking" a
JOIN "Booking" b
  ON a."courtId" = b."courtId" AND a."id" < b."id"
 AND tsrange(a."startTime", a."endTime", '[)') && tsrange(b."startTime", b."endTime", '[)')
WHERE a."status" <> 'CANCELLED' AND b."status" <> 'CANCELLED';

-- Invalid ranges
SELECT "id" FROM "Booking" WHERE "startTime" >= "endTime";
```

## Frontend

```bash
cd frontend
pnpm install                # the project ships a pnpm lockfile
cp .env.example .env.local  # point it at the running backend
pnpm dev                    # http://localhost:3001
```

| Variable | Default | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | `http://localhost:3000` | Base URL of the NestJS API |
| `NEXT_PUBLIC_USE_MOCK` | `0` | Set to `1` to serve bundled mock data instead of the API |

## Demo accounts

Seeded by `backend/prisma/seed.ts` (password `123456` for both):

| Role | Email |
| --- | --- |
| `CUSTOMER` | customer@test.com |
| `OWNER` | owner@test.com |

## Running both apps

Start the backend first, then the frontend. The backend only accepts browser
requests from the origins listed in `CORS_ORIGIN`, so the two must agree on the
frontend port (`3001` by default).

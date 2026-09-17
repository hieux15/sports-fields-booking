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
- A PostgreSQL database (the seed config targets a Supabase pooler)

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
npm run build      # nest build -> dist/
npm run start:prod # node dist/main
npm test           # unit tests (jest)
npm run test:e2e   # e2e tests
npm run lint       # eslint + prettier --fix
```

### Environment variables (`backend/.env`)

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string (pooled, used by the app) |
| `DIRECT_URL` | Direct connection string (used for migrations) |
| `PORT` | HTTP port, default `3000` |
| `JWT_SECRET` | Secret used to sign JWT access tokens |
| `CORS_ORIGIN` | Comma-separated allowed browser origins, default `http://localhost:3001` |

### API overview

All routes are served without an `/api` prefix. Protected routes expect
`Authorization: Bearer <access_token>`.

| Method | Route | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/` | public | Health check (`Hello World!`) |
| `POST` | `/auth/register` | public | Create a `CUSTOMER` account, returns the user (no token) |
| `POST` | `/auth/login` | public | Returns `{ access_token }` only, call `/users/me` for the profile |
| `GET` | `/users/me` | authenticated | Current user profile |
| `PATCH` | `/users/me` | authenticated | Update `name` / `phone` |
| `GET` | `/courts` | public | All courts (no owner, filters or pagination) |
| `GET` | `/courts/:id` | public | Court detail including owner name and phone |
| `POST` | `/courts` | `OWNER` | Create a court |
| `PATCH` | `/courts/:id` | `OWNER` | Update one of your courts |
| `DELETE` | `/courts/:id` | `OWNER` | Delete one of your courts |
| `GET` | `/courts/:id/bookings` | `OWNER` | Bookings of one of your courts |
| `POST` | `/bookings` | `CUSTOMER` | Create a booking |
| `GET` | `/bookings/me` | `CUSTOMER` | Your bookings, each with its court |
| `GET` | `/bookings/:id` | `CUSTOMER` | One of your bookings |
| `PATCH` | `/bookings/:id/cancel` | `CUSTOMER` / `OWNER` | Cancel a booking |

Notes for API consumers:

- `Court.pricePerHour` is a Prisma `Decimal`, so it is serialised as a **string**
  (for example `"200000"`). Convert it with `Number()` before doing any math.
- A global `ValidationPipe` runs with `whitelist` and `forbidNonWhitelisted`,
  so request bodies must contain only the documented fields.
- Errors use the standard Nest shape `{ statusCode, message, error }` where
  `message` can be a `string` or a `string[]`.

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

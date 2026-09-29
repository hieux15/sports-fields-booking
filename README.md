# Sports Fields Booking

[![CI](https://github.com/hieux15/sports-fields-booking/actions/workflows/ci.yml/badge.svg)](https://github.com/hieux15/sports-fields-booking/actions/workflows/ci.yml)

A sports-field booking platform for customers and field owners in Vietnam. This monorepo contains a Next.js web application and a NestJS REST API backed by PostgreSQL.

<!-- Add a link to the live demo here when it is available. -->

## Screenshots

<!-- Add screenshot links here when they are ready. Example: ![Court listing](docs/screenshots/court-list.png) -->

## Contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [API overview](#api-overview)
- [Testing and useful commands](#testing-and-useful-commands)
- [Deployment](#deployment)

## Features

### Customers

- Browse sports fields and search by name or address.
- Filter fields by sport and price, then sort and paginate results.
- Check available time slots before booking.
- View and cancel eligible bookings.
- Review a field after completing a booking.
- Manage profile and contact information.

### Field owners

- Register as a field owner and create the first field.
- Create, update, and manage fields and court photos.
- Review booking requests and confirm or cancel eligible bookings.
- View booking activity and revenue summaries.

### Booking integrity

- PostgreSQL exclusion constraints prevent overlapping active bookings, including concurrent requests.
- Pending bookings that pass their start time expire automatically.
- Confirmed bookings become completed after their end time.
- Booking prices are stored as snapshots, so later price changes do not alter past bookings.

## Tech stack

| Layer | Technologies |
| --- | --- |
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | NestJS 11, TypeScript, Prisma 6 |
| Database | PostgreSQL |
| Image storage | Supabase Storage (optional; local disk is available for development) |

## Architecture

```text
 sports-fields-booking/
 ├── frontend/   Next.js web app (default: http://localhost:3001)
 └── backend/    NestJS REST API (default: http://localhost:3000)
                   ├── PostgreSQL via Prisma
                   └── Supabase Storage for persistent court photos (optional)
```

The API serves routes without an `/api` prefix. Authenticated requests use a JWT access token in the `Authorization: Bearer <token>` header. Swagger is available at `/docs` when enabled.

## Getting started

### Prerequisites

- Node.js 20.9 or later
- PostgreSQL
- pnpm 10.32.1 (for the frontend)

The booking overlap migration uses PostgreSQL's `btree_gist` extension. Make sure your database role can enable this extension before applying migrations.

### 1. Set up the backend

```bash
cd backend
npm ci
```

Copy `backend/.env.example` to `backend/.env` and configure the required values:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/postgres?schema=public"
DIRECT_URL="postgresql://USER:PASSWORD@HOST:5432/postgres?schema=public"
JWT_SECRET="use-a-random-secret-at-least-32-characters-long"
```

Then generate the Prisma client, apply migrations, and start the API:

```bash
npx prisma generate
npx prisma migrate deploy
npm run start:dev
```

To populate a local database with sample users, fields, and bookings, run `npx prisma db seed`. The seed uses the password `demo@2026` for its demo accounts. Do not run the demo seed against production data.

The backend is available at `http://localhost:3000`:

- Swagger UI: `http://localhost:3000/docs`
- Health check: `http://localhost:3000/health`

### 2. Set up the frontend

In a separate terminal:

```bash
cd frontend
pnpm install
```

Copy `frontend/.env.example` to `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_USE_MOCK=0
```

Start the development server:

```bash
pnpm dev
```

Open `http://localhost:3001`. The backend's `CORS_ORIGIN` must include this exact origin.

## Environment variables

### Backend

See [`backend/.env.example`](backend/.env.example) for the complete list and local defaults.

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string used by the API. Use an appropriate pooled connection when required by the host. |
| `DIRECT_URL` | Yes | PostgreSQL connection string used by Prisma migrations. |
| `JWT_SECRET` | Yes | JWT signing secret; must be at least 32 characters. |
| `JWT_EXPIRES_IN` | No | Access token lifetime; defaults to `7d`. |
| `CORS_ORIGIN` | No | Comma-separated allowed browser origins; defaults to `http://localhost:3001`. |
| `SWAGGER_ENABLED` | No | Set to `false` to disable `/docs` and `/docs-json`; enabled by default. |
| `UPLOAD_MAX_BYTES` | No | Maximum court photo size in bytes; defaults to `5242880` (5 MiB). |
| `SUPABASE_URL` | No | Supabase project URL. Set together with the service role key to enable Supabase Storage. |
| `SUPABASE_SERVICE_ROLE_KEY` | No | Server-only key used to upload and delete photos. Never expose it in the frontend. |
| `SUPABASE_STORAGE_BUCKET` | No | Public storage bucket name; defaults to `court-images`. |
| `PUBLIC_BASE_URL` | No | API public origin used only to build local-disk photo URLs. Not needed for Supabase Storage. |

If Supabase Storage is not configured, uploaded photos are written to `backend/uploads`. This is suitable for local development, but not for hosts with an ephemeral filesystem.

### Frontend

See [`frontend/.env.example`](frontend/.env.example).

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | Base URL of the NestJS API. |
| `NEXT_PUBLIC_USE_MOCK` | Set to `1` to use bundled mock data; set to `0` to use the API. |

`NEXT_PUBLIC_*` values are included in the frontend build. Redeploy the frontend after changing them.

## API overview

The API returns full route documentation and request schemas through Swagger at `/docs`. The main routes are:

| Method | Route | Access | Description |
| --- | --- | --- | --- |
| `POST` | `/auth/register` | Public | Register a customer account. |
| `POST` | `/auth/login` | Public | Sign in and receive an access token. |
| `GET`, `PATCH` | `/users/me` | Signed-in user | Read or update the current profile. |
| `GET` | `/courts` | Public | Search, filter, sort, and paginate fields. |
| `GET` | `/courts/:id` | Public | Get field details and owner contact information. |
| `GET` | `/courts/:id/availability` | Public | Get available time slots for a date. |
| `POST` | `/courts/images` | Signed-in user | Upload a field photo (`multipart/form-data`, field `file`). |
| `POST`, `PATCH`, `DELETE` | `/courts`, `/courts/:id` | Field owner | Create, update, or delete a field. |
| `GET` | `/courts/me` | Field owner | List the current owner's fields. |
| `POST` | `/bookings` | Customer | Create a booking. |
| `GET` | `/bookings/me` | Customer | List the current customer's bookings. |
| `GET` | `/bookings/owner` | Field owner | List bookings across owned fields. |
| `GET` | `/bookings/:id` | Customer | Get a booking owned by the current customer. |
| `PATCH` | `/bookings/:id/confirm` | Field owner | Confirm a booking on an owned field. |
| `PATCH` | `/bookings/:id/cancel` | Customer or field owner | Cancel an eligible booking. |
| `POST`, `GET` | `/courts/:id/reviews` | Create: customer; list: public | Create or list reviews for a field. |
| `PATCH`, `DELETE` | `/courts/reviews/:id` | Review author | Update or delete your review. |
| `GET` | `/health` | Public | Check API and database connectivity. |

### Booking rules

- Booking durations must be between one and four hours and fit within the field's opening hours.
- The requested time must be in the future and must not overlap another active booking.
- Time ranges use the half-open interval `[startTime, endTime)`, so consecutive bookings are allowed.
- `CANCELLED` and `EXPIRED` bookings no longer reserve their time slot.
- Monetary `Decimal` values are serialized as strings; convert them to numbers when doing client-side calculations.

## Testing and useful commands

### Backend (`backend/`)

```bash
npm run build
npm run typecheck
npm run lint:check
npm test
npm run test:e2e
```

The end-to-end booking tests need a reachable database configured in `backend/.env`.

### Frontend (`frontend/`)

```bash
pnpm build
pnpm typecheck
```

## Deployment

The frontend and backend are deployed as separate services from this monorepo.

### Frontend on Vercel

1. Import the GitHub repository into Vercel.
2. Set **Root Directory** to `frontend` and use the Next.js framework preset.
3. Add `NEXT_PUBLIC_API_URL` with the public backend URL and `NEXT_PUBLIC_USE_MOCK=0`.
4. Deploy. Redeploy after changing either environment variable.

### Backend on Render

1. Create a Node.js Web Service connected to the repository.
2. Set **Root Directory** to `backend`.
3. Set the build command to `npm ci && npx prisma generate && npm run build`.
4. Set the start command to `npm run start:prod` and health check path to `/health`.
5. Add the required database and JWT variables, plus `CORS_ORIGIN` and Supabase Storage variables as needed.
6. Apply database migrations with `npx prisma migrate deploy` before sending production traffic. Render's pre-deploy command is available on paid web services; on other plans, run migrations separately before deployment.

Use a persistent PostgreSQL database and Supabase Storage for production. Do not run the demo seed against production data. Set `CORS_ORIGIN` to the exact frontend origin, without a trailing slash. Keep `JWT_SECRET`, database credentials, and the Supabase service role key out of source control and browser-visible environment variables.

## License

This project is currently marked `UNLICENSED` in its package metadata. Contact the repository owner before reusing or distributing it.

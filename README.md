# TRIPPLE ORE Ecommerce Platform

This is a Next.js and Supabase ecommerce application. The `frontend/` project
contains the storefront, admin dashboard, and server-side `/api` Route
Handlers. Supabase provides PostgreSQL, authentication, and Storage; no
separate Express service is required at runtime.

## Project structure

- `frontend/` — deployable Next.js application and API.
- `backend/sql/` — repeatable Supabase SQL migrations.
- `backend/` — legacy Express implementation retained temporarily for rollback
  reference and migration tooling; it is not deployed in the Vercel-only
  architecture.

## Local development

Copy `frontend/.env.example` to `frontend/.env.local`, fill in the server-only
Supabase credentials, then run:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`. The health endpoint is available at
`http://localhost:3000/api/health`.

## Database migrations

Run migrations from `backend/` after configuring `DATABASE_URL`,
`SUPABASE_DB_URL`, or `SUPABASE_DATABASE_URL`:

```bash
cd backend
npm run migrate
```

Before product management, run
`20260721_reconcile_catalogue_categories.sql` so the database contains the
catalogue categories referenced by products.

## Deployment

Deploy `frontend/` to Vercel. See [DEPLOYMENT.md](DEPLOYMENT.md) for the
required variables, Supabase OAuth configuration, and Render retirement steps.

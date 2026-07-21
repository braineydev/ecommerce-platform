# TRIPPLE ORE Ecommerce Platform

A full-stack ecommerce catalogue and order-management application. The project
uses Next.js for the storefront/admin dashboard, Express for the API, and
Supabase for authentication, storage, and PostgreSQL data.

## Project structure

- `frontend/` — Next.js storefront, cart, checkout, and admin dashboard.
- `backend/` — Express API, Supabase integration, uploads, and database migrations.
- `backend/sql/` — repeatable SQL migrations for the Supabase database.

## Local development

Install dependencies in each app, then start them in separate terminals:

```bash
cd backend
npm install
npm run dev
```

```bash
cd frontend
npm install
npm run dev
```

The frontend expects the API at `http://localhost:5000/api` by default. Set
`BACKEND_API_URL` to the deployed backend URL (ending in `/api`) for production.

## Required environment variables

Backend (`backend/.env`):

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-server-only-service-role-key
```

For migrations, also set one of `DATABASE_URL`, `SUPABASE_DB_URL`, or
`SUPABASE_DATABASE_URL` to the Supabase PostgreSQL connection string.

Frontend (`frontend/.env.local` for local use):

```env
BACKEND_API_URL=http://localhost:5000/api
```

## Database migrations

Run migrations from `backend/` after configuring a database connection string:

```bash
npm run migrate
```

The migrations are written to be safe to run repeatedly. Before using product
management, run `20260721_reconcile_catalogue_categories.sql` so the database
contains the catalogue categories referenced by products.

## Deployment

Deploy `backend/` to Render and `frontend/` to Vercel. Configure `BACKEND_API_URL`
in Vercel with the public Render API URL, including `/api`. See
[DEPLOYMENT.md](DEPLOYMENT.md) for the deployment checklist.

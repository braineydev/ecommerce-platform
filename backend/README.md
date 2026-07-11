# Backend - Migrations & Deployment Notes

This folder contains the backend server and SQL migrations for the project.

## Running migrations locally

1. Install dependencies:

```bash
cd backend
npm install
```

2. Ensure your environment provides a database connection string (use your Supabase service role DB URL for migrations):

```bash
export DATABASE_URL="postgres://..." # or set in .env
```

3. Run migrations (executes all `*.sql` files in `backend/sql/` in alphabetical order):

```bash
npm run migrate
```

Notes:

- The `decrement_stock.sql` function is `CREATE OR REPLACE` so it is safe to run multiple times.
- The `revoke_decrement_stock_execute.sql` file revokes public/anon execute permission. Keep that in your migration set to avoid exposing the RPC to client-side users.

## CI / Deploy

Use the same `npm run migrate` command in your CI pipeline prior to deploying the backend. Example (GitHub Actions job snippet):

```yaml
- name: Run migrations
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
  run: |
    cd backend
    npm ci
    npm run migrate
```

## Security

- Never commit `DATABASE_URL` or Supabase service role keys to source control.
- Call `decrement_stock` only from server-side code (the backend already calls it). The migration includes a `REVOKE EXECUTE` step to remove anon access — keep this in migrations.
- For production high-concurrency needs consider DB-level monitoring and backups before applying migrations.

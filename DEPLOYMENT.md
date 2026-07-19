# Deployment configuration

The frontend serves browser requests through its same-origin `/api` path. Next.js proxies that path to the backend. This avoids browser CORS and cookie-domain problems, and it keeps the backend URL out of client-side code.

## Frontend environment variables

Set these in the environment that runs **`next build`** and `next start`:

| Variable | Example | Required |
| --- | --- | --- |
| `BACKEND_API_URL` | `https://api.example.com/api` | Yes in production |
| `NEXT_PUBLIC_SITE_URL` | `https://shop.example.com` | Yes |

`BACKEND_API_URL` must be an absolute `http` or `https` URL ending in `/api`. Do not set it to `/api`: that makes the Next.js rewrite call itself and returns an HTML 404 page instead of API JSON. The production build now stops with a clear error if this value is missing or relative.

## Backend environment variables

Configure the backend with:

| Variable | Example | Required |
| --- | --- | --- |
| `PORT` | `5000` | Platform-dependent |
| `SUPABASE_URL` | `https://your-project.supabase.co` | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service-role secret | Yes |
| `FRONTEND_ORIGINS` | `https://shop.example.com` | Yes |
| `FRONTEND_URL` | `https://shop.example.com` | Yes, for OAuth |
| `AUTH_CALLBACK_URL` | `https://shop.example.com/auth/callback` | Yes, when Google sign-in is enabled |

For preview deployments, add every preview frontend URL to `FRONTEND_ORIGINS`, separated by commas. Origins must not have trailing slashes.

## Render backend deployment

This repository includes `render.yaml`. In Render, choose **New → Blueprint**, select this repository, and create the `ecommerce-platform-api` service. It uses `backend` as the root directory, runs `npm ci`, starts with `npm start`, and checks `/api/health`.

In the Render service environment settings, enter the values from the backend table above. Render provides `PORT` automatically; do not set it manually. After the first deploy, copy the service URL (for example, `https://ecommerce-platform-api.onrender.com`) and set the frontend build-time variable:

```env
BACKEND_API_URL=https://ecommerce-platform-api.onrender.com/api
```

For Google sign-in, also add `https://shop.example.com/auth/callback` to the allowed redirect URLs in your Supabase Auth settings.

## Pre-launch checks

1. Deploy the backend first and confirm `https://api.example.com/api/health` returns JSON.
2. Set the frontend variables, then build the frontend.
3. Open `https://shop.example.com/api/health`; it should return the backend JSON through the frontend proxy.
4. Test login, signup, session refresh, checkout, and an admin-only request from the deployed site.
5. Keep secrets only in the backend deployment settings—never use `NEXT_PUBLIC_` for service-role keys.

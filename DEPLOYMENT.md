# Vercel deployment

The `frontend/` directory is the complete web application: its Next.js Route
Handlers expose the same-origin `/api/*` endpoints and connect directly to
Supabase. It does not proxy API requests to Render.

## Configure Vercel

Create a Vercel project from this repository with **Root Directory** set to
`frontend`. Vercel detects Next.js and uses `npm run build` automatically.

Set these environment variables for Production, Preview, and Development as
appropriate:

| Variable | Required | Notes |
| --- | --- | --- |
| `SUPABASE_URL` | Yes | Supabase project URL; server-only. |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server-only privileged key. Never use `NEXT_PUBLIC_`. |
| `NEXT_PUBLIC_SITE_URL` | Yes in production | Canonical storefront URL, for example `https://shop.example.com`. |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Optional | Google Analytics 4 ID (`G-...`) used for page-view tracking. |
| `AUTH_CALLBACK_URL` | Optional | Explicit OAuth callback URL; otherwise the request origin is used. |

Add the production and preview callback URLs (`https://your-domain/auth/callback`)
to Supabase Auth's allowed redirect URLs. Configure the same production domain
in Supabase Auth's Site URL setting.

## Pre-launch checks

1. Confirm `https://shop.example.com/api/health` returns JSON.
2. Test sign-up, sign-in, sign-out, session exchange, and Google OAuth.
3. Test cart, orders, payment reference submission, and administrator-only
   product/customer/order actions.
4. Test an image smaller than 4 MB; larger uploads must use a direct signed
   Supabase Storage upload flow.
5. Confirm `SUPABASE_SERVICE_ROLE_KEY` is absent from browser bundles and
   `NEXT_PUBLIC_*` variables.

## Render retirement

Keep the existing Render service available during the initial Vercel release
as a rollback option, but do not send new traffic to it. Once the checks above
and production monitoring are clean, remove its environment variables and
cancel the Render service. The `backend/` directory remains useful as a
historical reference and for SQL migrations until it is deliberately archived.

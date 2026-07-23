Provider setup and environment variables

This document lists the environment variables and step-by-step configuration needed to enable Google OAuth and SMS (Twilio) OTP using Supabase, plus deployment-specific notes for Render and Vercel.

Required environment variables (backend)

- `SUPABASE_URL` — your Supabase project URL (e.g. https://xyz.supabase.co)
- `SUPABASE_SERVICE_ROLE_KEY` — server-only service role key (starts with `sb_secret_`), set only on your server; never expose to frontend
- `FRONTEND_URL` — public frontend URL (used if `AUTH_CALLBACK_URL` not set). Example: `https://yourdomain.com` or `http://localhost:3000` for local dev
- `AUTH_CALLBACK_URL` (optional) — explicit OAuth callback URL. If set, it will be used as the redirect target after OAuth.

Optional / provider-specific vars (Twilio)

- `TWILIO_ACCOUNT_SID` — Twilio Account SID
- `TWILIO_AUTH_TOKEN` — Twilio Auth Token
- `TWILIO_PHONE_NUMBER` — Twilio phone number (E.164 format) used to send SMS

Notes: Supabase will store provider secrets in its dashboard (Google Client ID/Secret and Twilio credentials). For production, set only `SUPABASE_SERVICE_ROLE_KEY` on your backend host.

Supabase: enable Google OAuth

1. Create Google OAuth credentials
   - Go to https://console.cloud.google.com/apis/credentials
   - Create an OAuth 2.0 Client ID (Application type: Web application)
   - Add Authorized redirect URIs:
     - For local development: `http://localhost:3000/auth/callback`
     - For your production domain: `https://yourdomain.com/auth/callback`
   - Save the `Client ID` and `Client Secret`.

2. Add Google provider in Supabase
   - Open Supabase Dashboard → Authentication → Settings → External OAuth Providers
   - Find Google, click ‘Configure’ (or equivalent). Paste the `Client ID` and `Client Secret`.
   - Enable the provider.

3. Confirm redirect URL in Supabase
   - Supabase may display allowed redirect URIs. Ensure the URI you configured in Google Cloud is present.

Supabase: enable SMS (Twilio)

1. Create a Twilio account
   - Sign up at https://twilio.com and create a phone number capable of sending SMS.
   - Note `Account SID`, `Auth Token`, and the phone number (E.164 format).

2. Configure Twilio in Supabase
   - Supabase Dashboard → Authentication → SMS / Settings (or External Providers → SMS)
   - Supply Twilio `Account SID` and `Auth Token`, and the sending phone number.
   - Enable phone signups if necessary.

3. Test SMS
   - Use Supabase `signInWithOtp({ phone })` from your backend to request a code and verify it.

Common pitfalls and troubleshooting

- Unsupported provider error
  - When Supabase responds with `Unsupported provider: provider is not enabled`, it means the provider (Google/Twilio) has not been enabled in the Supabase project's Authentication settings. Visit the Supabase dashboard and enable the provider.

- Redirect mismatch
  - Google will reject OAuth requests if the redirect URI in the Google Cloud Console does not exactly match the one used by your app. Use exact scheme + host + path.

- Key types
  - Use server-side `SUPABASE_SERVICE_ROLE_KEY` for server operations. Do not place this key in frontend code or any `NEXT_PUBLIC_` env var.

Deployment-specific notes

Render

- Set environment variables for the service in Render's dashboard (Web Service → Environment). Add `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `FRONTEND_URL`.
- If your frontend is hosted on Render, add the same frontend URL to Google allowed redirect URIs.

Vercel

- Add the same environment variables in Vercel project settings (Environment Variables). Ensure the correct preview/production scopes are set.
- For Vercel preview deployments, add the preview deployment URL in Google redirect URIs when testing.

Local development quick checklist

- Backend: in `backend/.env` or your shell, define `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
- Frontend: set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` only if you need client-side Supabase access; this project uses server-side session cookies so frontend should not rely on service_role keys.
- Ensure `AUTH_CALLBACK_URL` or `FRONTEND_URL` points to your local `http://localhost:3000` if testing OAuth redirects locally.

If you want, I can also add a short checklist to your existing `backend/README.md` referencing this file — shall I do that?

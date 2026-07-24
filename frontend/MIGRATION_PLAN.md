# Next.js API migration

The Next.js project now owns the storefront API contract under `/api`: auth,
catalogue, cart, wishlists, customers, profile, orders, payments, image upload,
and admin operations. These routes call Supabase directly from server-only code.

The remaining migration work is operational rather than endpoint-by-endpoint:

1. Deploy `frontend/` to Vercel with the Supabase secrets described in the root
   deployment guide.
2. Exercise the production acceptance checks while keeping the legacy Express
   deployment available for rollback.
3. Replace the checkout's multi-request stock update with a single Supabase
   database RPC transaction before high-volume use.
4. Move uploads larger than 4 MB to signed, direct Supabase Storage uploads.
5. Retire Render after production monitoring is clean.

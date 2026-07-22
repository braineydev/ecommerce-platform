require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
// This key bypasses RLS and must only ever exist in the server environment.
// Never rename it with a NEXT_PUBLIC_ prefix or expose it to the frontend.
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or server-only SUPABASE_SERVICE_ROLE_KEY!");
  process.exit(1);
}

// Current Supabase projects can use opaque API keys. A publishable key is the
// modern equivalent of the legacy anon JWT: it can read rows allowed by RLS,
// while inserts/updates may be silently filtered. Reject it at startup rather
// than letting an admin write be misreported as a missing product.
if (supabaseKey.startsWith("sb_publishable_")) {
  console.error(
    "SUPABASE_SERVICE_ROLE_KEY is a publishable key. Configure Render with the server-only sb_secret_ key (or legacy service_role JWT).",
  );
  process.exit(1);
}

// Legacy Supabase keys are JWTs. Refuse the anonymous/publishable JWT here:
// using it for this server makes RLS hide products and profiles on writes,
// which misleadingly surfaces as "Product/Customer not found".
const keyParts = supabaseKey.split(".");
if (keyParts.length === 3) {
  try {
    const payload = JSON.parse(
      Buffer.from(keyParts[1], "base64url").toString("utf8"),
    );
    if (payload.role !== "service_role") {
      console.error(
        "SUPABASE_SERVICE_ROLE_KEY is not a service_role key. Configure the server-only Supabase service_role key in Render.",
      );
      process.exit(1);
    }
  } catch (error) {
    console.error("SUPABASE_SERVICE_ROLE_KEY is not a valid key.");
    process.exit(1);
  }
}

// Initialize the Supabase client with the Service Role key
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;

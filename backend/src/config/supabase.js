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

// Initialize the Supabase client with the Service Role key
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;

import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "../../../../../lib/supabase-server";

export async function GET(request) {
  const supabase = createSupabaseAdminClient();
  const redirectTo =
    process.env.AUTH_CALLBACK_URL || `${request.nextUrl.origin}/auth/callback`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo },
  });

  if (error || !data?.url) {
    return NextResponse.json(
      { error: "Google sign-in is not configured" },
      { status: 400 },
    );
  }

  return NextResponse.json({ url: data.url });
}

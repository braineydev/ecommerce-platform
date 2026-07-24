import { NextResponse } from "next/server";
import { setSessionCookie } from "../../../../lib/auth-route-utils";
import { createSupabaseAdminClient } from "../../../../lib/supabase-server";

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const token = typeof body.access_token === "string" ? body.access_token : "";

  if (!token || token.length > 10000) {
    return NextResponse.json(
      { error: "Missing or invalid access token" },
      { status: 400 },
    );
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return NextResponse.json(
      { error: "Invalid sign-in session" },
      { status: 401 },
    );
  }

  const response = NextResponse.json({
    user: await buildAuthenticatedUser(supabase, data.user),
  });
  setSessionCookie(response, {
    access_token: token,
    expires_at: body.expires_at,
  });

  return response;
}

async function buildAuthenticatedUser(supabase, authUser) {
  if (!authUser) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, phone, role")
    .eq("id", authUser.id)
    .maybeSingle();

  return {
    ...authUser,
    name:
      profile?.full_name || authUser.user_metadata?.full_name || authUser.email,
    full_name: profile?.full_name || authUser.user_metadata?.full_name || "",
    phone: profile?.phone || authUser.user_metadata?.phone || "",
    role: profile?.role || authUser.user_metadata?.role || "customer",
  };
}

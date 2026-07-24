import { NextResponse } from "next/server";
import {
  buildAuthenticatedUser,
  normalizeEmail,
  setSessionCookie,
} from "../../../../lib/auth-route-utils";
import { createSupabaseAdminClient } from "../../../../lib/supabase-server";

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const supabase = createSupabaseAdminClient();
  const password = typeof body.password === "string" ? body.password : "";
  const email = normalizeEmail(body.email);

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required" },
      { status: 400 },
    );
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return NextResponse.json(
      { error: "Invalid email or password" },
      { status: 401 },
    );
  }

  const response = NextResponse.json({
    message: "Login successful!",
    user: await buildAuthenticatedUser(supabase, data.user),
  });

  setSessionCookie(response, data.session);
  return response;
}

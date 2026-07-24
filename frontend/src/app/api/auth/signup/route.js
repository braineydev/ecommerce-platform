import { NextResponse } from "next/server";
import {
  buildAuthenticatedUser,
  isStrongPassword,
  normalizeEmail,
  normalizePhone,
  setSessionCookie,
} from "../../../../lib/auth-route-utils";
import { createSupabaseAdminClient } from "../../../../lib/supabase-server";

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const supabase = createSupabaseAdminClient();
  const password = typeof body.password === "string" ? body.password : "";
  const email = normalizeEmail(body.email);
  const full_name =
    typeof body.full_name === "string"
      ? body.full_name.trim().slice(0, 100)
      : "";
  const phone = normalizePhone(body.phone);

  if (!email && !phone) {
    return NextResponse.json(
      { error: "Enter an email address or phone number" },
      { status: 400 },
    );
  }
  if (!email) {
    return NextResponse.json(
      { error: "Use phone verification to create a phone-only account" },
      { status: 400 },
    );
  }
  if (!password) {
    return NextResponse.json(
      { error: "Password is required for email registration" },
      { status: 400 },
    );
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return NextResponse.json(
      { error: "Enter a valid email address" },
      { status: 400 },
    );
  }
  if (!isStrongPassword(password)) {
    return NextResponse.json(
      {
        error:
          "Use 12+ characters with uppercase, lowercase, number, and symbol",
      },
      { status: 400 },
    );
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: full_name || "",
        phone: phone || "",
      },
    },
  });

  if (error) {
    return NextResponse.json(
      { error: "Unable to create account" },
      { status: 400 },
    );
  }

  const response = NextResponse.json({
    message: "Signup successful!",
    user: await buildAuthenticatedUser(supabase, data.user),
    requiresEmailConfirmation: !data.session,
  });

  setSessionCookie(response, data.session);
  return response;
}

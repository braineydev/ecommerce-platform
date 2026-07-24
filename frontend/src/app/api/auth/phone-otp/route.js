import { NextResponse } from "next/server";
import { isValidPhone, normalizePhone } from "../../../../lib/auth-route-utils";
import { createSupabaseAdminClient } from "../../../../lib/supabase-server";

export async function POST(request) {
  const { phone, full_name } = await request.json().catch(() => ({}));
  const mobile = normalizePhone(phone);
  const name = typeof full_name === "string" ? full_name.trim().slice(0, 100) : "";
  if (!isValidPhone(mobile)) return NextResponse.json({ error: "Enter a valid phone number in international format, e.g. +2547..." }, { status: 400 });
  const { error } = await createSupabaseAdminClient().auth.signInWithOtp({ phone: mobile, options: { shouldCreateUser: true, data: { full_name: name, phone: mobile } } });
  if (error) return NextResponse.json({ error: "Unable to send verification code" }, { status: 400 });
  return NextResponse.json({ message: "Verification code sent" });
}

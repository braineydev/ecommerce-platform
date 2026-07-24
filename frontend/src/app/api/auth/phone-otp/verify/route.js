import { NextResponse } from "next/server";
import { buildAuthenticatedUser, isValidPhone, normalizePhone, setSessionCookie } from "../../../../../lib/auth-route-utils";
import { createSupabaseAdminClient } from "../../../../../lib/supabase-server";

export async function POST(request) {
  const { phone, token } = await request.json().catch(() => ({}));
  const mobile = normalizePhone(phone);
  const code = typeof token === "string" ? token.trim() : "";
  if (!isValidPhone(mobile) || !/^\d{6}$/.test(code)) return NextResponse.json({ error: "Enter the phone number and six-digit code" }, { status: 400 });
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.auth.verifyOtp({ phone: mobile, token: code, type: "sms" });
  if (error || !data.session) return NextResponse.json({ error: "The verification code is invalid or expired" }, { status: 400 });
  const response = NextResponse.json({ message: "Phone verified", user: await buildAuthenticatedUser(supabase, data.user) });
  setSessionCookie(response, data.session);
  return response;
}

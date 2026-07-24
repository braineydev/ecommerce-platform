import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getAuthenticatedUser, normalizePhone } from "../../../../lib/auth-route-utils";
import { createSupabaseAdminClient } from "../../../../lib/supabase-server";

async function userAndClient() {
  const supabase = createSupabaseAdminClient();
  const { user } = await getAuthenticatedUser(supabase, await cookies());
  return { supabase, user };
}

export async function GET() {
  const { supabase, user } = await userAndClient();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: profile, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  return NextResponse.json({ profile });
}

export async function PUT(request) {
  const { full_name, phone } = await request.json().catch(() => ({}));
  const name = typeof full_name === "string" ? full_name.trim().slice(0, 100) : "";
  const mobile = typeof phone === "string" ? normalizePhone(phone).slice(0, 30) : "";
  if (!name && !mobile) return NextResponse.json({ error: "Provide a name or phone number" }, { status: 400 });
  const { supabase, user } = await userAndClient();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: profile, error } = await supabase.from("profiles").update({ full_name: name, phone: mobile }).eq("id", user.id).select().maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  return NextResponse.json({ message: "Profile updated successfully", profile });
}

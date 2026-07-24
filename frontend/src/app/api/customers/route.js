import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  getAuthenticatedUser,
  getUserRole,
} from "../../../lib/auth-route-utils";
import { createSupabaseAdminClient } from "../../../lib/supabase-server";

export async function GET() {
  const cookieStore = await cookies();
  const supabase = createSupabaseAdminClient();
  const { user } = await getAuthenticatedUser(supabase, cookieStore);

  if (!user || getUserRole(user) !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, role, phone, email")
    .order("full_name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ customers: data });
}

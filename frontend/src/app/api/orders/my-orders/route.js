import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "../../../../lib/auth-route-utils";
import { orderSelect } from "../../../../lib/order-api";
import { createSupabaseAdminClient } from "../../../../lib/supabase-server";

export async function GET() {
  const supabase = createSupabaseAdminClient();
  const { user } = await getAuthenticatedUser(supabase, await cookies());
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: orders, error } = await supabase.from("orders").select(orderSelect).eq("profile_id", user.id).order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ orders });
}

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getAuthenticatedUser, getUserRole } from "../../../../lib/auth-route-utils";
import { createSupabaseAdminClient } from "../../../../lib/supabase-server";

export async function POST(request) {
  const { payment_id } = await request.json().catch(() => ({}));
  if (!payment_id) return NextResponse.json({ error: "Payment ID is required" }, { status: 400 });
  const supabase = createSupabaseAdminClient();
  const { user } = await getAuthenticatedUser(supabase, await cookies());
  if (!user || getUserRole(user) !== "admin") return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  const { data: payment, error } = await supabase.from("payments").update({ status: "verified", verified_by: user.id }).eq("id", payment_id).eq("status", "pending").select().maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!payment) return NextResponse.json({ error: "Payment not found or already verified" }, { status: 404 });
  const { error: orderError } = await supabase.from("orders").update({ status: "processing" }).eq("id", payment.order_id);
  if (orderError) return NextResponse.json({ error: orderError.message }, { status: 500 });
  return NextResponse.json({ message: "Payment verified! Order is now processing.", payment });
}

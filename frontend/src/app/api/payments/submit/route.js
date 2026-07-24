import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "../../../../lib/auth-route-utils";
import { createSupabaseAdminClient } from "../../../../lib/supabase-server";

export async function POST(request) {
  const { order_id, mpesa_reference } = await request.json().catch(() => ({}));
  const reference = typeof mpesa_reference === "string" ? mpesa_reference.trim().toUpperCase() : "";
  if (!order_id || !reference) return NextResponse.json({ error: "Order ID and M-Pesa reference are required" }, { status: 400 });
  if (!/^[A-Z0-9-]{6,64}$/.test(reference)) return NextResponse.json({ error: "Enter a valid payment reference" }, { status: 400 });
  const supabase = createSupabaseAdminClient();
  const { user } = await getAuthenticatedUser(supabase, await cookies());
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: order, error: orderError } = await supabase.from("orders").select("id, status").eq("id", order_id).eq("profile_id", user.id).maybeSingle();
  if (orderError || !order) return NextResponse.json({ error: "Order not found or unauthorized" }, { status: 404 });
  if (order.status !== "pending") return NextResponse.json({ error: "Order is no longer pending" }, { status: 400 });
  const { data: existing, error: existingError } = await supabase.from("payments").select("id").eq("order_id", order_id).maybeSingle();
  if (existingError) return NextResponse.json({ error: "Unable to validate payment" }, { status: 500 });
  if (existing) return NextResponse.json({ error: "A payment reference has already been submitted for this order" }, { status: 409 });
  const { data: payment, error } = await supabase.from("payments").insert([{ order_id, mpesa_reference: reference, status: "pending" }]).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ message: "Payment reference submitted successfully!", payment }, { status: 201 });
}

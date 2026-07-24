import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "../../../lib/auth-route-utils";
import { getOrderLines } from "../../../lib/order-api";
import { createSupabaseAdminClient } from "../../../lib/supabase-server";

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const shippingAddress = typeof (body.shipping_address || body.shippingAddress) === "string"
    ? (body.shipping_address || body.shippingAddress).trim()
    : "";
  if (!shippingAddress || shippingAddress.length > 500) {
    return NextResponse.json({ error: "Shipping address is required" }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const { user } = await getAuthenticatedUser(supabase, await cookies());
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let deliveryZoneId = body.delivery_zone_id;
  let deliveryFee = 0;
  if (deliveryZoneId) {
    const { data: zone, error } = await supabase.from("delivery_zones").select("delivery_fee").eq("id", deliveryZoneId).single();
    if (error || !zone) return NextResponse.json({ error: "Invalid delivery zone ID" }, { status: 400 });
    deliveryFee = Number(zone.delivery_fee);
  } else {
    const { data: zone } = await supabase.from("delivery_zones").select("id, delivery_fee").limit(1).maybeSingle();
    if (zone) {
      deliveryZoneId = zone.id;
      deliveryFee = Number(zone.delivery_fee);
    }
  }

  const { lines, error: linesError, usedCart } = await getOrderLines(supabase, user.id, body.items);
  if (linesError) return NextResponse.json({ error: linesError.message }, { status: 400 });
  if (!lines?.length) return NextResponse.json({ error: "Cart is empty or could not be fetched" }, { status: 400 });
  if (lines.some(item => Number(item.quantity) > Number(item.products?.stock ?? 0))) {
    return NextResponse.json({ error: "One or more products are no longer available in the requested quantity" }, { status: 409 });
  }

  const orderItems = lines.map(item => ({ product_id: item.product_id, quantity: item.quantity, price_at_purchase: Number(item.products.price) }));
  const totalAmount = deliveryFee + orderItems.reduce((total, item) => total + item.price_at_purchase * item.quantity, 0);
  const orderInsert = { profile_id: user.id, shipping_address: shippingAddress, total_amount: totalAmount, status: "pending" };
  if (deliveryZoneId) orderInsert.delivery_zone_id = deliveryZoneId;

  const { data: order, error: orderError } = await supabase.from("orders").insert([orderInsert]).select().single();
  if (orderError) return NextResponse.json({ error: orderError.message }, { status: 500 });

  const { error: itemsError } = await supabase.from("order_items").insert(orderItems.map(item => ({ ...item, order_id: order.id })));
  if (itemsError) {
    await supabase.from("orders").delete().eq("id", order.id);
    return NextResponse.json({ error: itemsError.message }, { status: 500 });
  }

  const { error: stockError } = await supabase.rpc("decrement_stock", { items: orderItems.map(item => ({ id: item.product_id, quantity: item.quantity })) });
  if (stockError) {
    await supabase.from("order_items").delete().eq("order_id", order.id);
    await supabase.from("orders").delete().eq("id", order.id);
    return NextResponse.json({ error: "Stock changed before the order could be placed. Please review your cart." }, { status: 409 });
  }

  if (usedCart) {
    const { error } = await supabase.from("cart_items").delete().eq("profile_id", user.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ message: "Order created successfully!", order }, { status: 201 });
}

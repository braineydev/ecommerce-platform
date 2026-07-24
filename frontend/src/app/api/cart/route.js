import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "../../../lib/auth-route-utils";
import { createSupabaseAdminClient } from "../../../lib/supabase-server";

export async function GET() {
  const cookieStore = await cookies();
  const supabase = createSupabaseAdminClient();
  const { user } = await getAuthenticatedUser(supabase, cookieStore);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("cart_items")
    .select(`id, quantity, product_id, products (name, price, images, stock)`)
    .eq("profile_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const cookieStore = await cookies();
  const supabase = createSupabaseAdminClient();
  const { user } = await getAuthenticatedUser(supabase, cookieStore);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const product_id = body.product_id;
  const quantity = Number(body.quantity ?? 1);

  if (!product_id) {
    return NextResponse.json(
      { error: "Product ID is required" },
      { status: 400 },
    );
  }
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
    return NextResponse.json(
      { error: "Quantity must be a whole number between 1 and 100" },
      { status: 400 },
    );
  }

  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id, stock")
    .eq("id", product_id)
    .maybeSingle();

  if (productError) {
    return NextResponse.json(
      { error: "Unable to validate product availability" },
      { status: 500 },
    );
  }
  if (!product || Number(product.stock) < 1) {
    return NextResponse.json(
      { error: "This product is currently unavailable" },
      { status: 400 },
    );
  }

  const { data: existingItem, error: existingItemError } = await supabase
    .from("cart_items")
    .select("*")
    .eq("profile_id", user.id)
    .eq("product_id", product_id)
    .maybeSingle();

  if (existingItemError) {
    return NextResponse.json(
      { error: existingItemError.message },
      { status: 500 },
    );
  }

  let result;
  if (existingItem) {
    const newQuantity = Number(existingItem.quantity) + quantity;
    if (newQuantity > 100 || newQuantity > Number(product.stock)) {
      return NextResponse.json(
        { error: "Requested quantity is not available" },
        { status: 400 },
      );
    }
    result = await supabase
      .from("cart_items")
      .update({ quantity: newQuantity })
      .eq("id", existingItem.id)
      .select();
  } else {
    if (quantity > Number(product.stock)) {
      return NextResponse.json(
        { error: "Requested quantity is not available" },
        { status: 400 },
      );
    }
    result = await supabase
      .from("cart_items")
      .insert([{ profile_id: user.id, product_id, quantity }])
      .select();
  }

  if (result.error) {
    return NextResponse.json({ error: result.error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "Added to cart", data: result.data });
}

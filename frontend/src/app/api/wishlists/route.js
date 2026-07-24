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
    .from("wishlists")
    .select(`id, product_id, created_at, products (name, price, images, stock)`)
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ wishlist: data });
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
  if (!product_id) {
    return NextResponse.json(
      { error: "Product ID is required" },
      { status: 400 },
    );
  }

  const { data: existingItem } = await supabase
    .from("wishlists")
    .select("id")
    .eq("profile_id", user.id)
    .eq("product_id", product_id)
    .single();

  if (existingItem) {
    return NextResponse.json(
      { message: "Item is already in your wishlist" },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("wishlists")
    .insert([{ profile_id: user.id, product_id }])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "Added to wishlist", item: data });
}

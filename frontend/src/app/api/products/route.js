import { NextResponse } from "next/server";
import { getProductsFromSupabase } from "../../../lib/catalog";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";
  const featured = searchParams.get("featured") || "";
  const brand = searchParams.get("brand") || "";
  const min_price = searchParams.get("min_price") || undefined;
  const max_price = searchParams.get("max_price") || undefined;
  const page = searchParams.get("page") || "1";
  const limit = searchParams.get("limit") || "24";

  try {
    const payload = await getProductsFromSupabase({
      search,
      category,
      featured,
      brand,
      min_price,
      max_price,
      page,
      limit,
    });

    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Unable to load products" },
      { status: 500 },
    );
  }
}

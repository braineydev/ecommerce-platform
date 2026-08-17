import { NextResponse } from "next/server";
import { getProductsFromSupabase } from "../../../lib/catalog";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const startedAt = performance.now();

  try {
    const result = await getProductsFromSupabase({
      search: searchParams.get("search") || undefined,
      category: searchParams.get("category") || undefined,
      featured: searchParams.get("featured") || undefined,
      brand: searchParams.get("brand") || undefined,
      min_price: searchParams.get("min_price") || undefined,
      max_price: searchParams.get("max_price") || undefined,
      page: searchParams.get("page") || undefined,
      limit: searchParams.get("limit") || undefined,
    });
    const duration = performance.now() - startedAt;
    console.info("catalog.products", { durationMs: Math.round(duration) });
    return NextResponse.json(result, {
      headers: { "Server-Timing": `supabase;dur=${duration.toFixed(1)}` },
    });
  } catch (error) {
    const duration = performance.now() - startedAt;
    console.error("catalog.products.failed", {
      durationMs: Math.round(duration),
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { error: error.message || "Unable to load products" },
      {
        status: 500,
        headers: { "Server-Timing": `supabase;dur=${duration.toFixed(1)}` },
      },
    );
  }
}

import { NextResponse } from "next/server";
import { getProductByIdFromSupabase } from "../../../../lib/catalog";

export async function GET(request, { params }) {
  const resolvedParams = await params;
  const id = resolvedParams?.id;
  const startedAt = performance.now();

  try {
    const product = await getProductByIdFromSupabase(id);
    const duration = performance.now() - startedAt;
    console.info("catalog.product", { durationMs: Math.round(duration) });
    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404, headers: { "Server-Timing": `supabase;dur=${duration.toFixed(1)}` } },
      );
    }
    return NextResponse.json(
      { product },
      { headers: { "Server-Timing": `supabase;dur=${duration.toFixed(1)}` } },
    );
  } catch (error) {
    const duration = performance.now() - startedAt;
    console.error("catalog.product.failed", {
      durationMs: Math.round(duration),
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { error: error.message || "Unable to load product" },
      {
        status: 500,
        headers: { "Server-Timing": `supabase;dur=${duration.toFixed(1)}` },
      },
    );
  }
}

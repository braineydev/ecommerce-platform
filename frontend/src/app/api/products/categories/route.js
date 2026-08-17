import { NextResponse } from "next/server";
import { getCategoriesFromSupabase } from "../../../../lib/catalog";

export async function GET() {
  const startedAt = performance.now();
  try {
    const data = await getCategoriesFromSupabase();
    const duration = performance.now() - startedAt;
    console.info("catalog.categories", { durationMs: Math.round(duration) });
    return NextResponse.json(
      { data },
      { headers: { "Server-Timing": `supabase;dur=${duration.toFixed(1)}` } },
    );
  } catch (error) {
    const duration = performance.now() - startedAt;
    console.error("catalog.categories.failed", {
      durationMs: Math.round(duration),
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { error: error.message || "Unable to load categories" },
      {
        status: 500,
        headers: { "Server-Timing": `supabase;dur=${duration.toFixed(1)}` },
      },
    );
  }
}

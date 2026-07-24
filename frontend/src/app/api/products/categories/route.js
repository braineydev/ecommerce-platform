import { NextResponse } from "next/server";
import { getCategoriesFromSupabase } from "../../../../lib/catalog";

export async function GET() {
  try {
    const data = await getCategoriesFromSupabase();
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Unable to load categories" },
      { status: 500 },
    );
  }
}

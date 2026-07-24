import { NextResponse } from "next/server";
import { getProductByIdFromSupabase } from "../../../../lib/catalog";

export async function GET(request, { params }) {
  const resolvedParams = await params;
  const id = resolvedParams?.id;

  try {
    const product = await getProductByIdFromSupabase(id);

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Unable to load product" },
      { status: 500 },
    );
  }
}

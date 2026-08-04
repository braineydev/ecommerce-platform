import { NextResponse } from "next/server";

const backendApiBase = (
  process.env.BACKEND_API_URL ||
  (process.env.NEXT_PUBLIC_API_URL
    ? `${process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "")}/api`
    : "http://localhost:5000/api")
).replace(/\/$/, "");

export async function GET(request, { params }) {
  const resolvedParams = await params;
  const id = resolvedParams?.id;

  try {
    const response = await fetch(
      `${backendApiBase}/products/${encodeURIComponent(id)}`,
      {
        headers: {
          accept: "application/json",
        },
        cache: "no-store",
      },
    );

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      return NextResponse.json(
        { error: payload?.error || "Unable to load product" },
        { status: response.status },
      );
    }

    return NextResponse.json({ product: payload?.product || null });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Unable to load product" },
      { status: 500 },
    );
  }
}

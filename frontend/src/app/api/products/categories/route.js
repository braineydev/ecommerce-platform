import { NextResponse } from "next/server";

const backendApiBase = (
  process.env.BACKEND_API_URL || "http://localhost:5000/api"
).replace(/\/$/, "");

export async function GET() {
  try {
    const response = await fetch(`${backendApiBase}/products/categories`, {
      headers: {
        accept: "application/json",
      },
      cache: "no-store",
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      return NextResponse.json(
        { error: payload?.error || "Unable to load categories" },
        { status: response.status },
      );
    }

    return NextResponse.json({ data: payload?.data || [] });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Unable to load categories" },
      { status: 500 },
    );
  }
}

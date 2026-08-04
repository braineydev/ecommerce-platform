import { NextResponse } from "next/server";

const backendApiBase = (
  process.env.BACKEND_API_URL ||
  (process.env.NEXT_PUBLIC_API_URL
    ? `${process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "")}/api`
    : "http://localhost:5000/api")
).replace(/\/$/, "");

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const targetUrl = new URL(`${backendApiBase}/products`);

  searchParams.forEach((value, key) => {
    targetUrl.searchParams.set(key, value);
  });

  try {
    const response = await fetch(targetUrl, {
      headers: {
        accept: "application/json",
      },
      cache: "no-store",
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      return NextResponse.json(
        {
          error: payload?.error || "Unable to load products",
        },
        { status: response.status },
      );
    }

    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Unable to load products" },
      { status: 500 },
    );
  }
}

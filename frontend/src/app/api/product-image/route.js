import { NextResponse } from "next/server";

const PRODUCT_IMAGE_PATH_PREFIX = "/storage/v1/object/public/";
const PRODUCT_IMAGE_BUCKETS = ["product-images", "products"];

function isSupportedProductImageUrl(imageUrl) {
  if (imageUrl.protocol !== "https:") return false;
  if (!imageUrl.pathname.startsWith(PRODUCT_IMAGE_PATH_PREFIX)) return false;

  const hostname = imageUrl.hostname.toLowerCase();
  const isSupabaseStorageHost =
    hostname === "supabase.co" ||
    hostname.endsWith(".supabase.co") ||
    hostname.includes("supabase");

  if (!isSupabaseStorageHost) return false;

  return PRODUCT_IMAGE_BUCKETS.some(bucket =>
    imageUrl.pathname.startsWith(`${PRODUCT_IMAGE_PATH_PREFIX}${bucket}/`),
  );
}

export async function GET(request) {
  const requestedUrl = new URL(request.url).searchParams.get("url");
  if (!requestedUrl) {
    return NextResponse.json({ error: "Missing image URL" }, { status: 400 });
  }

  let imageUrl;
  try {
    imageUrl = new URL(requestedUrl);
  } catch {
    return NextResponse.json({ error: "Invalid image URL" }, { status: 400 });
  }

  if (!isSupportedProductImageUrl(imageUrl)) {
    return NextResponse.json(
      { error: "Unsupported image URL" },
      { status: 400 },
    );
  }

  try {
    const response = await fetch(imageUrl, {
      redirect: "error",
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Image not found" },
        { status: response.status },
      );
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) {
      return NextResponse.json(
        { error: "Invalid image response" },
        { status: 502 },
      );
    }

    return new NextResponse(await response.arrayBuffer(), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to load image" },
      { status: 502 },
    );
  }
}

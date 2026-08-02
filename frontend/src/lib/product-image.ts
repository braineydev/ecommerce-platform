const PRODUCT_IMAGE_PATH_PREFIX = "/storage/v1/object/public/";
const PRODUCT_IMAGE_BUCKETS = ["product-images", "products"];
const SUPABASE_STORAGE_BASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";

function isProductImageUrl(image: string) {
  try {
    const url = new URL(image);
    if (url.protocol !== "https:") return false;
    if (!url.pathname.startsWith(PRODUCT_IMAGE_PATH_PREFIX)) return false;

    const hostname = url.hostname.toLowerCase();
    const isSupabaseStorageHost =
      hostname === "supabase.co" ||
      hostname.endsWith(".supabase.co") ||
      hostname.includes("supabase");

    if (!isSupabaseStorageHost) return false;

    return PRODUCT_IMAGE_BUCKETS.some(bucket =>
      url.pathname.startsWith(`${PRODUCT_IMAGE_PATH_PREFIX}${bucket}/`),
    );
  } catch {
    return false;
  }
}

function resolveLegacyImageUrl(image: string) {
  if (!SUPABASE_STORAGE_BASE_URL) return image;

  const trimmedImage = image.trim();
  if (!trimmedImage) return image;

  if (
    trimmedImage.startsWith("http://") ||
    trimmedImage.startsWith("https://")
  ) {
    return trimmedImage;
  }

  const normalizedImage = trimmedImage.replace(/^\/+/, "");
  if (!normalizedImage || normalizedImage.includes("/")) {
    return image;
  }

  try {
    const baseUrl = new URL(SUPABASE_STORAGE_BASE_URL);
    const bucket = "product-images";
    const publicUrl = `${baseUrl.origin}${PRODUCT_IMAGE_PATH_PREFIX}${bucket}/${encodeURIComponent(normalizedImage)}`;
    return publicUrl;
  } catch {
    return image;
  }
}

/**
 * Routes uploaded product images through the storefront origin. This keeps
 * product cards working in browsers or extensions that block direct Storage
 * requests, while leaving non-product images untouched.
 */
export function getProductImageSrc(image?: string | null) {
  if (!image) return image || "";

  const resolvedImage = resolveLegacyImageUrl(image);

  if (isProductImageUrl(resolvedImage)) {
    return `/api/product-image?url=${encodeURIComponent(resolvedImage)}`;
  }

  return resolvedImage;
}

const PRODUCT_IMAGE_HOST = "fzwejabpgytmodmoxcfy.supabase.co";
const PRODUCT_IMAGE_PATH = "/storage/v1/object/public/product-images/";

/**
 * Routes uploaded product images through the storefront origin. This keeps
 * product cards working in browsers or extensions that block direct Storage
 * requests, while leaving non-product images untouched.
 */
export function getProductImageSrc(image?: string | null) {
  if (!image) return image || "";

  try {
    const url = new URL(image);
    if (
      url.protocol === "https:" &&
      url.hostname === PRODUCT_IMAGE_HOST &&
      url.pathname.startsWith(PRODUCT_IMAGE_PATH)
    ) {
      return `/api/product-image?url=${encodeURIComponent(url.toString())}`;
    }
  } catch {
    // The image value is handled by the caller's fallback behaviour.
  }

  return image;
}

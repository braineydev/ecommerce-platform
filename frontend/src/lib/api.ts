export const API_PROXY_PATH = "/api";
// Route Handlers are the single backend-for-frontend layer and query Supabase
// directly. Keep browser requests on this Vercel deployment rather than
// routing them through the retired Express/Render service.
export const API_BACKEND_PATH = API_PROXY_PATH;

/**
 * Parses API responses defensively so a proxy/server error cannot surface as
 * the misleading "Unexpected token '<'" JSON parsing error.
 */
export async function readApiJson<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return (await response.json()) as T;
  }

  throw new Error(
    `The API returned ${response.status} ${response.statusText || "response"} instead of JSON. Check the API route and deployment logs.`,
  );
}

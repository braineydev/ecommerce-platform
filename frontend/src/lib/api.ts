export const API_PROXY_PATH = "/api";

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

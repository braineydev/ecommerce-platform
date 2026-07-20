const localApiUrl = "http://localhost:5000/api";

/** Returns the absolute backend URL required by server-rendered components. */
export function getServerApiUrl() {
  const apiUrl = process.env.BACKEND_API_URL || localApiUrl;

  if (!/^https?:\/\//.test(apiUrl)) {
    throw new Error("BACKEND_API_URL must be an absolute http(s) URL ending in /api.");
  }

  return apiUrl.replace(/\/$/, "");
}

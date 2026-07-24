const localApiUrl = "http://localhost:3000/api";

/** Returns the same-origin API base used by server-rendered components. */
export function getServerApiUrl() {
  const apiUrl = process.env.NEXT_PUBLIC_SITE_URL
    ? `${process.env.NEXT_PUBLIC_SITE_URL}/api`
    : localApiUrl;

  return apiUrl.replace(/\/$/, "");
}

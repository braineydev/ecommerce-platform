import type { NextConfig } from "next";

const configuredApiUrl = process.env.BACKEND_API_URL;
const isAbsoluteHttpUrl = (value: string) => /^https?:\/\//.test(value);

if (configuredApiUrl && !isAbsoluteHttpUrl(configuredApiUrl)) {
  throw new Error("BACKEND_API_URL must be an absolute http(s) URL ending in /api.");
}

if (process.env.NODE_ENV === "production" && !configuredApiUrl) {
  throw new Error(
    "BACKEND_API_URL is required for production builds (for example, https://api.example.com/api).",
  );
}

// Browsers always use the same-origin `/api` proxy. The rewrite destination
// must be the backend's absolute URL—using `/api` here would rewrite a request
// back into Next.js and produce an HTML 404 response.
const apiBase = (configuredApiUrl || "http://localhost:5000/api").replace(
  /\/$/,
  "",
);

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "fzwejabpgytmodmoxcfy.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiBase}/:path*`,
      },
    ];
  },
};

export default nextConfig;

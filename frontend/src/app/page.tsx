import { Suspense } from "react";
import StorefrontClient from "../components/StorefrontClient";
import { API_PROXY_PATH, readApiJson } from "../lib/api";

export const dynamic = "force-static";
export const revalidate = 60;

function getAppOrigin() {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "http://localhost:3000";
}

async function fetchWithTimeout(input: string, init?: RequestInit) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

async function getInitialProducts() {
  try {
    const origin = getAppOrigin();
    const response = await fetchWithTimeout(
      `${origin}${API_PROXY_PATH}/products?limit=24`,
      {
        cache: "force-cache",
        next: { revalidate: 60 },
      },
    );

    if (!response.ok) {
      return [];
    }

    const payload = await readApiJson<{
      data?: Array<Record<string, unknown>>;
    }>(response);
    return Array.isArray(payload.data) ? payload.data : [];
  } catch {
    return [];
  }
}

async function getInitialCategories() {
  try {
    const origin = getAppOrigin();
    const response = await fetchWithTimeout(
      `${origin}${API_PROXY_PATH}/products/categories`,
      {
        cache: "force-cache",
        next: { revalidate: 60 },
      },
    );

    if (!response.ok) {
      return [];
    }

    const payload = await readApiJson<{
      data?: Array<Record<string, unknown>>;
    }>(response);
    return Array.isArray(payload.data) ? payload.data : [];
  } catch {
    return [];
  }
}

export default async function StorefrontPage() {
  const [initialProducts, initialCategories] = await Promise.all([
    getInitialProducts(),
    getInitialCategories(),
  ]);

  return (
    <Suspense fallback={<div className="min-h-screen bg-[#fcfcfb]" />}>
      <StorefrontClient
        initialProducts={
          initialProducts as Array<{
            id: string | number;
            slug?: string;
            name: string;
            description?: string;
            price: number | string;
            initial_price?: number | string;
            discounted_price?: number | string;
            stock?: number;
            images?: string[];
            image_name?: string | null;
            category?: { name?: string; slug?: string } | string | null;
            categories?: { name?: string; slug?: string } | string | null;
            category_name?: string;
          }>
        }
        initialCategories={
          initialCategories as Array<{
            id: string | number;
            name: string;
            slug: string;
          }>
        }
      />
    </Suspense>
  );
}

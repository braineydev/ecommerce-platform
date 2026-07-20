import type { MetadataRoute } from "next";
import { getServerApiUrl } from "../lib/server-api";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const apiUrl = getServerApiUrl();

const staticRoutes = [
  { url: siteUrl, changeFrequency: "daily" as const, priority: 1 },
  { url: `${siteUrl}/cart`, changeFrequency: "weekly" as const, priority: 0.6 },
  {
    url: `${siteUrl}/checkout`,
    changeFrequency: "monthly" as const,
    priority: 0.5,
  },
  {
    url: `${siteUrl}/login`,
    changeFrequency: "monthly" as const,
    priority: 0.4,
  },
  {
    url: `${siteUrl}/signup`,
    changeFrequency: "monthly" as const,
    priority: 0.4,
  },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = staticRoutes.map(route => ({
    ...route,
    lastModified: new Date(),
  }));

  try {
    const response = await fetch(`${apiUrl}/products`, {
      next: { revalidate: 300 },
    });
    if (!response.ok) return entries;
    const { data = [] } = await response.json();

    const productEntries = (
      data as Array<{
        id: string;
        slug?: string;
        updated_at?: string;
        images?: string[];
      }>
    ).map(product => ({
      url: `${siteUrl}/products/${product.slug || product.id}`,
      lastModified: product.updated_at || new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
      images: product.images?.filter(Boolean),
    }));

    const categoryEntries = [
      {
        url: `${siteUrl}/categories/tech`,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      },
      {
        url: `${siteUrl}/categories/accessories`,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      },
    ];

    return entries.concat(productEntries, categoryEntries);
  } catch {
    return entries;
  }
}

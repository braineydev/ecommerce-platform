import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductDetailClient from "./ProductDetailClient";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const apiUrl = process.env.NEXT_PUBLIC_SITE_URL
  ? `${process.env.NEXT_PUBLIC_SITE_URL}/api`
  : "http://localhost:3000/api";

type Product = {
  id: string | number;
  name: string;
  slug?: string;
  description?: string;
  price: number | string;
  stock?: number;
  images?: string[];
  category?: { name?: string; slug?: string } | string | null;
  meta_title?: string;
  meta_description?: string;
  updated_at?: string;
};

type ProductResponse = {
  product?: Product;
};

function seededNumberFromString(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i);
  return Math.abs(h);
}

function getDiscountPercent(id: string | number) {
  const seed = seededNumberFromString(String(id));
  return Math.ceil(5 + (seed % 26));
}

function getRating(id: string | number) {
  const seed = seededNumberFromString(String(id));
  const r = (seed % 401) / 1000;
  return +(4.4 + r).toFixed(1);
}

async function getProduct(id: string): Promise<Product | null> {
  try {
    const response = await fetch(`${apiUrl}/products/${id}`, {
      next: { revalidate: 60 },
    });
    if (!response.ok) return null;
    const payload = (await response.json()) as ProductResponse;
    return payload.product || null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const product = await getProduct(resolvedParams.id);

  if (!product) {
    return {
      title: "Product not found | TRIPPLE ORE",
      description: "The requested product could not be found.",
      alternates: { canonical: `/products/${resolvedParams.id}` },
    };
  }

  const title = product.meta_title || `${product.name} | TRIPPLE ORE`;
  const description =
    product.meta_description ||
    product.description ||
    `Shop ${product.name} at TRIPPLE ORE.`;
  const image =
    product.images?.[0] ||
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&q=80";

  return {
    title,
    description,
    alternates: { canonical: `/products/${product.slug || resolvedParams.id}` },
    openGraph: {
      title,
      description,
      type: "website",
      url: `${siteUrl}/products/${product.slug || resolvedParams.id}`,
      images: [{ url: image, width: 1200, height: 630, alt: product.name }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
    robots: { index: true, follow: true },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const product = await getProduct(resolvedParams.id);

  if (!product) {
    notFound();
  }

  const categoryLabel =
    typeof product.category === "string"
      ? product.category
      : product.category?.name || "Accessories";
  const categorySlug =
    typeof product.category === "object" && product.category?.slug
      ? product.category.slug
      : null;
  const rating = getRating(product.id);
  const discount = getDiscountPercent(product.id);

  return (
    <ProductDetailClient
      product={product}
      categoryLabel={categoryLabel}
      categorySlug={categorySlug}
      rating={rating}
      discount={discount}
    />
  );
}

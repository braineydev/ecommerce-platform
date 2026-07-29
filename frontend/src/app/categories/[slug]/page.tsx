import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductImageSrc } from "../../../lib/product-image";

const apiUrl = process.env.NEXT_PUBLIC_SITE_URL
  ? `${process.env.NEXT_PUBLIC_SITE_URL}/api`
  : "http://localhost:3000/api";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80";

function getSafeImageUrl(image?: string) {
  if (!image) return FALLBACK_IMAGE;

  try {
    const url = new URL(image);
    const allowedHosts = [
      "images.unsplash.com",
      "fzwejabpgytmodmoxcfy.supabase.co",
    ];
    return allowedHosts.includes(url.hostname) ? image : FALLBACK_IMAGE;
  } catch {
    return FALLBACK_IMAGE;
  }
}

type Category = {
  id?: string | number;
  name: string;
  slug?: string;
  description?: string;
};

type Product = {
  id: string | number;
  name: string;
  slug?: string;
  price: number | string;
  stock?: number;
  images?: string[];
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function getCategory(slug: string): Promise<Category | null> {
  try {
    const response = await fetch(`${apiUrl}/products/categories`, {
      next: { revalidate: 60 },
    });
    if (!response.ok) return null;
    const payload = await response.json();
    const categories = Array.isArray(payload?.data) ? payload.data : [];
    return (
      categories.find(
        (entry: Category) =>
          entry.slug === slug || slugify(entry.name) === slug,
      ) || null
    );
  } catch {
    return null;
  }
}

async function getCategoryProducts(
  categoryId: string | number,
): Promise<Product[]> {
  try {
    const response = await fetch(
      `${apiUrl}/products?category=${encodeURIComponent(String(categoryId))}`,
      {
        next: { revalidate: 60 },
      },
    );
    if (!response.ok) return [];
    const payload = await response.json();
    return Array.isArray(payload?.data) ? payload.data : [];
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const category = await getCategory(resolvedParams.slug);

  if (!category) {
    return {
      title: "Category not found | TRIPPLE ORE",
      description: "The requested category could not be found.",
      alternates: { canonical: `/categories/${resolvedParams.slug}` },
    };
  }

  const title = `${category.name} | TRIPPLE ORE`;
  const description =
    category.description || `Browse ${category.name} products at TRIPPLE ORE.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/categories/${category.slug || resolvedParams.slug}`,
    },
    openGraph: {
      title,
      description,
      type: "website",
      url: `${siteUrl}/categories/${category.slug || resolvedParams.slug}`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    robots: { index: true, follow: true },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;
  const category = await getCategory(resolvedParams.slug);

  if (!category) {
    notFound();
  }

  const products = await getCategoryProducts(category.id || "");
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${siteUrl}/` },
      {
        "@type": "ListItem",
        position: 2,
        name: category.name,
        item: `${siteUrl}/categories/${category.slug || resolvedParams.slug}`,
      },
    ],
  };

  return (
    <main className="min-h-screen bg-[#fcfcfb] px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <div className="mx-auto max-w-7xl">
        <nav
          className="mb-10 text-xs uppercase tracking-[0.12em] text-neutral-500"
          aria-label="Breadcrumb"
        >
          <Link href="/" className="hover:text-black">
            Home
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-700">{category.name}</span>
        </nav>

        <div className="mb-12 border-b border-neutral-200 pb-8">
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-500">
            Category
          </p>
          <h1 className="mt-3 text-4xl font-medium tracking-[-0.05em] text-neutral-950 sm:text-5xl">
            {category.name}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-neutral-600">
            {category.description ||
              `Discover premium ${category.name.toLowerCase()} products from TRIPPLE ORE.`}
          </p>
        </div>

        {products.length === 0 ? (
          <div className="border border-dashed border-neutral-300 bg-white p-12 text-center text-neutral-600">
            No products are available in this category right now.
          </div>
        ) : (
          <div className="grid gap-x-5 gap-y-8 md:grid-cols-2 xl:grid-cols-3">
            {products.map(product => (
              <Link
                key={product.id}
                href={`/products/${product.slug || product.id}`}
                className="group overflow-hidden border border-neutral-200 bg-white transition hover:border-neutral-400"
              >
                <div className="relative aspect-square bg-[#f1f0ed]">
                  <Image
                    src={getProductImageSrc(getSafeImageUrl(product.images?.[0]))}
                    alt={product.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover"
                  />
                </div>
                <div className="p-5">
                  <h2 className="text-base font-medium text-neutral-950">
                    {product.name}
                  </h2>
                  <p className="mt-2 text-sm text-neutral-600">
                    Ksh. {Number(product.price || 0).toLocaleString()}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

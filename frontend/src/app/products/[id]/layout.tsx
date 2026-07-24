import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const apiUrl = process.env.NEXT_PUBLIC_SITE_URL
  ? `${process.env.NEXT_PUBLIC_SITE_URL}/api`
  : "http://localhost:3000/api";

async function getProduct(identifier: string) {
  try {
    const response = await fetch(
      `${apiUrl}/products/${encodeURIComponent(identifier)}`,
      {
        next: { revalidate: 300 },
      },
    );
    if (!response.ok) return null;
    const result = await response.json();
    return result.product || null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product)
    return {
      title: "Product unavailable",
      robots: { index: false, follow: false },
    };

  const title = product.meta_title || product.name;
  const description =
    product.meta_description ||
    product.description ||
    `Shop ${product.name} at TRIPPLE ORE.`;
  const path = `/products/${product.slug || product.id}`;

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      title,
      description,
      url: path,
      images: product.images?.[0]
        ? [{ url: product.images[0], alt: product.name }]
        : [],
    },
  };
}

export default async function ProductLayout({
  children,
  params,
}: Readonly<{ children: React.ReactNode; params: Promise<{ id: string }> }>) {
  const { id } = await params;
  const product = await getProduct(id);
  const productUrl = product
    ? `${siteUrl}/products/${product.slug || product.id}`
    : undefined;
  const schema =
    product && productUrl
      ? {
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.name,
          description: product.meta_description || product.description,
          image: product.images || [],
          sku: String(product.id),
          offers: {
            "@type": "Offer",
            url: productUrl,
            priceCurrency: "KES",
            price: Number(product.price || 0),
            availability:
              product.stock > 0
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock",
          },
        }
      : null;

  return (
    <>
      {schema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schema).replace(/</g, "\\u003c"),
          }}
        />
      )}
      {children}
    </>
  );
}

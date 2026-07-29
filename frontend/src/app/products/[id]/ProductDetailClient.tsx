"use client";

import { ArrowLeft, ShoppingBag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useCart } from "../../../context/CartContext";
import { getProductImageSrc } from "../../../lib/product-image";

type ProductDetailClientProps = {
  product: {
    id: string | number;
    name: string;
    description?: string;
    price: number | string;
    initial_price?: number | string;
    discounted_price?: number | string;
    stock?: number;
    images?: string[];
    image_name?: string | null;
    category?: { name?: string; slug?: string } | string | null;
    slug?: string;
    meta_title?: string;
    meta_description?: string;
  };
  categoryLabel: string;
  categorySlug: string | null;
  rating: number;
  discount: number;
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

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=900&q=80";

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

export default function ProductDetailClient({
  product,
  categoryLabel,
  categorySlug,
  rating,
  discount,
}: ProductDetailClientProps) {
  const router = useRouter();
  const { addToCart } = useCart();
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const descriptionText =
    product.description || "A premium product from TRIPPLE ORE.";
  const availableStock = Math.max(0, Number(product.stock || 0));
  const discountedPrice = Number(
    product.discounted_price ?? product.price ?? 0,
  );
  const initialPrice = Number(product.initial_price ?? discountedPrice);
  const previewDescription =
    descriptionText.length > 140 && !showFullDescription
      ? `${descriptionText.slice(0, 140)}...`
      : descriptionText;
  const originalPrice =
    initialPrice > 0
      ? initialPrice
      : Number(product.price || 0) * (1 + discount / 100);
  const productImages =
    product.images?.filter(Boolean).length
      ? product.images.filter(Boolean)
      : product.image_name
        ? [product.image_name]
        : [];
  const imageUrl = getSafeImageUrl(productImages[0]);

  const schema = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      image: productImages.length > 0 ? productImages : [imageUrl],
      description: descriptionText,
      offers: {
        "@type": "Offer",
        priceCurrency: "KES",
        price: discountedPrice,
        availability:
          availableStock > 0
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
      },
    }),
    [
      availableStock,
      descriptionText,
      imageUrl,
      productImages,
      product.name,
      product.price,
    ],
  );

  const handleAddToCart = () => {
    if (availableStock < 1) return;
    addToCart({
      id: product.id,
      name: product.name,
      price: discountedPrice,
      quantity,
      image: productImages[0],
    });
  };

  return (
    <div className="min-h-screen bg-[#fcfcfb]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <div className="sticky top-4 z-40 mb-6 border-b border-neutral-200 bg-[#fcfcfb]/95 px-4 py-3 backdrop-blur md:mb-8 md:px-6">
        <button
          onClick={() => router.push("/")}
          className="w-fit inline-flex items-center text-[11px] font-medium uppercase tracking-[0.12em] text-neutral-600 transition hover:text-neutral-950"
        >
          <ArrowLeft size={16} className="mr-2" /> Back to products
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-28 md:px-6 md:pb-16 lg:px-8">
        <nav
          className="mb-7 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.1em] text-neutral-500"
          aria-label="Breadcrumb"
        >
          <Link href="/" className="hover:text-black">
            Home
          </Link>
          {categorySlug ? (
            <>
              <span>/</span>
              <Link
                href={`/categories/${categorySlug}`}
                className="hover:text-black"
              >
                {categoryLabel}
              </Link>
            </>
          ) : null}
          <span>/</span>
          <span className="text-gray-700">{product.name}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="overflow-hidden border border-neutral-200 bg-[#f1f0ed] p-3">
            <div className="relative h-105 md:h-140 w-full overflow-hidden">
              <Image
                src={getProductImageSrc(imageUrl)}
                alt={product.name}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
                className="object-cover"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="border border-neutral-200 bg-white p-6">
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-500">
                {typeof product.category === "string"
                  ? product.category
                  : product.category?.name || categoryLabel || "Accessories"}
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-[#101c18] md:text-4xl">
                {product.name}
              </h1>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-1 border border-neutral-200 px-3 py-1 text-sm font-medium text-neutral-700">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    className="fill-current text-[#d9a441]"
                    aria-hidden
                  >
                    <path d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.787 1.402 8.168L12 18.896l-7.336 3.869 1.402-8.168L.132 9.21l8.2-1.192z" />
                  </svg>
                  <span>{rating}</span>
                </div>
                {discount > 0 && (
                  <span className="inline-flex items-center border border-[#c9ddd2] bg-[#edf5f0] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.1em] text-[#58736a]">
                    Save {discount}%
                  </span>
                )}
              </div>

              <div className="mt-5 border-t border-neutral-200 pt-5">
                <p className="text-sm leading-6 text-neutral-600">
                  {previewDescription}
                </p>
                {descriptionText.length > 140 && (
                  <button
                    type="button"
                    onClick={() => setShowFullDescription(!showFullDescription)}
                    className="mt-3 text-sm font-semibold text-black underline-offset-4 hover:underline"
                  >
                    {showFullDescription ? "Show less" : "Show more"}
                  </button>
                )}
              </div>
            </div>

            <div className="border border-neutral-200 bg-white p-6">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-neutral-500">
                    Price
                  </p>
                  <p className="mt-1 text-3xl font-medium tracking-[-0.04em] text-neutral-950">
                    Ksh. {discountedPrice.toLocaleString()}
                  </p>
                  {discount > 0 && (
                    <p className="mt-1 text-sm text-gray-400 line-through">
                      Ksh. {Math.round(originalPrice).toLocaleString()}
                    </p>
                  )}
                </div>
                <div className="border border-neutral-300 px-3 py-1 text-xs font-medium text-neutral-700">
                  {availableStock > 0
                    ? `${availableStock} in stock`
                    : "Out of stock"}
                </div>
              </div>

              <div className="mt-5 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">
                  Quantity
                </p>
                <div className="flex w-fit items-center gap-3 border border-neutral-200 bg-[#f1f0ed] p-1">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="flex h-10 w-10 items-center justify-center transition-colors hover:bg-white"
                  >
                    −
                  </button>
                  <span className="w-8 text-center font-semibold text-black">
                    {quantity}
                  </span>
                  <button
                    onClick={() =>
                      setQuantity(Math.min(availableStock, quantity + 1))
                    }
                    disabled={quantity >= availableStock}
                    className="flex h-10 w-10 items-center justify-center transition-colors hover:bg-white"
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={availableStock < 1}
                className="mt-6 hidden w-full items-center justify-center bg-[#171716] px-6 py-4 text-[11px] font-medium uppercase tracking-[0.13em] text-white transition hover:bg-neutral-700 md:flex lg:mt-6"
              >
                <ShoppingBag size={18} strokeWidth={1.7} className="mr-2" />{" "}
                {availableStock < 1 ? "Out of stock" : "Add to cart"}
              </button>

              <a
                href="https://wa.me/254721469696"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex w-full items-center justify-center bg-[#25D366] px-6 py-4 text-[11px] font-medium uppercase tracking-[0.13em] text-white shadow-[0_12px_28px_rgba(37,211,102,0.22)] transition hover:bg-[#20ba5a]"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.272-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421-7.403h-.004a9.87 9.87 0 00-4.935 1.244c-1.5.867-2.798 2.154-3.632 3.761-1.647 3.282-.235 7.14 2.903 8.781 1.402.806 2.935 1.213 4.504 1.213 1.614 0 3.184-.436 4.605-1.284 3.122-1.837 4.56-5.66 3.233-8.938-.766-1.937-2.165-3.354-3.802-4.131-1.639-.778-3.535-.77-5.143.007m8.989-3.738h-.007a12.016 12.016 0 00-11.405 6.546 11.99 11.99 0 006.095 15.648 11.993 11.993 0 009.381-1.697 12.005 12.005 0 004.094-9.12 11.993 11.993 0 00-8.158-11.377m0-1.439A13.45 13.45 0 0012 .5C5.597.5.5 5.597.5 12S5.597 23.5 12 23.5s11.5-5.097 11.5-11.5S18.403.5 12 .5z" />
                </svg>
                WhatsApp Help
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-neutral-200 bg-[#fcfcfb]/95 p-3 backdrop-blur md:hidden">
        <button
          onClick={handleAddToCart}
          disabled={availableStock < 1}
          className="flex w-full items-center justify-center bg-[#171716] px-6 py-4 text-[11px] font-medium uppercase tracking-[0.13em] text-white transition hover:bg-neutral-700 disabled:bg-neutral-400"
        >
          <ShoppingBag size={18} strokeWidth={1.7} className="mr-2" />
          {availableStock < 1 ? "Out of stock" : "Add to cart"}
        </button>
      </div>
    </div>
  );
}

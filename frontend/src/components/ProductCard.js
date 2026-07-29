import { Plus } from "lucide-react";
import Link from "next/link";
import { getProductImageSrc } from "../lib/product-image";

function seededNumberFromString(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i);
  return Math.abs(h);
}

function getDiscountPercent(id) {
  const seed = seededNumberFromString(String(id));
  return Math.ceil(5 + (seed % 26));
}

function getRating(id) {
  const seed = seededNumberFromString(String(id));
  const r = (seed % 401) / 1000;
  return +(4.4 + r).toFixed(1);
}

export default function ProductCard({ product }) {
  const productHref = `/products/${product.id}`;
  const image =
    Array.isArray(product.images) && product.images.length > 0
      ? product.images[0]
      : null;
  const isInStock = Number(product.stock || 0) > 0;
  const discount = getDiscountPercent(product.id);
  const originalPrice = Number(product.price) * (1 + discount / 100);
  const displayOriginal = originalPrice > Number(product.price);
  const rating = getRating(product.id);

  return (
    <div className="group flex flex-col overflow-hidden border border-[#c9ddd2] bg-white shadow-[0_8px_24px_rgba(10,48,42,0.055)] transition-all duration-300 ease-in-out hover:-translate-y-1 hover:border-[#25806e] hover:shadow-[0_18px_36px_rgba(10,48,42,0.13)]">
      <Link
        href={productHref}
        className="relative aspect-square w-full overflow-hidden"
      >
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={getProductImageSrc(image)}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <span className="text-slate-500 font-medium">Image unavailable</span>
        )}

        <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-transparent to-neutral-950/15" />

        {isInStock && product.stock < 15 && (
          <div className="absolute left-3 bottom-3 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700 shadow-sm">
            Only {product.stock} left
          </div>
        )}
        {!isInStock && (
          <div className="absolute left-3 bottom-3 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
            Out of stock
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="space-y-2">
          <Link href={productHref}>
            <h3 className="text-base font-semibold text-[#101c18] transition-colors hover:text-[#25806e]">
              {product.name}
            </h3>
          </Link>
          <p className="text-sm text-slate-500">
            {product.category?.name ||
              product.categories?.name ||
              "Electronics"}
          </p>
        </div>

        <div className="mt-auto flex items-end justify-between gap-4">
          <div>
            <div className="flex items-baseline gap-3">
              <span className="text-xl font-medium tracking-[-0.03em] text-neutral-950">
                Ksh. {Number(product.price).toLocaleString()}
              </span>
              {displayOriginal && (
                <span className="text-sm text-slate-400 line-through">
                  Ksh. {Math.round(originalPrice).toLocaleString()}
                </span>
              )}
              {discount > 0 && (
                <span className="inline-block border border-neutral-200 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em] text-neutral-600">
                  {discount}% OFF
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-sm mt-1 text-slate-600">
              <span className="flex items-center" aria-hidden>
                {Array.from({ length: 5 }).map((_, i) => {
                  const diff = rating - i;
                  const gradId = `halfGrad-${product.id}-${i}`;
                  if (diff >= 1) {
                    return (
                      <svg
                        key={i}
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        className="text-yellow-400 fill-current mr-0.5"
                        aria-hidden
                      >
                        <path d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.787 1.402 8.168L12 18.896l-7.336 3.869 1.402-8.168L.132 9.21l8.2-1.192z" />
                      </svg>
                    );
                  }
                  if (diff >= 0.5) {
                    return (
                      <svg
                        key={i}
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        className="mr-0.5"
                        aria-hidden
                      >
                        <defs>
                          <linearGradient id={gradId} x1="0" x2="1">
                            <stop offset="50%" stopColor="#f6c94d" />
                            <stop offset="50%" stopColor="#e5e7eb" />
                          </linearGradient>
                        </defs>
                        <path
                          d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.787 1.402 8.168L12 18.896l-7.336 3.869 1.402-8.168L.132 9.21l8.2-1.192z"
                          fill={`url(#${gradId})`}
                        />
                      </svg>
                    );
                  }
                  return (
                    <svg
                      key={i}
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      className="text-gray-200 fill-current mr-0.5"
                      aria-hidden
                    >
                      <path d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.787 1.402 8.168L12 18.896l-7.336 3.869 1.402-8.168L.132 9.21l8.2-1.192z" />
                    </svg>
                  );
                })}
              </span>
              <span>{rating}</span>
            </div>
          </div>
          <button
            disabled={!isInStock}
            className="min-h-12 min-w-12 bg-[#0A302A] p-3 text-white shadow-[0_8px_18px_rgba(10,48,42,0.16)] transition duration-200 ease-in-out hover:bg-[#176052] disabled:bg-slate-300"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}

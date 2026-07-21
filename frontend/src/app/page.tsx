"use client";

import { ArrowRight, Heart, Package } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { API_PROXY_PATH, readApiJson } from "../lib/api";

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

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function normalizeCategorySlug(value: string) {
  const slug = slugify(value);
  if (slug === "phone") return "phones";
  if (slug === "home-appliances" || slug === "home-appliance") {
    return "appliances";
  }
  return slug;
}

type Product = {
  id: string | number;
  slug?: string;
  name: string;
  description?: string;
  price: number | string;
  initial_price?: number | string;
  discounted_price?: number | string;
  stock?: number;
  images?: string[];
  category?: { name?: string; slug?: string } | string | null;
  categories?: { name?: string; slug?: string } | string | null;
  category_name?: string;
};

type Category = {
  id: string | number;
  name: string;
  slug: string;
};

export default function Storefront() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#fcfcfb]" />}>
      <StorefrontContent />
    </Suspense>
  );
}

function StorefrontContent() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [wishlist, setWishlist] = useState<Array<string | number>>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const fetchProducts = async (keyword = "") => {
    try {
      const apiBase = API_PROXY_PATH;
      const query = new URLSearchParams();
      const trimmedKeyword = keyword.trim();
      if (trimmedKeyword) query.set("search", trimmedKeyword);

      const res = await fetch(
        `${apiBase}/products${query.toString() ? `?${query.toString()}` : ""}`,
        {
          cache: "no-store",
        },
      );
      const data = await readApiJson<
        { data?: Product[]; products?: Product[] } | Product[]
      >(res);

      const fetchedProducts = Array.isArray(data)
        ? data
        : data.data || data.products || [];
      const normalizedProducts = Array.isArray(fetchedProducts)
        ? fetchedProducts
        : [];
      setProducts(normalizedProducts);
      return normalizedProducts;
    } catch (error) {
      console.error("Error fetching products:", error);
      setProducts([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_PROXY_PATH}/products/categories`, {
        cache: "no-store",
      });
      const data = await readApiJson<{ data?: Category[] }>(res);
      setCategories(Array.isArray(data.data) ? data.data : []);
    } catch (error) {
      // Products remain browsable if the optional category menu is unavailable.
      console.error("Error fetching categories:", error);
    }
  };

  useEffect(() => {
    void fetchProducts();
    void fetchCategories();
  }, []);

  useEffect(() => {
    const syncCategoryFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      const selectedCategory =
        params.get("category")?.trim().toLowerCase() || null;
      setActiveCategory(selectedCategory);
    };

    syncCategoryFromUrl();

    window.addEventListener("popstate", syncCategoryFromUrl);
    return () => window.removeEventListener("popstate", syncCategoryFromUrl);
  }, []);

  const productMatchesCategory = (product: Product, categorySlug: string) => {
    const productCategorySlugs = [
      product.category_name,
      typeof product.category === "string"
        ? product.category
        : product.category?.name,
      typeof product.categories === "string"
        ? product.categories
        : product.categories?.name,
      typeof product.category === "object" && product.category?.slug
        ? product.category.slug
        : null,
      typeof product.categories === "object" && product.categories?.slug
        ? product.categories.slug
        : null,
    ]
      .filter(Boolean)
      .map(value => normalizeCategorySlug(String(value)));

    return productCategorySlugs.includes(normalizeCategorySlug(categorySlug));
  };

  const visibleProducts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return products.filter(product => {
      const matchesCategory =
        !activeCategory || productMatchesCategory(product, activeCategory);
      const haystack = [
        product.name,
        product.slug,
        product.description,
        typeof product.category === "string"
          ? product.category
          : product.category?.name,
        typeof product.categories === "string"
          ? product.categories
          : product.categories?.name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchesSearch = !query || haystack.includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, products, searchTerm]);

  useEffect(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) {
      setSuggestions(visibleProducts.slice(0, 8));
      setShowSuggestions(visibleProducts.length > 0);
      return;
    }

    const matches = visibleProducts.filter(product => {
      const haystack = [product.name, product.slug, product.description]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });

    setSuggestions(matches.slice(0, 8));
    setShowSuggestions(matches.length > 0);
  }, [searchTerm, visibleProducts]);

  const handleSearch = async (event?: React.FormEvent) => {
    event?.preventDefault();
    setIsLoading(true);
    await fetchProducts(searchTerm);
  };

  const acceptSuggestion = () => {
    const suggestion = suggestions[0];
    if (!suggestion) return;

    const nextValue = suggestion.name;
    setSearchTerm(nextValue);
    setShowSuggestions(false);
  };

  const resetToShop = () => {
    setSearchTerm("");
    setShowSuggestions(false);
    setActiveCategory(null);
    router.replace("/#shop");
  };

  const changeCategory = (category: string | null) => {
    const nextCategory = category?.trim().toLowerCase() || null;
    setActiveCategory(nextCategory);

    const nextParams = new URLSearchParams(window.location.search);

    if (nextCategory) {
      nextParams.set("category", nextCategory);
    } else {
      nextParams.delete("category");
    }

    const queryString = nextParams.toString();
    router.push(queryString ? `/?${queryString}#shop` : "/#shop");
  };

  const toggleWishlist = (productId: string | number) => {
    setWishlist(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId],
    );
  };

  const categoryOptions = [
    { label: "All", value: null },
    ...categories.map(category => ({
      label: category.name,
      value: category.slug,
    })),
  ];

  return (
    <div className="min-h-screen bg-[#FBFBFB] font-sans">
      <section className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 sm:pt-6 lg:px-8">
        <div className="grid overflow-hidden border border-[#c9ddd2] bg-[#e2eee7] shadow-[0_18px_45px_rgba(10,48,42,0.08)] lg:grid-cols-[1.02fr_0.98fr]">
          <div className="flex min-h-[300px] flex-col justify-between px-6 py-7 sm:min-h-[330px] sm:px-10 sm:py-9 lg:min-h-[350px] lg:px-12 lg:py-10">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#25806e]">
                Selected technology
              </p>
              <h1 className="mt-5 max-w-md text-[2.55rem] font-medium leading-[0.94] tracking-[-0.055em] text-[#0A302A] sm:text-6xl lg:text-[4.35rem]">
                Better tech,
                <br />
                beautifully chosen.
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-6">
              <a
                href="#shop"
                className="inline-flex items-center gap-3 border-b-2 border-[#d9a441] pb-1.5 text-[11px] font-bold uppercase tracking-[0.13em] text-[#0A302A] transition-colors hover:text-[#25806e]"
              >
                Shop collection <ArrowRight size={15} strokeWidth={1.5} />
              </a>
              <span className="text-[11px] uppercase tracking-[0.12em] text-neutral-500">
                Phones · Home · Audio
              </span>
            </div>
          </div>
          <div className="relative min-h-[230px] overflow-hidden bg-[#d9d7d0] sm:min-h-[290px] lg:min-h-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1400&q=90"
              alt="A minimalist workspace with a laptop"
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-[#0A302A]/25" />
            <div className="absolute bottom-5 left-5 border-l border-white/80 pl-3 text-white sm:bottom-7 sm:left-7">
              <p className="text-[10px] font-medium uppercase tracking-[0.16em]">
                Curated for your space
              </p>
            </div>
          </div>
        </div>
      </section>

      <main
        id="shop"
        className="mx-auto max-w-7xl px-4 pb-16 pt-12 sm:px-6 sm:pt-14 lg:px-8"
      >
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-medium tracking-[-0.04em] text-neutral-950">
              Shop the latest
            </h2>
          </div>

          <div className="w-full max-w-md">
            <form onSubmit={handleSearch} className="flex w-full gap-2">
              <div className="relative flex-1">
                <input
                  value={searchTerm}
                  onChange={event => {
                    setSearchTerm(event.target.value);
                    setShowSuggestions(Boolean(event.target.value.trim()));
                  }}
                  onFocus={() =>
                    setShowSuggestions(Boolean(suggestions.length))
                  }
                  onKeyDown={async event => {
                    if (event.key !== "Enter") return;
                    const query = searchTerm.trim();
                    if (!query) return;

                    const suggestion = suggestions[0];
                    if (
                      suggestion &&
                      suggestion.name
                        .toLowerCase()
                        .startsWith(query.toLowerCase())
                    ) {
                      event.preventDefault();
                      acceptSuggestion();
                      return;
                    }

                    event.preventDefault();
                    await handleSearch();
                  }}
                  placeholder="Search products"
                  className="w-full border border-neutral-300 bg-white px-4 py-3 pr-24 text-sm text-neutral-900 outline-none focus:border-neutral-950"
                />
                {showSuggestions && suggestions.length > 0 && (
                  <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center overflow-hidden pr-24">
                    <span className="truncate text-sm text-gray-300">
                      {suggestions[0].name
                        .toLowerCase()
                        .startsWith(searchTerm.trim().toLowerCase())
                        ? suggestions[0].name.slice(searchTerm.trim().length)
                        : ""}
                    </span>
                  </div>
                )}
              </div>
              <button
                type="submit"
                className="bg-[#0A302A] px-5 py-3 text-[11px] font-bold uppercase tracking-[0.12em] text-white shadow-[0_8px_18px_rgba(10,48,42,0.16)] hover:bg-[#176052]"
              >
                Search
              </button>
            </form>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {categoryOptions.map(option => {
            const isActive = activeCategory === option.value;
            return (
              <button
                key={option.label}
                type="button"
                onClick={() => changeCategory(option.value)}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                  isActive
                    ? "border-[#0A302A] bg-[#0A302A] text-white shadow-[0_5px_14px_rgba(10,48,42,0.18)]"
                    : "border-[#c9ddd2] bg-white text-[#0A302A] hover:border-[#25806e] hover:bg-[#e2eee7]"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        {(searchTerm || activeCategory) &&
          visibleProducts.length > 0 &&
          !isLoading && (
            <div className="mb-6 flex justify-start">
              <button
                type="button"
                onClick={() => resetToShop()}
                className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
              >
                Back to shop
              </button>
            </div>
          )}

        {isLoading ? (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="animate-pulse">
                <div className="mb-4 aspect-4/5 rounded-3xl bg-gray-200"></div>
                <div className="mb-2 h-4 w-3/4 rounded bg-gray-200"></div>
                <div className="h-4 w-1/4 rounded bg-gray-200"></div>
              </div>
            ))}
          </div>
        ) : visibleProducts.length === 0 ? (
          <div className="py-20 text-center">
            <Package size={48} className="mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-bold text-gray-900">
              Check back soon!
            </h3>
            <p className="text-gray-500">
              We are currently restocking our inventory.
            </p>
            {(searchTerm || activeCategory) && (
              <p className="mt-2 text-sm text-gray-400">
                Try a broader keyword or reset the filters.
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {visibleProducts.map(product => {
              const rating = getRating(product.id);
              const discountedPrice = Number(
                product.discounted_price ?? product.price ?? 0,
              );
              const initialPrice = Number(
                product.initial_price ?? discountedPrice,
              );
              const hasDiscount = initialPrice > discountedPrice;
              const discount = hasDiscount
                ? Math.ceil(
                    ((initialPrice - discountedPrice) / initialPrice) * 100,
                  )
                : 0;

              return (
                <Link
                  key={product.id}
                  href={`/products/${product.slug || product.id}`}
                  className="group cursor-pointer"
                >
                  <div className="flex h-full flex-col overflow-hidden border border-[#c9ddd2] bg-white shadow-[0_8px_24px_rgba(10,48,42,0.055)] transition-all duration-300 hover:-translate-y-1 hover:border-[#25806e] hover:shadow-[0_18px_36px_rgba(10,48,42,0.13)]">
                    <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-[#f1f0ed]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={
                          product.images?.[0] ||
                          "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80"
                        }
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent to-black/10" />

                      <button
                        onClick={e => {
                          e.preventDefault();
                          toggleWishlist(product.id);
                        }}
                        className="absolute right-4 top-4 z-10 border border-[#c9ddd2] bg-white p-2.5 shadow-sm transition-all duration-200 hover:scale-105 hover:bg-[#e2eee7]"
                      >
                        <Heart
                          size={20}
                          className={`transition-colors ${
                            wishlist.includes(product.id)
                              ? "fill-rose-500 text-rose-500"
                              : "text-gray-400 hover:text-rose-400"
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex flex-1 flex-col space-y-3 p-4 sm:p-5">
                      <div className="space-y-2">
                        <h3 className="line-clamp-2 text-sm font-semibold text-[#101c18] transition-colors sm:text-base group-hover:text-[#25806e]">
                          {product.name}
                        </h3>

                        <div className="flex items-center gap-2">
                          <div className="flex items-center">
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              className="fill-current text-amber-400"
                              aria-hidden
                            >
                              <path d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.787 1.402 8.168L12 18.896l-7.336 3.869 1.402-8.168L.132 9.21l8.2-1.192z" />
                            </svg>
                          </div>
                          <span className="text-sm font-medium text-gray-700">
                            {rating}
                          </span>
                        </div>
                      </div>

                      <div className="mt-auto space-y-2">
                        <div className="flex items-baseline gap-2">
                          <span className="text-lg font-medium tracking-[-0.03em] text-neutral-950 sm:text-xl">
                            Ksh. {discountedPrice.toLocaleString()}
                          </span>
                          {hasDiscount && (
                            <span className="text-xs font-medium text-gray-500 line-through sm:text-sm">
                              Ksh. {initialPrice.toLocaleString()}
                            </span>
                          )}
                          {discount > 0 && (
                            <span className="text-xs font-medium text-gray-500 sm:text-sm">
                              Save {discount}%
                            </span>
                          )}
                        </div>

                        {product.stock && product.stock < 15 ? (
                          <p className="text-xs text-gray-600">
                            Only {product.stock} left
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

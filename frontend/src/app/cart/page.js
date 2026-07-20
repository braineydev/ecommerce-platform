"use client";

import { ArrowLeft, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "../../context/CartContext";

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

export default function CartPage() {
  const router = useRouter();
  const { cart, updateQuantity, removeFromCart, getCartTotal, getCartCount } =
    useCart();
  const [lastViewedProduct, setLastViewedProduct] = useState(null);

  useEffect(() => {
    const productId = sessionStorage.getItem("lastViewedProduct");
    setLastViewedProduct(productId);
  }, []);

  const handleBack = () => {
    if (lastViewedProduct) {
      router.push(`/products/${lastViewedProduct}`);
    } else {
      router.push("/");
    }
  };

  const subtotal = getCartTotal();
  const shipping = subtotal > 0 ? 200 : 0;
  const total = subtotal + shipping;
  const cartCount = getCartCount();

  if (cart.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6 lg:px-8">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[1.5rem] border border-neutral-200 bg-[#f7f3eb] text-neutral-600">
          <ShoppingBag size={40} />
        </div>
        <h1 className="mb-4 text-3xl font-medium tracking-[-0.05em] text-neutral-950">
          Your cart is empty
        </h1>
        <p className="mx-auto mb-8 max-w-md text-gray-500">
          Looks like you haven't added anything to your cart yet. Explore our
          premium catalog to find your next tech upgrade.
        </p>
        <Link
          href="/"
          className="inline-flex items-center rounded-full bg-[#171716] px-8 py-4 text-[11px] font-medium uppercase tracking-[0.13em] text-white transition-colors hover:bg-neutral-700"
        >
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfcfb]">
      <div className="mx-auto max-w-7xl px-4 py-8 pb-28 sm:px-6 sm:py-16 lg:px-8">
        <div className="mb-8 border-b border-neutral-200 pb-5 sm:mb-10">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <button
              onClick={handleBack}
              className="inline-flex items-center font-medium text-gray-600 transition-colors hover:text-gray-900"
              title="Go back"
            >
              <ArrowLeft size={20} className="mr-2 text-gray-600" />
              Back
            </button>
            <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-6">
              <h1 className="text-2xl font-medium tracking-[-0.05em] text-neutral-950 sm:text-4xl">
                Shopping Cart
              </h1>
              {cartCount > 0 && (
                <span className="border border-neutral-950 bg-[#171716] px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.1em] text-white">
                  {cartCount} item{cartCount === 1 ? "" : "s"} in cart
                </span>
              )}
            </div>
            <div className="w-24" />
          </div>
        </div>

        <div className="flex flex-col gap-12 lg:flex-row lg:gap-16">
          <div className="flex flex-col gap-6 sm:gap-8 lg:w-2/3">
            {cart.map(item => (
              <div
                key={item.id}
                className="flex gap-4 border border-neutral-200 bg-white p-3 sm:gap-6 sm:p-5"
              >
                <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden bg-[#f1f0ed] sm:h-36 sm:w-36">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={
                      item.images?.[0] ||
                      item.image ||
                      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=300&q=80"
                    }
                    alt={item.name}
                    className="h-full w-full object-cover"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent to-slate-950/10" />
                  {(() => {
                    const discount = getDiscountPercent(item.id);
                    return (
                      <div className="absolute left-1.5 top-1.5 inline-flex bg-neutral-950 px-2 py-1 text-[9px] font-medium uppercase tracking-[0.1em] text-white sm:left-2 sm:top-2 sm:text-[10px]">
                        {discount}% OFF
                      </div>
                    );
                  })()}
                </div>

                <div className="flex min-w-0 flex-1 flex-col justify-center">
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <Link
                        href={`/products/${item.id}`}
                        className="line-clamp-2 pr-2 text-sm font-medium text-neutral-950 transition-colors hover:text-neutral-500 sm:text-lg"
                      >
                        {item.name}
                      </Link>
                      {(() => {
                        const rating = getRating(item.id);
                        const rounded = Math.round(rating);
                        return (
                          <div className="hidden items-center gap-1 text-xs text-slate-600 sm:flex">
                            <span className="flex items-center">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <svg
                                  key={i}
                                  width="12"
                                  height="12"
                                  viewBox="0 0 24 24"
                                  className={`${i < rounded ? "fill-current text-yellow-400" : "fill-current text-gray-200"} mr-0.5`}
                                  aria-hidden
                                >
                                  <path d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.787 1.402 8.168L12 18.896l-7.336 3.869 1.402-8.168L.132 9.21l8.2-1.192z" />
                                </svg>
                              ))}
                            </span>
                            <span className="font-medium">{rating}</span>
                          </div>
                        );
                      })()}
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-neutral-100 hover:text-red-500"
                      aria-label="Remove item"
                      type="button"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  <p className="mb-3 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-xs text-neutral-500 sm:mb-4 sm:text-sm">
                    <span>Ksh. {Number(item.price).toLocaleString()} each</span>
                    {(() => {
                      const discount = getDiscountPercent(item.id);
                      const original = Math.round(
                        Number(item.price) * (1 + discount / 100),
                      );
                      return (
                        <span className="text-xs text-gray-400 line-through">
                          Ksh. {original.toLocaleString()}
                        </span>
                      );
                    })()}
                  </p>

                  <div className="mt-auto flex items-center justify-between gap-4">
                    <div className="flex items-center border border-neutral-200 bg-[#f1f0ed]">
                      <button
                        onClick={() =>
                          updateQuantity(item.id, item.quantity - 1)
                        }
                        className="p-2.5 text-gray-500 transition-colors hover:bg-white hover:text-gray-900 sm:p-3"
                        type="button"
                        aria-label="Decrease quantity"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="w-8 text-center text-sm font-medium text-gray-900 sm:w-10">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(item.id, item.quantity + 1)
                        }
                        disabled={item.quantity >= item.stock}
                        className="p-2.5 text-gray-500 transition-colors hover:bg-white hover:text-gray-900 disabled:opacity-30 sm:p-3"
                        type="button"
                        aria-label="Increase quantity"
                      >
                        <Plus size={16} />
                      </button>
                    </div>

                    <span className="whitespace-nowrap text-sm font-medium text-neutral-950 sm:text-lg">
                      Ksh. {(item.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="lg:w-1/3">
            <div className="sticky top-24 border border-neutral-200 bg-[#f1f0ed] p-6 sm:p-8">
              <h2 className="mb-6 text-xl font-medium tracking-[-0.03em] text-neutral-950">
                Order Summary
              </h2>

              <div className="mb-6 space-y-4 border-b border-neutral-200 pb-6 text-gray-500">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-medium text-gray-900">
                    Ksh. {subtotal.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated shipping (within Nairobi)</span>
                  <span className="font-medium text-gray-900">
                    Approx. KSh 200
                  </span>
                </div>
              </div>

              <div className="mb-8 flex items-center justify-between">
                <span className="text-lg font-bold text-gray-900">Total</span>
                <span className="text-3xl font-extrabold text-gray-900">
                  Ksh. {total.toLocaleString()}
                </span>
              </div>

              <Link
                href="/checkout"
                className="hidden w-full items-center justify-center bg-[#171716] px-6 py-4 text-[11px] font-medium uppercase tracking-[0.13em] text-white transition-colors hover:bg-neutral-700 md:inline-flex"
              >
                Proceed to Checkout
              </Link>
            </div>
          </div>
        </div>
      </div>
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-neutral-200 bg-[#fcfcfb]/95 p-3 backdrop-blur md:hidden">
        <Link
          href="/checkout"
          className="flex w-full items-center justify-center bg-[#171716] px-6 py-4 text-[11px] font-medium uppercase tracking-[0.13em] text-white transition-colors hover:bg-neutral-700"
        >
          Proceed to Checkout
        </Link>
      </div>
    </div>
  );
}

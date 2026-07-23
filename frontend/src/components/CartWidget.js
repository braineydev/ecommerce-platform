"use client";

import { ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useCart } from "../context/CartContext";

export default function CartWidget() {
  const { getCartCount } = useCart();
  const count = getCartCount();

  return (
    <div className="fixed right-5 bottom-48 z-50">
      <Link
        href="/cart"
        aria-label="Open cart"
        title="Cart"
        className="relative flex h-14 w-14 items-center justify-center rounded-full bg-black p-3 text-white shadow-lg transition duration-200 ease-in-out hover:scale-[1.05]"
      >
        <ShoppingCart size={20} />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-red-600 px-2 text-xs font-semibold text-white">
            {count}
          </span>
        )}
      </Link>
    </div>
  );
}

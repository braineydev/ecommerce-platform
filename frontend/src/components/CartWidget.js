"use client";
import { ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useCart } from "../context/CartContext";

export default function CartWidget() {
  const { getCartCount } = useCart();
  const count = getCartCount();

  return (
    <Link
      href="/cart"
      aria-label="Open cart"
      className="fixed z-50 right-4 bottom-28 min-h-14 min-w-14 rounded-full bg-slate-950 text-white p-4 shadow-[0_20px_55px_rgba(15,23,42,0.24)] transition duration-200 ease-in-out hover:scale-[1.05] flex items-center justify-center"
      title="Cart"
    >
      <div className="relative">
        <ShoppingCart size={20} />
        {count > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-sm">
            {count}
          </span>
        )}
      </div>
    </Link>
  );
}

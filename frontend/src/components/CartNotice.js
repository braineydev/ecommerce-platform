"use client";

import { useEffect, useMemo, useState } from "react";
import { ShoppingBag, X } from "lucide-react";
import Link from "next/link";
import { useCart } from "../context/CartContext";

export default function CartNotice() {
  const { cartNotice, dismissCartNotice, cart } = useCart();
  const [stage, setStage] = useState("hidden");
  const [targetStyle, setTargetStyle] = useState(null);

  useEffect(() => {
    if (!cartNotice || cart.length === 0) {
      setStage("hidden");
      setTargetStyle(null);
      return;
    }

    setStage("entering");
    setTargetStyle(null);

    const expandTimeout = window.setTimeout(() => {
      setStage("expanded");
    }, 120);

    const flyTimeout = window.setTimeout(() => {
      const target = document.getElementById("nav-cart-icon");
      if (!target) {
        setStage("expanded");
        return;
      }
      const rect = target.getBoundingClientRect();
      setTargetStyle({
        top: rect.top + rect.height / 2 - 28,
        left: rect.left + rect.width / 2 - 28,
        width: 56,
        height: 56,
      });
      setStage("flying");
    }, 2200);

    return () => {
      window.clearTimeout(expandTimeout);
      window.clearTimeout(flyTimeout);
    };
  }, [cartNotice, cart.length]);

  const noticeStyle = useMemo(() => {
    const base = {
      position: "fixed",
      zIndex: 70,
      transition:
        "top 250ms ease, left 250ms ease, width 250ms ease, height 250ms ease, opacity 200ms ease, borderRadius 250ms ease, transform 250ms ease",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      opacity: cartNotice && cart.length > 0 ? 1 : 0,
      pointerEvents: cartNotice && cart.length > 0 ? "auto" : "none",
      border: "1px solid rgba(23, 23, 22, 0.08)",
      boxShadow: "0 24px 60px rgba(15, 23, 42, 0.16)",
    };

    if (stage === "entering") {
      return {
        ...base,
        top: 14,
        left: "50%",
        transform: "translateX(-50%)",
        width: 56,
        height: 56,
        borderRadius: 9999,
        backgroundColor: "rgba(247, 243, 235, 0.98)",
        backdropFilter: "blur(14px)",
      };
    }

    if (stage === "expanded") {
      return {
        ...base,
        top: 18,
        left: "50%",
        transform: "translateX(-50%)",
        width: "min(420px, calc(100vw - 2rem))",
        height: 80,
        borderRadius: 28,
        backgroundColor: "rgba(255, 255, 255, 0.96)",
        backdropFilter: "blur(16px)",
      };
    }

    if (stage === "flying" && targetStyle) {
      return {
        ...base,
        top: targetStyle.top,
        left: targetStyle.left,
        transform: "none",
        width: targetStyle.width,
        height: targetStyle.height,
        borderRadius: 9999,
        justifyContent: "center",
        backgroundColor: "rgba(247, 243, 235, 0.98)",
        backdropFilter: "blur(14px)",
      };
    }

    return {
      ...base,
      top: 18,
      left: "50%",
      transform: "translateX(-50%)",
      width: "min(420px, calc(100vw - 2rem))",
      height: 80,
      borderRadius: 28,
      backgroundColor: "rgba(255, 255, 255, 0.96)",
      backdropFilter: "blur(16px)",
    };
  }, [cartNotice, cart.length, stage, targetStyle]);

  if (!cartNotice || cart.length === 0) {
    return null;
  }

  return (
    <div style={noticeStyle}>
      <Link
        href="/cart"
        onClick={dismissCartNotice}
        className="group flex h-full w-full items-center gap-3 overflow-hidden rounded-full border border-neutral-200 bg-[#fcfcfb]/95 px-4 text-neutral-950 shadow-[0_18px_50px_rgba(15,23,42,0.14)] transition-all duration-200 ease-in-out"
        style={{
          width: "100%",
          height: "100%",
          minWidth: 0,
        }}
      >
        <div className="flex h-12 w-12 items-center justify-center border border-neutral-200 bg-[#f1f0ed] text-neutral-950 transition-all duration-300">
          <ShoppingBag size={20} strokeWidth={1.7} />
        </div>

        <div
          className={`flex min-w-0 flex-1 flex-col justify-center overflow-hidden transition-all duration-300 ${
            stage === "entering" || (stage === "flying" && targetStyle)
              ? "max-w-0 opacity-0"
              : "max-w-full opacity-100"
          }`}
        >
          <p className="text-sm font-semibold">Added to cart</p>
          <p className="truncate text-sm text-neutral-600">
            {cartNotice.productName} is ready for checkout.
          </p>
        </div>

        <button
          type="button"
          aria-label="Dismiss cart notice"
          onClick={e => {
            e.preventDefault();
            dismissCartNotice();
          }}
          className={`rounded-full p-2 text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-950 ${
            stage === "entering" || (stage === "flying" && targetStyle)
              ? "opacity-0"
              : "opacity-100"
          }`}
        >
          <X size={16} />
        </button>
      </Link>
    </div>
  );
}

"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [cartNotice, setCartNotice] = useState(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const savedCart = localStorage.getItem("shark_cart");
      if (savedCart) setCart(JSON.parse(savedCart));
    } catch {
      // ignore malformed storage
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("shark_cart", JSON.stringify(cart));
    }
  }, [cart]);

  const addToCart = item => {
    setCart(current => {
      const existing = current.find(entry => entry.id === item.id);
      if (existing) {
        return current.map(entry =>
          entry.id === item.id
            ? { ...entry, quantity: entry.quantity + (item.quantity || 1) }
            : entry,
        );
      }
      return [...current, { ...item, quantity: item.quantity || 1 }];
    });
    setCartNotice({ productName: item.name || "Item" });
  };

  const updateQuantity = (id, quantity) => {
    if (quantity <= 0) {
      setCart(current => current.filter(entry => entry.id !== id));
      return;
    }
    setCart(current =>
      current.map(entry => (entry.id === id ? { ...entry, quantity } : entry)),
    );
  };

  const removeFromCart = id => {
    setCart(current => current.filter(entry => entry.id !== id));
  };

  const clearCart = () => {
    setCart([]);
  };

  const getCartCount = () =>
    cart.reduce((sum, item) => sum + (item.quantity || 0), 0);

  const getCartTotal = () =>
    cart.reduce(
      (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
      0,
    );

  const dismissCartNotice = () => {
    setCartNotice(null);
  };

  const value = useMemo(
    () => ({
      cart,
      cartNotice,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      getCartCount,
      getCartTotal,
      dismissCartNotice,
    }),
    [cart, cartNotice],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
}

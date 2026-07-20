import type { ReactNode } from "react";

export interface CartItem {
  id: string | number;
  name: string;
  price: number | string;
  quantity: number;
  stock?: number;
  images?: string[];
  image?: string;
}

export interface CartContextValue {
  cart: CartItem[];
  cartNotice: { productName: string } | null;
  addToCart: (item: CartItem) => void;
  updateQuantity: (id: string | number, quantity: number) => void;
  removeFromCart: (id: string | number) => void;
  clearCart: () => void;
  getCartCount: () => number;
  getCartTotal: () => number;
  dismissCartNotice: () => void;
}

export function CartProvider(props: { children: ReactNode }): JSX.Element;
export function useCart(): CartContextValue;

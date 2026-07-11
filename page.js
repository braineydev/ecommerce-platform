'use client';

import React, { useState, useEffect } from 'react';
import { ShoppingCart, Star, MessageCircle, X, Search, User, CheckCircle, ArrowRight, Trash2, Package } from 'lucide-react';

// MOCK IMPORTS FOR CANVAS PREVIEW
// In your local Next.js project, use your actual imports:
// import Link from 'next/link';
// import { useRouter } from 'next/navigation';
// import { useAuth } from '../context/AuthContext';

// Canvas Mock Components
const Link = ({ href, children, className }) => <a href={href} className={className}>{children}</a>;
const useRouter = () => ({ push: (url) => alert(`Navigating to: ${url}`) });
const useAuth = () => ({ user: null, logout: () => alert('Logged out') });

export default function Storefront() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- PHASE 4 UI STATES ---
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cart, setCart] = useState([]);
  const [toast, setToast] = useState(null);

  const { user, logout } = useAuth();
  const router = useRouter();

  // MOCK DATA FOR CANVAS
  // In your local code, this will fetch from your backend
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // Fallback for local testing if env is missing
        const apiUrl = 'https://fakestoreapi.com/products?limit=8'; // Using a public mock API for canvas visual
        const res = await fetch(apiUrl);
        const data = await res.json();

        // Map fake store API to match our expected structure
        const mappedProducts = data.map(p => ({
          id: p.id,
          name: p.title,
          price: p.price,
          images: [p.image],
          stock: 10,
        }));

        setProducts(mappedProducts);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // --- PHASE 4 UX HELPERS ---

  // 1. Smart Pricing: Generates a believable original price and discount percentage
  const getSmartPricing = (id, currentPrice) => {
    const hash = String(id).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const discountPercent = 15 + (hash % 21); // Random discount between 15% and 35%
    const originalPrice = (currentPrice / (1 - (discountPercent / 100))).toFixed(2);
    return { originalPrice, discountPercent };
  };

  // 2. Static Random Ratings: Generates a permanent rating between 4.4 and 4.8
  const getStaticRating = (id) => {
    const hash = String(id).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const rating = (4.4 + (hash % 5) * 0.1).toFixed(1);
    const reviews = 40 + (hash % 200);
    return { rating, reviews };
  };

  // 3. Toast Notification trigger
  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  // 4. Cart Logic
  const addToCart = (product) => {
    setCart(prev => {
      const exists = prev.find(item => item.id === product.id);
      if (exists) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    showToast(`Added ${product.name} to your cart!`);
    setIsCartOpen(true);
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);

  return (
    <div className="min-h-screen bg-[#FBFBFB] font-sans">
      {/* PHASE 4: TOAST NOTIFICATION */}
      <div className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ${toast ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10 pointer-events-none'}`}>
        <div className="bg-[#111111] text-white px-6 py-3 rounded-full shadow-2xl flex items-center font-medium">
          <CheckCircle size={18} className="text-green-400 mr-2" />
          {toast}
        </div>
      </div>

      {/* HEADER */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-3xl font-black tracking-tighter text-gray-900">
              SHARK<span className="text-red-600">.</span>
            </Link>
            <div className="hidden md:flex relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search premium tech..."
                className="bg-gray-50 border border-gray-200 rounded-full pl-10 pr-4 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-black transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 sm:gap-6">
            {user ? (
              <div className="flex items-center gap-4">
                <Link href="/profile" className="text-sm font-bold text-gray-600 hover:text-black transition-colors hidden sm:block">
                  Hi, {user.full_name?.split(' ')[0] || 'User'}
                </Link>
                {user.role === 'admin' && (
                  <Link href="/admin" className="text-sm font-bold bg-gray-100 text-gray-900 px-4 py-2 rounded-full hover:bg-gray-200 transition-colors hidden sm:block">
                    Dashboard
                  </Link>
                )}
                <button onClick={logout} className="text-sm font-bold text-red-500 hover:text-red-600 transition-colors hidden sm:block">
                  Log Out
                </button>
              </div>
            ) : (
              <Link href="/login" className="flex items-center text-sm font-bold text-gray-600 hover:text-black transition-colors">
                <User size={20} className="mr-2" /> <span className="hidden sm:inline">Sign In</span>
              </Link>
            )}

            <button onClick={() => setIsCartOpen(true)} className="relative p-2 text-gray-900 hover:bg-gray-50 rounded-full transition-colors">
              <ShoppingCart size={24} />
              {cart.length > 0 && (
                <span className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center border-2 border-white">
                  {cart.reduce((total, item) => total + item.quantity, 0)}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <div className="bg-[#111111] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
            Next-Gen Tech. <br className="hidden md:block" /> Unbeatable Prices.
          </h1>
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-10">
            Upgrade your lifestyle with our curated selection of premium electronics.
          </p>
        </div>
      </div>

      {/* PRODUCT GRID */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex justify-between items-end mb-10">
          <h2 className="text-2xl font-extrabold text-gray-900">Trending Now</h2>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="animate-pulse">
                <div className="bg-gray-200 rounded-3xl aspect-[4/5] mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <Package size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-bold text-gray-900">Check back soon!</h3>
            <p className="text-gray-500">We are currently restocking our inventory.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {products.map(product => {
              const { originalPrice, discountPercent } = getSmartPricing(product.id, product.price);
              const { rating, reviews } = getStaticRating(product.id);

              return (
                <div key={product.id} className="group flex flex-col">
                  {/* Image Container */}
                  <div className="relative bg-white rounded-3xl aspect-[4/5] mb-4 overflow-hidden shadow-sm border border-gray-100 flex items-center justify-center p-4">
                    {/* Discount Badge */}
                    <div className="absolute top-4 left-4 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full z-10 shadow-sm">
                      {discountPercent}% OFF
                    </div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={product.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80'}
                      alt={product.name}
                      className="object-contain w-full h-full mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
                    />
                    {/* Add to Cart Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <button
                        onClick={() => addToCart(product)}
                        disabled={product.stock <= 0}
                        className="bg-white text-gray-900 hover:bg-gray-100 font-bold py-3 px-6 rounded-full transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 shadow-xl disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        {product.stock > 0 ? 'Quick Add' : 'Out of Stock'}
                      </button>
                    </div>
                  </div>

                  {/* Product Details */}
                  <div className="flex flex-col flex-1">
                    <h3 className="text-lg font-bold text-gray-900 leading-tight mb-1 line-clamp-1" title={product.name}>{product.name}</h3>
                    <div className="flex items-center gap-1 mb-2">
                      <Star size={14} className="fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-bold text-gray-900">{rating}</span>
                      <span className="text-sm text-gray-400">({reviews})</span>
                    </div>
                    <div className="mt-auto flex items-end gap-2">
                      <span className="text-xl font-black text-gray-900">${Number(product.price).toFixed(2)}</span>
                      <span className="text-sm font-medium text-gray-400 line-through mb-1">${originalPrice}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <a
        href="https://wa.me/254700000000?text=Hi%20SHARK.%20I%20need%20help%20with%20an%20order!"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 bg-[#25D366] text-white p-4 rounded-full shadow-[0_8px_30px_rgb(37,211,102,0.4)] hover:scale-110 transition-transform duration-300 z-40 group"
      >
        <MessageCircle size={28} />
        <span className="absolute right-full mr-4 top-1/2 transform -translate-y-1/2 bg-white text-gray-900 text-sm font-bold py-2 px-4 rounded-xl shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
          Chat with us
        </span>
      </a>

      <div className={`fixed inset-0 bg-black/50 z-50 transition-opacity duration-300 ${isCartOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsCartOpen(false)}></div>
      <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
            Your Cart <span className="bg-gray-100 text-gray-600 text-sm py-0.5 px-2.5 rounded-full">{cart.reduce((total, item) => total + item.quantity, 0)}</span>
          </h2>
          <button onClick={() => setIsCartOpen(false)} className="p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-900 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-gray-500">
              <ShoppingCart size={48} className="mb-4 text-gray-300" />
              <p className="font-medium text-lg text-gray-900">Your cart is empty</p>
              <p className="mt-1">Looks like you haven't added anything yet.</p>
              <button onClick={() => setIsCartOpen(false)} className="mt-6 bg-[#111111] text-white px-6 py-3 rounded-full font-bold hover:bg-gray-800 transition-colors">
                Start Shopping
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {cart.map(item => (
                <div key={item.id} className="flex gap-4">
                  <div className="h-20 w-20 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100 p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.images?.[0] || 'https://via.placeholder.com/150'} alt={item.name} className="w-full h-full object-contain mix-blend-multiply" />
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <h4 className="font-bold text-gray-900 text-sm line-clamp-1">{item.name}</h4>
                    <p className="text-gray-500 text-sm mt-1">Qty: {item.quantity}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="font-black text-gray-900">${(item.price * item.quantity).toFixed(2)}</span>
                      <button onClick={() => removeFromCart(item.id)} className="text-red-500 hover:text-red-700 p-1">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div className="p-6 bg-gray-50 border-t border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <span className="font-medium text-gray-500">Subtotal</span>
              <span className="text-xl font-black text-gray-900">${cartTotal.toFixed(2)}</span>
            </div>
            <p className="text-xs text-gray-500 mb-6">Shipping and taxes calculated at checkout.</p>
            <button
              onClick={() => {
                alert('Navigating to secure checkout...');
              }}
              className="w-full bg-[#111111] hover:bg-gray-800 text-white font-bold py-4 px-8 rounded-full flex items-center justify-center transition-all group"
            >
              Secure Checkout
              <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import {
  ArrowLeft,
  CheckCircle,
  MessageCircleMore,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "../../context/CartContext";

const WHATSAPP_NUMBER = "+254799720009";
const whatsappButtonClasses =
  "w-full bg-[#25D366] px-8 py-4 text-[11px] font-medium uppercase tracking-[0.13em] text-white shadow-[0_14px_32px_rgba(37,211,102,0.24)] transition-colors hover:bg-[#20ba5a] disabled:bg-neutral-400";

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, getCartTotal } = useCart();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    address: "",
    phoneNumber: "",
    notes: "",
  });

  const subtotal = getCartTotal();
  const shipping = subtotal > 0 ? 200 : 0;
  const total = subtotal + shipping;

  useEffect(() => {
    if (!orderSuccess && cart.length === 0) {
      router.push("/cart");
    }
  }, [cart.length, orderSuccess, router]);

  const handleInputChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const buildWhatsAppMessage = () => {
    const items = cart.length
      ? cart.map(item => `- ${item.name} × ${item.quantity}`).join("\n")
      : "- No items selected";

    return [
      "Hello, I would like to place an order.",
      "",
      "Order Items:",
      items,
      "",
      `Customer Name: ${formData.fullName}`,
      "",
      `Delivery Address: ${formData.address}`,
      "",
      `WhatsApp Number: ${formData.phoneNumber}`,
      "",
      `Additional Notes: ${formData.notes || "None"}`,
      "",
      `Order Total: Ksh. ${total.toLocaleString()}`,
      "",
      "Kindly confirm my order and the delivery arrangements. Thank you.",
    ].join("\n");
  };

  const handlePlaceOrder = async e => {
    e.preventDefault();

    if (cart.length === 0) {
      alert("Your cart is empty.");
      return;
    }

    setIsSubmitting(true);

    try {
      const message = buildWhatsAppMessage();
      const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER.replace("+", "")}?text=${encodeURIComponent(message)}`;

      if (typeof window !== "undefined") {
        const newWindow = window.open(
          whatsappUrl,
          "_blank",
          "noopener,noreferrer",
        );

        if (!newWindow) {
          window.location.href = whatsappUrl;
        }
      }

      setOrderSuccess(true);
    } catch (error) {
      console.error("Checkout Error:", error.message);
      alert(`Checkout failed: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (orderSuccess) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#25D366]/10 text-[#25D366] shadow-sm">
          <CheckCircle size={40} />
        </div>
        <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-gray-900">
          Order Request Ready
        </h1>
        <p className="mx-auto mb-8 max-w-md text-lg text-gray-500">
          We&apos;ve opened a WhatsApp chat with TRIPPLE ORE and pre-filled your
          order details. Please send the message to confirm your delivery
          arrangement. Your cart remains saved, so you can continue shopping
          from this tab.
        </p>
        <button
          onClick={() => router.push("/")}
          className="rounded-full bg-[#111111] px-10 py-4 font-bold text-white transition-colors hover:bg-gray-800"
          type="button"
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  if (cart.length === 0 && !orderSuccess) {
    return null;
  }

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
        <div className="mb-8 border-b border-neutral-200 pb-5 sm:mb-10">
          <div className="flex items-center justify-between">
            <Link
              href="/cart"
              className="inline-flex items-center font-medium text-gray-600 transition-colors hover:text-gray-900"
            >
              <ArrowLeft size={20} className="mr-2 text-gray-600" />
              Back to Cart
            </Link>
            <h1 className="text-2xl font-medium tracking-[-0.05em] text-neutral-950 sm:text-4xl">
              Checkout
            </h1>
            <div className="w-24" />
          </div>
        </div>

        <div className="flex flex-col gap-12 lg:flex-row lg:gap-16">
          <div className="lg:w-2/3">
            <form
              id="checkout-form"
              onSubmit={handlePlaceOrder}
              className="space-y-10"
            >
              <section>
                <h2 className="mb-6 flex items-center text-xl font-bold text-gray-900">
                  <span className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-sm">
                    1
                  </span>
                  Delivery Details
                </h2>
                <div className="space-y-4 rounded-[2rem] border border-neutral-200 bg-[#fcfcfb] p-6">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Full Name
                    </label>
                    <input
                      required
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-black"
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Delivery Address
                    </label>
                    <textarea
                      required
                      name="address"
                      rows="3"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black"
                      placeholder="123 Example Street, Nairobi"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      WhatsApp Phone Number
                    </label>
                    <input
                      required
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black"
                      placeholder="+2547XXXXXXXX"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Additional Delivery Notes (Optional)
                    </label>
                    <textarea
                      name="notes"
                      rows="3"
                      value={formData.notes}
                      onChange={handleInputChange}
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black"
                      placeholder="Please deliver after 5:00 PM"
                    />
                  </div>
                </div>
              </section>
            </form>
          </div>

          <div className="lg:w-1/3">
            <div className="sticky top-24 border border-neutral-200 bg-[#f1f0ed] p-6 sm:p-8">
              <h2 className="mb-6 text-xl font-bold text-gray-900">
                In Your Cart
              </h2>

              <div className="mb-6 max-h-60 space-y-4 overflow-y-auto pr-2">
                {cart.map(item => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="line-clamp-1 pr-4 text-gray-600">
                      {item.quantity}x {item.name}
                    </span>
                    <span className="font-medium text-gray-900">
                      Ksh. {(item.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mb-6 space-y-3 border-t border-gray-200 pt-6 text-sm text-gray-500">
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

              <div className="mb-8 flex items-center justify-between border-t border-gray-900 pt-6">
                <span className="text-lg font-bold text-gray-900">Total</span>
                <span className="text-3xl font-extrabold text-gray-900">
                  Ksh. {total.toLocaleString()}
                </span>
              </div>

              <button
                type="submit"
                form="checkout-form"
                disabled={isSubmitting}
                className={`${whatsappButtonClasses} flex items-center justify-center`}
              >
                {isSubmitting ? (
                  "Preparing Order..."
                ) : (
                  <>
                    <MessageCircleMore size={18} className="mr-2" />
                    Send on WhatsApp
                  </>
                )}
              </button>
              <p className="mt-4 flex items-center justify-center text-center text-xs text-gray-400">
                <ShieldCheck size={14} className="mr-1" /> No online payment is
                required. Your order will be confirmed manually via WhatsApp.
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-neutral-200 bg-[#fcfcfb]/95 p-3 backdrop-blur md:hidden">
        <button
          type="submit"
          form="checkout-form"
          disabled={isSubmitting}
          className={`${whatsappButtonClasses} flex w-full items-center justify-center`}
        >
          {isSubmitting ? "Preparing Order..." : <><MessageCircleMore size={18} className="mr-2" /> Send on WhatsApp</>}
        </button>
      </div>
    </>
  );
}

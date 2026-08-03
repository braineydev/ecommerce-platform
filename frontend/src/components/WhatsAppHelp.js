"use client";

import { MessageCircle, X } from "lucide-react";
import { useState } from "react";

const WHATSAPP_NUMBER = "254799720009";
const DEFAULT_MESSAGE =
  "Hello TRIPPLE ORE, I need help with my order and product inquiries.";

export default function WhatsAppHelp() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState(DEFAULT_MESSAGE);

  const handleOpen = () => {
    setIsOpen(open => !open);
  };

  const handleStartChat = () => {
    const finalMessage =
      message && message.trim()
        ? message.trim()
        : "Hello TRIPPLE ORE, I have an inquiry about your products.";
    const encodedMessage = encodeURIComponent(finalMessage);
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER.replace(/[^0-9]/g, "")}?text=${encodedMessage}`;
    const newWindow = window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    if (!newWindow) {
      window.location.href = whatsappUrl;
    }
    setIsOpen(false);
  };

  return (
    <div className="fixed right-4 top-[72%] z-40 -translate-y-1/2 sm:right-6">
      {isOpen && (
        <div className="absolute right-16 top-1/2 w-[min(24rem,calc(100vw-6rem))] -translate-y-1/2 rounded-3xl border border-neutral-200 bg-white p-5 shadow-[0_22px_70px_rgba(15,23,42,0.18)] animate-in fade-in slide-in-from-right-4 duration-300 sm:p-6">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div className="min-w-0">
              <h3 className="text-lg font-semibold tracking-[-0.03em] text-neutral-950">
                Chat with us on WhatsApp
              </h3>
              <p className="mt-2 text-sm text-neutral-600">
                We typically reply within minutes.
              </p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-full p-2 text-gray-400 transition hover:bg-neutral-100 hover:text-gray-600"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4 border-t border-neutral-200 pt-4 pb-1">
            <p className="text-sm text-neutral-700">
              Need help? Our team is ready to assist with orders, products, and
              delivery inquiries.
            </p>
            <div className="rounded-2xl border border-gray-100 bg-[#fafaf9] p-4 text-sm text-neutral-600">
              <label className="block font-semibold text-neutral-900 mb-2">
                Your message
              </label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder={DEFAULT_MESSAGE}
                className="w-full min-h-[80px] resize-none rounded-lg border border-gray-200 bg-white p-3 text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-black"
              />
              <p className="mt-2 text-xs text-neutral-500">
                Leave empty to use a suggested message.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleStartChat}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#171716] px-4 py-3.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-[#111111]"
          >
            <MessageCircle size={18} />
            Send via WhatsApp
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={handleOpen}
        className={`relative flex h-14 w-14 items-center justify-center rounded-full bg-green-500 p-4 text-white shadow-[0_20px_55px_rgba(16,185,129,0.32)] transition duration-200 ease-in-out ${
          isOpen ? "scale-105" : "hover:scale-[1.05]"
        }`}
        aria-label="Open WhatsApp message modal"
        title="Chat with us on WhatsApp"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <path d="M20.52 3.48A11.94 11.94 0 0012 0C5.373 0 .07 5.303.07 11.93c0 2.103.553 4.162 1.6 5.995L0 24l6.344-1.637A11.91 11.91 0 0012 23.86c6.627 0 11.93-5.303 11.93-11.93 0-3.187-1.243-6.177-3.41-8.45zM12 21.86a9.88 9.88 0 01-5.18-1.45l-.37-.23-3.77.97.99-3.67-.24-.38A9.82 9.82 0 012.1 11.93C2.1 7.09 6.17 3 11 3c2.95 0 5.72 1.15 7.78 3.22A10.97 10.97 0 0121.9 11.93C21.9 17.77 17.83 21.86 12 21.86z" />
          <path
            d="M17.63 14.21c-.29-.14-1.71-.84-1.98-.93-.27-.09-.47-.14-.67.14s-.77.93-.95 1.12c-.17.19-.34.21-.63.07-.29-.14-1.23-.45-2.35-1.44-.87-.78-1.46-1.74-1.63-2.03-.17-.28-.02-.43.12-.57.12-.12.27-.32.4-.48.13-.17.17-.29.26-.48.09-.19.04-.36-.02-.49-.07-.14-.67-1.6-.92-2.19-.24-.58-.49-.5-.67-.51-.17-.01-.37-.01-.57-.01-.19 0-.5.07-.76.36-.27.29-1.03 1.01-1.03 2.47 0 1.46 1.05 2.88 1.2 3.08.15.2 2.07 3.34 5.02 4.68 2.34 1.08 2.66 1.01 3.14.95.48-.06 1.56-.64 1.78-1.26.22-.62.22-1.15.15-1.26-.07-.1-.27-.16-.56-.29z"
            fill="#fff"
          />
        </svg>
        {!isOpen && (
          <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-white" />
        )}
      </button>
    </div>
  );
}

export default function WhatsAppWidget({
  phone = "254799720009",
  message = "Hi, I need help with this product.",
}) {
  const encoded = encodeURIComponent(message);
  const href = phone
    ? `https://wa.me/${phone.replace(/[^0-9]/g, "")}?text=${encoded}`
    : `https://wa.me/?text=${encoded}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed z-50 right-5 min-h-14 min-w-14 rounded-full bg-green-500 p-4 text-white shadow-[0_20px_55px_rgba(16,185,129,0.32)] flex items-center justify-center"
      style={{ top: "75%", transform: "translateY(-50%)" }}
      title="Chat on WhatsApp"
    >
      {/* WhatsApp icon */}
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
    </a>
  );
}

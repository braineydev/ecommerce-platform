import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import CartNotice from "../components/CartNotice";
import CartWidget from "../components/CartWidget";
import Footer from "../components/Footer";
import GoogleAnalytics from "../components/GoogleAnalytics";
import Navbar from "../components/Navbar";
import WhatsAppHelp from "../components/WhatsAppHelp";
import { AuthProvider } from "../context/AuthContext";
import { CartProvider } from "../context/CartContext";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  ),
  title: {
    default: "TRIPPLE ORE",
    template: "%s | TRIPPLE ORE",
  },
  description: "Discover thoughtful finds at TRIPPLE ORE.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_KE",
    siteName: "TRIPPLE ORE",
    title: "TRIPPLE ORE",
    description: "Discover thoughtful finds at TRIPPLE ORE.",
    url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  },
  twitter: {
    card: "summary_large_image",
    title: "TRIPPLE ORE",
    description: "Discover thoughtful finds at TRIPPLE ORE.",
  },
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col bg-[#FBFBFB]">
          <Suspense fallback={null}>
            <GoogleAnalytics
              measurementId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}
            />
          </Suspense>
          <AuthProvider>
          <CartProvider>
            <Navbar />
            <CartNotice />
            <CartWidget />
            <WhatsAppHelp />
            {children}
            <Footer />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

import { ArrowUpRight, MapPin, Phone } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-auto bg-[#06251f] shadow-[0_-8px_30px_rgba(10,48,42,0.08)]">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_0.7fr_1fr] lg:gap-16">
          <div>
            <Link
              href="/"
              className="inline-flex border-l-2 border-[#d9a441] pl-2 text-sm font-bold tracking-[0.2em] text-white"
            >
              TRIPPLE ORE
            </Link>
            <p className="mt-4 max-w-xs text-sm font-medium leading-6 text-slate-200">
              Electronics selected for everyday life.
            </p>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-300">
              Explore
            </p>
            <nav className="mt-4 flex flex-col items-start gap-3 text-sm font-semibold text-slate-100">
              <Link href="/" className="transition hover:text-white">
                Shop
              </Link>
              <Link href="/about" className="transition hover:text-white">
                About us
              </Link>
              <Link href="/contact" className="transition hover:text-white">
                Contact
              </Link>
            </nav>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-300">
              Visit &amp; contact
            </p>
            <div className="mt-4 space-y-3 text-sm font-semibold text-slate-100">
              <a
                href="tel:0721469696"
                className="flex items-center gap-3 transition hover:text-white"
              >
                <span className="flex h-9 w-9 items-center justify-center border border-white/15 text-white">
                  <Phone size={16} />
                </span>
                0721 469 696
              </a>
              <Link
                href="/contact"
                className="flex items-center gap-3 leading-5 transition hover:text-white"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-white/15 text-white">
                  <MapPin size={16} />
                </span>
                <span>
                  Amber House, Shop D6
                  <br />
                  Mfangano Lane
                </span>
                <ArrowUpRight size={15} className="ml-auto" />
              </Link>
            </div>
          </div>
        </div>
        <div className="mt-10 border-t border-white/10 pt-5 text-xs font-semibold text-slate-300">
          © {new Date().getFullYear()} TRIPPLE ORE. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

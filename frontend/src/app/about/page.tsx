import { ArrowRight, Check } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "About us" };

export default function AboutPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
      <section className="bg-[#e9e8e4] px-6 py-10 sm:px-10 sm:py-14 lg:px-14">
        <div className="max-w-2xl">
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-500">About TRIPPLE ORE</p>
          <h1 className="mt-5 text-4xl font-medium tracking-[-0.055em] text-neutral-950 sm:text-5xl lg:text-6xl lg:leading-[0.96]">Technology for the way you live.</h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-neutral-600 sm:text-lg">We make it simpler to choose dependable electronics and appliances for home, work, and everything in between.</p>
        </div>
      </section>

      <section className="grid gap-5 py-10 sm:grid-cols-2 lg:gap-8 lg:py-14">
        <div className="border-t border-neutral-200 bg-white p-7 sm:p-8">
          <Check className="text-neutral-950" size={21} strokeWidth={1.5} />
          <h2 className="mt-5 text-2xl font-medium tracking-[-0.04em] text-neutral-950">Chosen with care</h2>
          <p className="mt-3 leading-7 text-neutral-600">Useful products, clear prices, and support when you need it.</p>
        </div>
        <div className="bg-[#171716] p-7 text-white sm:p-8">
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-neutral-400">Visit us</p>
          <h2 className="mt-4 text-2xl font-medium tracking-[-0.04em]">Hotel Jaffers, Amber House.</h2>
          <Link href="/contact" className="mt-6 inline-flex items-center gap-2 border-b border-white pb-1.5 text-[11px] font-medium uppercase tracking-[0.12em] transition-opacity hover:opacity-60">Contact <ArrowRight size={15} /></Link>
        </div>
      </section>
    </main>
  );
}

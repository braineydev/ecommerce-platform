import Link from "next/link";

export const metadata = { title: "Terms of Service" };

const sections = [
  ["Using TRIPPLE ORE", "By using this website or creating an account, you agree to these terms. You must provide accurate information and use the platform lawfully. You are responsible for activity carried out through your account."],
  ["Products, prices and availability", "We aim to keep product information, prices and availability accurate, but they may change or contain errors. An order request is subject to our confirmation. Images are illustrative unless stated otherwise."],
  ["Orders and delivery", "Orders may be submitted through the checkout flow and confirmed with our team through WhatsApp. Delivery charges, times and availability are confirmed before fulfilment. Do not send payment details or credentials through insecure channels."],
  ["Acceptable use", "Do not misuse the platform, provide false information, interfere with its security, infringe another person’s rights, or use it for unlawful, fraudulent or abusive activity. We may suspend or end access where these terms are breached."],
  ["Liability", "To the extent permitted by applicable law, the platform is provided as available. Nothing in these terms excludes rights that cannot legally be excluded. Our responsibility is limited to the purchase or service at issue where the law permits."],
  ["Changes and governing law", "We may update these terms by posting a revised version here. Continued use after an update means you accept the revised terms. These terms are governed by the laws of Kenya."],
];

export default function TermsPage() {
  return <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
    <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-500">Legal</p>
    <h1 className="mt-3 text-4xl font-medium tracking-[-0.055em] text-neutral-950 sm:text-5xl">Terms of Service</h1>
    <p className="mt-4 text-sm text-neutral-500">Last updated: July 18, 2026</p>
    <p className="mt-8 max-w-2xl leading-7 text-neutral-600">These terms govern your use of the TRIPPLE ORE website and shopping services.</p>
    <div className="mt-10 divide-y divide-neutral-200 border-y border-neutral-200">
      {sections.map(([title, copy]) => <section key={title} className="grid gap-3 py-7 sm:grid-cols-[180px_1fr] sm:gap-8"><h2 className="font-medium text-neutral-950">{title}</h2><p className="leading-7 text-neutral-600">{copy}</p></section>)}
    </div>
    <section className="mt-10 bg-[#e9e8e4] p-6"><h2 className="font-medium text-neutral-950">Contact</h2><p className="mt-3 leading-7 text-neutral-600">For questions about these terms, call <a className="underline underline-offset-2" href="tel:0721469696">0721 469 696</a> or visit Hotel Jaffers, Amber House.</p></section>
    <p className="mt-8 text-sm text-neutral-500">Read our <Link href="/privacy" className="underline underline-offset-2">Privacy Policy</Link>.</p>
  </main>;
}

import Link from "next/link";

export const metadata = { title: "Privacy Policy" };

const sections = [
  ["Information we use", "We use the account information you provide, including your name, email address and phone number, to create and manage your account. We also process order details, delivery information, product enquiries and technical information needed to operate the website."],
  ["Why we use it", "We use this information to provide the catalogue, process and confirm orders, arrange delivery, provide customer support, protect the service, and improve how the platform works. We do not sell personal information."],
  ["Service providers", "We use Supabase for authentication and data storage, Google Maps on our contact page, and WhatsApp when you choose to contact us or submit an order through it. Their own privacy notices apply to their services."],
  ["Your choices", "You may ask to access or correct your account information, object to certain processing, or request deletion where applicable. To make a request, contact us using the details below. We may retain information where needed to meet legal, security or transaction-record obligations."],
  ["Security and retention", "We use reasonable technical and organisational safeguards. No online service can guarantee absolute security. We keep information only for as long as necessary for the purposes described here or as required by law."],
];

export default function PrivacyPage() {
  return <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
    <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-500">Legal</p>
    <h1 className="mt-3 text-4xl font-medium tracking-[-0.055em] text-neutral-950 sm:text-5xl">Privacy Policy</h1>
    <p className="mt-4 text-sm text-neutral-500">Last updated: July 18, 2026</p>
    <p className="mt-8 max-w-2xl leading-7 text-neutral-600">This policy explains how TRIPPLE ORE handles personal information when you browse, shop, create an account, or contact us.</p>
    <div className="mt-10 divide-y divide-neutral-200 border-y border-neutral-200">
      {sections.map(([title, copy]) => <section key={title} className="grid gap-3 py-7 sm:grid-cols-[180px_1fr] sm:gap-8"><h2 className="font-medium text-neutral-950">{title}</h2><p className="leading-7 text-neutral-600">{copy}</p></section>)}
    </div>
    <section className="mt-10 bg-[#e9e8e4] p-6"><h2 className="font-medium text-neutral-950">Contact</h2><p className="mt-3 leading-7 text-neutral-600">For privacy questions or requests, contact us at <a className="underline underline-offset-2" href="tel:0721469696">0721 469 696</a> or visit us at Hotel Jaffers, Amber House.</p></section>
    <p className="mt-8 text-sm text-neutral-500">Read our <Link href="/terms" className="underline underline-offset-2">Terms of Service</Link>.</p>
  </main>;
}

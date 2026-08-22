import { MapPin } from "lucide-react";

export const metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
      <div className="mb-8 max-w-2xl sm:mb-10">
        <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-500">
          Contact
        </p>
        <h1 className="mt-3 text-4xl font-medium tracking-[-0.055em] text-neutral-950 sm:text-5xl">
          Here when you need us.
        </h1>
        <p className="mt-4 text-base leading-7 text-neutral-600">
          Visit our shop on Mfangano Street or call for help before you buy.
        </p>
      </div>

      <section className="grid overflow-hidden border border-neutral-200 bg-white lg:grid-cols-[0.85fr_1.15fr]">
        <div className="bg-[#e9e8e4] p-7 sm:p-10 lg:p-12">
          <h2 className="text-2xl font-medium tracking-[-0.04em] text-neutral-950">
            Find us
          </h2>
          <div className="mt-8 space-y-6">
            <div className="flex gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center border border-neutral-300 bg-white text-neutral-950">
                <MapPin size={20} strokeWidth={1.5} />
              </span>
              <div>
                <p className="font-medium text-neutral-950">
                  Jaffers Building, Shop D6
                </p>
                <p className="mt-1 text-sm leading-6 text-neutral-600">
                  Mfangano Street, Nairobi
                  <br />
                  Opposite Information House
                </p>
              </div>
            </div>
            <div className="border-t border-neutral-300 pt-5">
              <p className="font-medium text-neutral-950">Nearby landmarks</p>
              <p className="mt-1 text-sm leading-6 text-neutral-600">
                By the main downtown bus and matatu stations.
                <br />
                10 minutes to Kenya National Archives and August 7th Memorial
                Park.
              </p>
            </div>
            <div className="border-t border-neutral-300 pt-5">
              <p className="font-medium text-neutral-950">Call us</p>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-neutral-600">
                <a
                  href="tel:0721469696"
                  className="transition hover:opacity-55"
                >
                  0721 469 696
                </a>
                <a
                  href="tel:0716111606"
                  className="transition hover:opacity-55"
                >
                  0716 111 606
                </a>
              </div>
            </div>
          </div>
        </div>
        <iframe
          title="TRIPPLE ORE location map"
          src="https://www.google.com/maps/embed?pb=!1m17!1m12!1m3!1d3988.811457271213!2d36.82587397496567!3d-1.287227798700534!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m2!1m1!2zMcKwMTcnMTQuMCJTIDM2wrA0OSc0Mi40IkU!5e0!3m2!1sen!2ske!4v1784388645402!5m2!1sen!2ske"
          className="min-h-[340px] w-full border-0 lg:min-h-full"
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </section>
    </main>
  );
}

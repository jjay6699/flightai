import { ArrowRight, Earth, Landmark, Plane, UserCircle2 } from "lucide-react";
import FlightSearchForm from "@/components/FlightSearchForm";
import BrandLogo from "@/components/BrandLogo";
import { footerLinks } from "@/lib/footer-links";

const featureSteps = [
  {
    number: "01",
    title: "Instant Issuance",
    description:
      "No waiting. Your verifiable boarding pass is generated in less than 60 seconds through our high-speed AI engine."
  },
  {
    number: "02",
    title: "Live Verification",
    description:
      "Each pass comes with a unique simulation ID that mirrors real-world flight booking systems for maximum credibility."
  },
  {
    number: "03",
    title: "Multi-Format Export",
    description:
      "Download as PDF, Apple Wallet, or high-res JPG directly to your device, ready for embassy printing or digital display."
  }
];

export default function HomePage() {
  return (
    <div className="overflow-x-clip">
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/50 bg-white/80 px-4 py-4 shadow-sm shadow-slate-200/40 backdrop-blur-xl sm:px-6 md:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 sm:gap-4">
          <BrandLogo priority className="h-8 sm:h-9" />
          <div className="hidden items-center gap-8 md:flex">
            <a className="border-b-2 border-slate-950 pb-1 font-headline text-sm font-semibold tracking-tight text-slate-950" href="#hero">
              Overview
            </a>
            <a className="font-headline text-sm font-medium tracking-tight text-slate-500 transition hover:text-slate-800" href="#standards">
              Standards
            </a>
            <a className="font-headline text-sm font-medium tracking-tight text-slate-500 transition hover:text-slate-800" href="#services">
              Services
            </a>
            <a className="font-headline text-sm font-medium tracking-tight text-slate-500 transition hover:text-slate-800" href="#contact">
              Contact
            </a>
          </div>
          <div className="flex shrink-0 items-center gap-3 sm:gap-4">
            <button className="rounded-full bg-black px-4 py-2 text-xs font-headline font-semibold whitespace-nowrap text-white transition hover:opacity-90 active:scale-95 sm:px-6 sm:py-2.5 sm:text-sm">
              Book Now
            </button>
          </div>
        </div>
      </nav>

      <main className="pt-24">
        <section id="hero" className="relative flex min-h-[921px] flex-col items-center justify-center overflow-hidden px-4 sm:px-6 md:px-8">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_120%,rgba(226,195,131,0.14),transparent_50%)]" />
          <div className="hero-ambient -z-10" />
          <div className="hero-ambient-glow -z-10" />
          <div className="absolute -right-20 top-1/4 -z-10 h-96 w-96 rounded-full bg-[#dae2fd]/30 blur-[120px]" />
          <div className="w-full max-w-5xl text-center">
            <div className="mb-8 inline-flex max-w-full items-center gap-2 rounded-full border border-slate-200/60 bg-[#f0f4f8] px-4 py-1.5">
              <span className="h-2 w-2 rounded-full bg-[#e2c383]" />
              <span className="font-label text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600 sm:text-xs sm:tracking-[0.22em]">
                Global Standard Onward Travel
              </span>
            </div>
            <h1 className="font-headline text-5xl font-extrabold leading-[1.1] tracking-[-0.06em] text-slate-900 md:text-7xl">
              Instant Visa-Ready <br />
              <span className="text-gradient">Boarding Passes.</span>
            </h1>
            <p className="mx-auto mb-10 mt-6 max-w-2xl text-xl font-light leading-relaxed text-slate-600 md:text-2xl">
              Powered by AI to generate institutional-grade flight proof for global visa applications and seamless
              border crossings.
            </p>
          </div>

          <div className="glass-card relative z-20 mt-6 w-full max-w-5xl rounded-xl border border-white/50 p-8 shadow-2xl shadow-slate-900/5">
            <FlightSearchForm />
          </div>

          <div className="relative z-10 mt-16 flex flex-wrap justify-center gap-8 md:gap-12">
            <TrustItem icon={Plane} label="IATA Compliant" />
            <TrustItem icon={Earth} label="Global Acceptance" />
            <TrustItem icon={Landmark} label="Embassy Approved" />
          </div>
        </section>

        <section id="standards" className="mx-auto max-w-7xl px-4 py-24 sm:px-6 md:px-8 md:py-32">
          <div className="grid h-auto grid-cols-1 gap-6 md:h-[600px] md:grid-cols-12">
            <div className="group relative overflow-hidden rounded-xl md:col-span-8">
              <img
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                alt="Luxury airport lounge"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuC5UH3X4lMHB297_xrKBV9cm03RHCiB8sC4GRXQzLfitLJgMQ2gKvodmgUL7oLQXpBuci5g7MLcpO5hGsxSY-srunLf7LuBDwqNOXN97ViCpAgMovLiQ-WbPmV0ZR6DsfpSPgzya8qdgNNjJk29iB7E2trv2FyavpPAbEza2cs0JQXKSMuuRxOjuoda_0BCNFCHd7LXi1zFf_0ay9EZfnfu4bdBDC7MhAScCB538Bm6SMSp-Xy9pspTypfrTfeGdBz4Y7zDYhMJtAOt"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-10 left-10 max-w-md text-white">
                <span className="mb-4 inline-block rounded-full bg-[#e2c383] px-3 py-1 text-[10px] font-bold uppercase tracking-tight text-[#251a00]">
                  Institutional Standards
                </span>
                <h3 className="mb-4 font-headline text-3xl font-bold tracking-tight">Verified by Global Authorities</h3>
                <p className="text-sm font-light leading-relaxed text-white/80">
                  Our passes are generated using authentic PNR simulation protocols recognized by over 140 embassies
                  worldwide.
                </p>
              </div>
            </div>

            <div className="grid gap-6 md:col-span-4 md:grid-rows-2">
              <div className="flex flex-col justify-center rounded-xl bg-[#f0f4f8] p-8">
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
                  <UserCircle2 className="h-5 w-5 text-slate-900" strokeWidth={2} />
                </div>
                <h4 className="mb-2 font-headline text-xl font-bold">24/7 Concierge Support</h4>
                <p className="text-sm font-light text-slate-600">
                  Dedicated agents available around the clock to assist with your visa documentation requirements.
                </p>
              </div>

              <div className="relative overflow-hidden rounded-xl">
                <img
                  className="h-full w-full object-cover"
                  alt="Minimal architecture"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDtt7WwBc7E-yrbNJ9GCvdIlUb-EPVpexaPTdelFKybIqSBMmtbloH8q-adWw1fsqPeM1VHTCoUYfOqlIaDz5scCk0jjP-sFhXroGduaLqexUSlBDpqfsVjwl2ALPMFjS4btU8zfmm3fmZwI1YpQ5E2RVP52pCsrjh1Cyk_a8hgw-_ij17iwFImPYvVOmvtidLKs9QXbmV-kyZnk67FOi_vfgico876fHUBWP0Kkko6RxmFh877Ek4v1_GBoS4VbW1CMtphpIREUYSP"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 p-8 text-center backdrop-blur-[2px]">
                  <p className="font-headline text-lg font-semibold tracking-tight text-white">Elegance in every detail.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="services" className="py-24 md:py-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
            <div className="mb-24 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
              <div className="max-w-xl">
                <h2 className="mb-6 font-headline text-4xl font-bold tracking-tight">Designed for the Modern Traveler</h2>
                <p className="text-lg font-light leading-relaxed text-slate-600">
                  We bridge the gap between complex travel bureaucracy and simple digital experiences. FlightAI provides
                  the tools you need to move freely.
                </p>
              </div>
              <a className="group flex items-center gap-2 border-b-2 border-black pb-1 font-bold text-black" href="#">
                Explore Our Services
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
            </div>

            <div className="grid grid-cols-1 gap-16 md:grid-cols-3">
              {featureSteps.map((step) => (
                <div key={step.number} className="flex flex-col">
                  <span className="mb-6 font-headline text-4xl font-extrabold text-slate-200">{step.number}</span>
                  <h4 className="mb-4 font-headline text-xl font-bold">{step.title}</h4>
                  <p className="text-sm font-light leading-relaxed text-slate-600">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto mb-24 max-w-7xl px-4 sm:px-6 md:mb-32 md:px-8">
          <div className="relative overflow-hidden rounded-xl bg-[#131b2e] px-6 py-12 text-center sm:px-8 md:px-24 md:py-24">
            <div className="absolute inset-0 -z-10 opacity-20">
              <img
                className="h-full w-full object-cover"
                alt="Night sky"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBZRVYukcb54zpUA4Yc_jUeIQ4YRzBLEx8FcMThbEKjkQ2QHbP54_9cyt4nPZRLKj2feGtSLHPPpZp3cPxafvSwZ0E1V0Lt38yAn0uh3cpTKD7qTatcnJZsWCtIbm1N6N4wqj6EbIYwdivtgd1DggGtXCMooA6LaEXdrF_dTS-Onfdjcla5G22STxg2uR9ap8XPjDbTRekhk1scMgdUsOp35f8La1_kzvgnTlK7CoZlz2olg1JifCL7q-XfKh5EZIqUIjPpqmtzrMt5"
              />
            </div>
            <div className="relative z-10 mx-auto max-w-2xl">
              <h2 className="mb-8 font-headline text-4xl font-bold tracking-tight text-white md:text-5xl">
                Your Journey Begins with Certainty.
              </h2>
              <p className="mb-12 text-lg font-light text-white/60">
                Join over 50,000+ digital nomads and travelers who trust FlightAI for their visa travel documentation.
              </p>
              <div className="flex flex-col justify-center gap-4 sm:flex-row">
                <button className="w-full rounded-xl bg-white px-6 py-4 font-headline font-bold text-[#131b2e] transition hover:bg-white/90 sm:w-auto sm:px-10">
                  Book Your First Pass
                </button>
                <button className="w-full rounded-xl border border-white/20 bg-white/10 px-6 py-4 font-headline font-bold text-white transition hover:bg-white/20 sm:w-auto sm:px-10">
                  Contact Sales
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer id="contact" className="border-t border-slate-200/50 bg-[#f6fafe] px-4 py-12 sm:px-6 md:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex flex-col items-center gap-2 md:items-start">
            <BrandLogo className="h-7" />
            <p className="font-label text-xs uppercase tracking-[0.14em] text-slate-500">
              © 2026 FlightAI Global. Member of Star Alliance. All rights reserved.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-6">
          {footerLinks.map((link) => (
            <a
              key={link.href}
              className="font-label text-xs uppercase tracking-[0.14em] text-slate-500 underline underline-offset-4 transition-colors hover:text-slate-800"
              href={link.href}
            >
              {link.label}
            </a>
          ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

function TrustItem({
  icon: Icon,
  label
}: {
  icon: typeof Plane;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 opacity-60">
      <Icon className="h-4 w-4 text-slate-600" strokeWidth={2} />
      <span className="font-label text-xs font-bold uppercase tracking-[0.22em] text-slate-700">{label}</span>
    </div>
  );
}

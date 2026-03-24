import BrandLogo from "@/components/BrandLogo";
import { footerLinks } from "@/lib/footer-links";

export default function InfoPageShell({
  eyebrow,
  title,
  intro,
  sections
}: {
  eyebrow: string;
  title: string;
  intro: string;
  sections: Array<{ heading: string; body: string[] }>;
}) {
  return (
    <>
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/50 bg-white/80 px-6 py-4 shadow-sm shadow-slate-200/40 backdrop-blur-xl md:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <a href="/">
            <BrandLogo className="h-8 sm:h-9" />
          </a>
          <div className="hidden items-center gap-8 md:flex">
            <a className="font-headline text-sm font-medium tracking-tight text-slate-500 transition hover:text-slate-800" href="/">
              Home
            </a>
            <a className="font-headline text-sm font-medium tracking-tight text-slate-500 transition hover:text-slate-800" href="/search">
              Flights
            </a>
            <a className="font-headline text-sm font-medium tracking-tight text-slate-500 transition hover:text-slate-800" href="/passenger">
              Passenger
            </a>
            <a className="font-headline text-sm font-medium tracking-tight text-slate-500 transition hover:text-slate-800" href="/ticket">
              Ticket
            </a>
          </div>
          <a
            href="/search"
            className="rounded-full bg-black px-6 py-2.5 font-headline text-sm font-semibold text-white transition hover:opacity-90"
          >
            Start Search
          </a>
        </div>
      </nav>

      <main className="pt-24">
        <section className="relative px-6 pb-12 pt-10 md:px-8">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_18%,rgba(218,226,253,0.46),transparent_30%),radial-gradient(circle_at_84%_14%,rgba(226,195,131,0.16),transparent_25%)]" />
          <div className="mx-auto max-w-5xl">
            <div className="rounded-[2rem] border border-white/70 bg-white/60 p-8 shadow-[0_30px_90px_rgba(15,23,42,0.08)] backdrop-blur-sm md:p-10">
              <p className="font-label text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                {eyebrow}
              </p>
              <h1 className="mt-4 font-headline text-4xl font-extrabold tracking-[-0.05em] text-slate-900 md:text-6xl">
                {title}
              </h1>
              <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
                {intro}
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6 pb-24 md:px-8">
          <div className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)] backdrop-blur-sm md:p-8">
            <div className="space-y-10">
              {sections.map((section) => (
                <section key={section.heading} className="border-b border-slate-100 pb-8 last:border-b-0 last:pb-0">
                  <h2 className="font-headline text-2xl font-bold tracking-[-0.04em] text-slate-900">
                    {section.heading}
                  </h2>
                  <div className="mt-4 space-y-4 text-sm leading-7 text-slate-600 md:text-base">
                    {section.body.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200/50 bg-[#f6fafe] px-6 py-12 md:px-8">
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
    </>
  );
}

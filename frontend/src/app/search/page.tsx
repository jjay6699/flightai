"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, PlaneTakeoff } from "lucide-react";
import FlightCard from "@/components/FlightCard";
import FlightSkeleton from "@/components/FlightSkeleton";
import { footerLinks } from "@/lib/footer-links";
import { FlightOffer } from "@/lib/types";
import { saveSelectedDeparture, saveSelectedReturn, clearSelectedReturn } from "@/lib/storage";
import { cacheLogoFromApi } from "@/lib/logo-cache";

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f6fafe]" />}>
      <SearchPageContent />
    </Suspense>
  );
}

function SearchPageContent() {
  const searchParams = useSearchParams() ?? new URLSearchParams();
  const router = useRouter();
  const [offers, setOffers] = useState<FlightOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"departure" | "return">("departure");
  const [selectedDeparture, setSelectedDeparture] = useState<FlightOffer | null>(null);

  const origin = searchParams.get("origin");
  const destination = searchParams.get("destination");
  const departureDate = searchParams.get("departureDate");
  const returnDate = searchParams.get("returnDate") || "";
  const adults = searchParams.get("adults") ?? "1";

  const isReturnTrip = Boolean(returnDate);

  const fetchFlights = async (from: string, to: string, date: string) => {
    const res = await fetch(`/api/flights?origin=${from}&destination=${to}&departureDate=${date}&adults=${adults}`);
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return (data.offers ?? []) as FlightOffer[];
  };

  useEffect(() => {
    if (!origin || !destination || !departureDate) {
      setError("Missing search fields. Please return to the landing page.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setStep("departure");
    setSelectedDeparture(null);

    fetchFlights(origin, destination, departureDate)
      .then((results) => setOffers(results))
      .catch(() => setError("Unable to load live flights. Please try again in a moment."))
      .finally(() => setLoading(false));
  }, [origin, destination, departureDate, returnDate, adults]);

  useEffect(() => {
    if (!offers.length) return;
    const codes = new Set<string>();
    offers.forEach((offer) => {
      if (offer.validatingAirline) codes.add(offer.validatingAirline);
      offer.segments.forEach((segment) => {
        if (segment.carrierCode) codes.add(segment.carrierCode);
      });
    });

    const list = Array.from(codes);
    if (!list.length) return;
    let cancelled = false;
    Promise.all(list.map((code) => cacheLogoFromApi(code).catch(() => null))).then(() => {
      if (cancelled) return;
    });

    return () => {
      cancelled = true;
    };
  }, [offers]);

  useEffect(() => {
    if (!isReturnTrip || !selectedDeparture || !origin || !destination || !returnDate) return;

    setLoading(true);
    setError(null);

    fetchFlights(destination, origin, returnDate)
      .then((results) => setOffers(results))
      .catch(() => setError("Unable to load return flights. Please try again."))
      .finally(() => setLoading(false));
  }, [isReturnTrip, selectedDeparture, origin, destination, returnDate]);

  const title = useMemo(() => {
    if (!isReturnTrip) return "Available Flights";
    return step === "departure" ? "Select Departure Flight" : "Select Return Flight";
  }, [isReturnTrip, step]);

  const subtitle = useMemo(() => {
    if (!isReturnTrip) return "Curated live results for your requested route.";
    return step === "departure" ? "Choose your outbound flight first." : "Now choose your return flight.";
  }, [isReturnTrip, step]);

  const routeSummary = useMemo(() => {
    if (!origin || !destination) return "Flight selection";
    return step === "departure" ? `${origin} to ${destination}` : `${destination} to ${origin}`;
  }, [destination, origin, step]);

  return (
    <>
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/50 bg-white/80 px-6 py-4 shadow-sm shadow-slate-200/40 backdrop-blur-xl md:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <button
            onClick={() => router.push("/")}
            className="font-headline text-2xl font-extrabold tracking-[-0.06em] text-slate-950"
          >
            FlightAI
          </button>
          <div className="hidden items-center gap-8 md:flex">
            <a className="font-headline text-sm font-medium tracking-tight text-slate-500 transition hover:text-slate-800" href="/">
              Home
            </a>
            <a className="border-b-2 border-slate-950 pb-1 font-headline text-sm font-semibold tracking-tight text-slate-950" href="#results">
              Flights
            </a>
            <a className="font-headline text-sm font-medium tracking-tight text-slate-500 transition hover:text-slate-800" href="#journey">
              Journey
            </a>
            <a className="font-headline text-sm font-medium tracking-tight text-slate-500 transition hover:text-slate-800" href="#contact">
              Contact
            </a>
          </div>
          <button
            onClick={() => router.push("/")}
            className="rounded-full bg-black px-6 py-2.5 font-headline text-sm font-semibold text-white transition hover:opacity-90"
          >
            Modify Search
          </button>
        </div>
      </nav>

      <main className="pt-24">
        <section className="relative px-6 pb-10 pt-10 md:px-8">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_18%,rgba(218,226,253,0.46),transparent_30%),radial-gradient(circle_at_85%_14%,rgba(226,195,131,0.16),transparent_25%)]" />
          <div className="mx-auto max-w-7xl">
            <div className="rounded-[2rem] border border-white/70 bg-white/60 p-8 shadow-[0_30px_90px_rgba(15,23,42,0.08)] backdrop-blur-sm md:p-10">
              <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-3xl">
                  <p className="font-label text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">FlightAI Selection Desk</p>
                  <h1 className="mt-4 font-headline text-4xl font-extrabold tracking-[-0.05em] text-slate-900 md:text-6xl">
                    {title}
                  </h1>
                  <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">{subtitle}</p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[28rem]">
                  <div className="rounded-[1.5rem] bg-[#f0f4f8] px-5 py-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Route</p>
                    <p className="mt-2 text-base font-semibold text-slate-900">{routeSummary}</p>
                  </div>
                  <div className="rounded-[1.5rem] bg-[#131b2e] px-5 py-4 text-white">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/55">Passengers</p>
                    <p className="mt-2 text-base font-semibold">{adults} traveler{adults === "1" ? "" : "s"}</p>
                  </div>
                </div>
              </div>

              <div id="journey" className="mt-8 flex flex-wrap items-center gap-4 text-sm text-slate-500">
                <div className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white/80 px-5 py-3">
                  <PlaneTakeoff className="h-4 w-4 text-slate-500" strokeWidth={2} />
                  <span className="font-medium text-slate-700">{origin ?? "Origin"}</span>
                  <ArrowRight className="h-4 w-4 text-slate-400" strokeWidth={2} />
                  <span className="font-medium text-slate-700">{destination ?? "Destination"}</span>
                </div>
                {departureDate && (
                  <div className="rounded-full border border-slate-200 bg-white/80 px-5 py-3">
                    Departing {departureDate}
                  </div>
                )}
                {returnDate && (
                  <div className="rounded-full border border-slate-200 bg-white/80 px-5 py-3">
                    Returning {returnDate}
                  </div>
                )}
              </div>

              {isReturnTrip && (
                <div className="mt-8 flex flex-wrap gap-3">
                  <div className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] ${
                    step === "departure" ? "bg-black text-white" : "border border-slate-200 bg-white text-slate-500"
                  }`}>
                    1. Departure
                  </div>
                  <div className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] ${
                    step === "return" ? "bg-black text-white" : "border border-slate-200 bg-white text-slate-500"
                  }`}>
                    2. Return
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        <section id="results" className="mx-auto max-w-7xl px-6 pb-24 md:px-8">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-label text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Live flight board</p>
              <p className="mt-2 text-sm text-slate-500">
                {loading ? "Refreshing airline options..." : `${offers.length} curated options available`}
              </p>
            </div>
            <button
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700 transition hover:border-slate-300"
              onClick={() => router.push("/")}
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={2.2} />
              Modify Search
            </button>
          </div>

          <div className="space-y-6">
            {loading && (
              <>
                <FlightSkeleton />
                <FlightSkeleton />
                <FlightSkeleton />
              </>
            )}

            {!loading && error && (
              <div className="rounded-[2rem] border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
                {error}
              </div>
            )}

            {!loading && !error && offers.length === 0 && (
              <div className="rounded-[2rem] border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
                No flights returned for this route. Try adjusting the dates or airports.
              </div>
            )}

            {!loading && !error && offers.map((offer) => (
              <FlightCard
                key={offer.id}
                flight={offer}
                onSelect={(flight) => {
                  if (!isReturnTrip) {
                    saveSelectedDeparture(flight);
                    clearSelectedReturn();
                    router.push("/passenger");
                    return;
                  }

                  if (step === "departure") {
                    saveSelectedDeparture(flight);
                    setSelectedDeparture(flight);
                    setStep("return");
                    return;
                  }

                  saveSelectedReturn(flight);
                  router.push("/passenger");
                }}
              />
            ))}
          </div>
        </section>
      </main>

      <footer id="contact" className="border-t border-slate-200/50 bg-[#f6fafe] px-6 py-12 md:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex flex-col items-center gap-2 md:items-start">
            <div className="font-headline text-lg font-black uppercase tracking-[-0.05em] text-slate-900">FlightAI</div>
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

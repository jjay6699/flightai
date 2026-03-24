"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Luggage,
  PlaneTakeoff,
  ShieldCheck,
  UserRound
} from "lucide-react";
import { FlightOffer, PassengerDetails } from "@/lib/types";
import { loadSelectedDeparture, loadSelectedReturn, savePassenger } from "@/lib/storage";
import { formatDate, formatDuration, formatTime } from "@/lib/flight-utils";
import { CabinClassOption, getCabinOptionsForTrip } from "@/lib/cabin";
import { fetchAirlineMeta } from "@/lib/airline-meta";
import { footerLinks } from "@/lib/footer-links";

type AirportNames = { name?: string | null; city?: string | null; country?: string | null };

async function fetchAirlineName(code: string) {
  const data = await fetchAirlineMeta(code);
  return data.name;
}

async function fetchAirport(code: string) {
  const res = await fetch(`/api/airport?code=${encodeURIComponent(code)}`);
  const data = await res.json();
  return data?.name || data?.city ? { name: data?.name ?? null, city: data?.city ?? null, country: data?.country ?? null } : null;
}

function buildFullName(details: PassengerDetails) {
  return [details.firstName, details.middleName, details.lastName].filter(Boolean).join(" ").trim();
}

function formatAirportLabel(code: string, airportNames: Record<string, AirportNames | null>) {
  const airport = airportNames[code];
  if (!airport) return code;
  return `${airport.city ?? airport.name ?? code}${airport.name && airport.city && airport.city !== airport.name ? `, ${airport.name}` : ""}`;
}

export default function PassengerPage() {
  const router = useRouter();
  const [departure, setDeparture] = useState<FlightOffer | null>(null);
  const [ret, setReturn] = useState<FlightOffer | null>(null);
  const [airlineNames, setAirlineNames] = useState<Record<string, string | null>>({});
  const [airportNames, setAirportNames] = useState<Record<string, AirportNames | null>>({});
  const [cabinOptions, setCabinOptions] = useState<CabinClassOption[]>(["Economy", "Premium Economy", "Business", "First"]);
  const [form, setForm] = useState<PassengerDetails>({
    firstName: "",
    middleName: "",
    lastName: "",
    passportNumber: "",
    seatPreference: "",
    cabinClass: "Economy"
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const selectedDeparture = loadSelectedDeparture();
    if (!selectedDeparture) {
      setError("No flight selected. Please return to the results page.");
      return;
    }
    setDeparture(selectedDeparture);
    setReturn(loadSelectedReturn());
  }, []);

  useEffect(() => {
    if (!departure) return;
    const outbound = departure.segments[0];
    const inbound = ret?.segments[0];

    const airlineCodes = [outbound.carrierCode, inbound?.carrierCode].filter(Boolean) as string[];
    const airportCodes = [outbound.departureIata, outbound.arrivalIata, inbound?.departureIata, inbound?.arrivalIata].filter(Boolean) as string[];

    Promise.all(airlineCodes.map(async (code) => [code, await fetchAirlineName(code)] as const)).then((entries) => {
      const next: Record<string, string | null> = {};
      entries.forEach(([code, name]) => {
        next[code] = name;
      });
      setAirlineNames(next);
    });

    Promise.all(airportCodes.map(async (code) => [code, await fetchAirport(code)] as const)).then((entries) => {
      const next: Record<string, AirportNames | null> = {};
      entries.forEach(([code, name]) => {
        next[code] = name;
      });
      setAirportNames(next);
    });

    const options = getCabinOptionsForTrip(airlineCodes);
    setCabinOptions(options);
    setForm((current) => ({
      ...current,
      cabinClass: current.cabinClass && options.includes(current.cabinClass) ? current.cabinClass : options[0]
    }));
  }, [departure, ret]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.firstName || !form.lastName || !departure) return;
    setLoading(true);
    setError(null);

    try {
      const bookingResponse = await fetch("/api/booking-ref");
      const bookingData = await bookingResponse.json();
      savePassenger({
        ...form,
        bookingRef: bookingData.bookingRef
      });
      router.push("/ticket");
    } catch {
      setError("Unable to create booking reference. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (error && !departure) {
    return (
      <>
        <TopNav onHome={() => router.push("/")} />
        <main className="pt-24">
          <section className="mx-auto max-w-5xl px-6 py-16 md:px-8">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
              {error}
            </div>
          </section>
        </main>
        <SiteFooter />
      </>
    );
  }

  if (!departure) {
    return null;
  }

  const outbound = departure.segments[0];
  const inbound = ret?.segments[0] ?? null;
  const fullName = buildFullName(form);
  const totalPrice = departure.price ? Number(departure.price) + (ret?.price ? Number(ret.price) : 0) : null;

  return (
    <>
      <TopNav onHome={() => router.push("/")} />

      <main className="pt-24">
        <section className="relative px-6 pb-10 pt-10 md:px-8">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_18%,rgba(218,226,253,0.46),transparent_30%),radial-gradient(circle_at_84%_14%,rgba(226,195,131,0.16),transparent_25%)]" />
          <div className="mx-auto max-w-7xl">
            <div className="rounded-[2rem] border border-white/70 bg-white/60 p-8 shadow-[0_30px_90px_rgba(15,23,42,0.08)] backdrop-blur-sm md:p-10">
              <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-3xl">
                  <p className="font-label text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                    FlightAI Traveler Desk
                  </p>
                  <h1 className="mt-4 font-headline text-4xl font-extrabold tracking-[-0.05em] text-slate-900 md:text-6xl">
                    Finalize passenger details.
                  </h1>
                  <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
                    Confirm the traveler name, seat preferences, and cabin details before we generate the final ticket.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[32rem]">
                  <InfoPanel
                    label="Primary Route"
                    value={`${outbound.departureIata} to ${outbound.arrivalIata}`}
                    tone="light"
                  />
                  <InfoPanel
                    label="Booking Status"
                    value={loading ? "Preparing reference" : "Ready for issuance"}
                    tone="dark"
                  />
                </div>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-4 text-sm text-slate-500">
                <div className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white/80 px-5 py-3">
                  <PlaneTakeoff className="h-4 w-4 text-slate-500" strokeWidth={2} />
                  <span className="font-medium text-slate-700">{outbound.departureIata}</span>
                  <ArrowRight className="h-4 w-4 text-slate-400" strokeWidth={2} />
                  <span className="font-medium text-slate-700">{outbound.arrivalIata}</span>
                </div>
                <div className="rounded-full border border-slate-200 bg-white/80 px-5 py-3">
                  Departure {formatDate(outbound.departureTime)}
                </div>
                {inbound && (
                  <div className="rounded-full border border-slate-200 bg-white/80 px-5 py-3">
                    Return {formatDate(inbound.departureTime)}
                  </div>
                )}
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <ProgressPill active>1. Flight Selection</ProgressPill>
                <ProgressPill active>2. Passenger Details</ProgressPill>
                <ProgressPill>3. Ticket Delivery</ProgressPill>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-24 md:px-8">
          <div className="grid gap-8 xl:grid-cols-[1.15fr,0.85fr]">
            <form
              id="details"
              className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)] backdrop-blur-sm md:p-8"
              onSubmit={handleSubmit}
            >
              <div className="flex flex-col gap-6 border-b border-slate-100 pb-6 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="font-label text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Traveler Information
                  </p>
                  <h2 className="mt-3 font-headline text-3xl font-bold tracking-[-0.04em] text-slate-900">
                    Issue details for {fullName || "your passenger"}
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
                    Required fields are kept minimal. Passport data is optional here and can be used for a more complete booking profile.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => router.push("/search")}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700 transition hover:border-slate-300"
                >
                  <ArrowLeft className="h-4 w-4" strokeWidth={2.2} />
                  Back to flights
                </button>
              </div>

              <div className="mt-8 grid gap-6">
                <div className="grid gap-5 md:grid-cols-2">
                  <Field
                    label="First name"
                    required
                    input={
                      <input
                        className="input mt-2"
                        value={form.firstName}
                        onChange={(event) => setForm({ ...form, firstName: event.target.value })}
                        placeholder="First name"
                        required
                      />
                    }
                  />
                  <Field
                    label="Last name"
                    required
                    input={
                      <input
                        className="input mt-2"
                        value={form.lastName}
                        onChange={(event) => setForm({ ...form, lastName: event.target.value })}
                        placeholder="Last name"
                        required
                      />
                    }
                  />
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <Field
                    label="Middle name"
                    input={
                      <input
                        className="input mt-2"
                        value={form.middleName}
                        onChange={(event) => setForm({ ...form, middleName: event.target.value })}
                        placeholder="Optional"
                      />
                    }
                  />
                  <Field
                    label="Passport number"
                    input={
                      <input
                        className="input mt-2"
                        value={form.passportNumber}
                        onChange={(event) => setForm({ ...form, passportNumber: event.target.value })}
                        placeholder="Optional"
                      />
                    }
                  />
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <Field
                    label="Seat preference"
                    input={
                      <select
                        className="input mt-2"
                        value={form.seatPreference}
                        onChange={(event) => setForm({ ...form, seatPreference: event.target.value })}
                      >
                        <option value="">No preference</option>
                        <option value="Window">Window</option>
                        <option value="Aisle">Aisle</option>
                        <option value="Middle">Middle</option>
                      </select>
                    }
                  />
                  <Field
                    label="Cabin class"
                    input={
                      <select
                        className="input mt-2"
                        value={form.cabinClass}
                        onChange={(event) => setForm({ ...form, cabinClass: event.target.value as CabinClassOption })}
                      >
                        {cabinOptions.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    }
                  />
                </div>
              </div>

              <div className="mt-8 grid gap-4 rounded-[1.6rem] border border-slate-200/80 bg-[#fbfcfe] p-5 md:grid-cols-3">
                <MiniStat icon={UserRound} label="Passenger" value={fullName || "Name pending"} />
                <MiniStat icon={Luggage} label="Seat request" value={form.seatPreference || "No preference"} />
                <MiniStat icon={ShieldCheck} label="Cabin" value={form.cabinClass || "Economy"} />
              </div>

              {error && <p className="mt-5 text-sm text-rose-500">{error}</p>}

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-full bg-black px-8 py-3.5 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Generating Ticket" : "Continue to ticket"}
                  <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
                </button>
                <p className="text-sm text-slate-500">
                  Next step creates your booking reference and prepares the ticket view.
                </p>
              </div>
            </form>

            <aside className="space-y-6">
              <div className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)] backdrop-blur-sm md:p-8 xl:sticky xl:top-28">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-label text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                      Journey Summary
                    </p>
                    <h2 className="mt-3 font-headline text-3xl font-bold tracking-[-0.04em] text-slate-900">
                      Selected flights
                    </h2>
                  </div>
                  <div className="rounded-full bg-[#eef3fb] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Review
                  </div>
                </div>

                <div className="mt-6 space-y-5">
                  <JourneyCard
                    title={`${outbound.departureIata} to ${outbound.arrivalIata}`}
                    airportFrom={formatAirportLabel(outbound.departureIata, airportNames)}
                    airportTo={formatAirportLabel(outbound.arrivalIata, airportNames)}
                    date={`${formatDate(outbound.departureTime)} at ${formatTime(outbound.departureTime)}`}
                    airline={`${airlineNames[outbound.carrierCode] ?? outbound.carrierCode} - ${outbound.carrierCode} ${outbound.flightNumber}`}
                    duration={formatDuration(outbound.duration)}
                    cabin={form.cabinClass ?? "Economy"}
                  />

                  {inbound && (
                    <JourneyCard
                      title={`${inbound.departureIata} to ${inbound.arrivalIata}`}
                      airportFrom={formatAirportLabel(inbound.departureIata, airportNames)}
                      airportTo={formatAirportLabel(inbound.arrivalIata, airportNames)}
                      date={`${formatDate(inbound.departureTime)} at ${formatTime(inbound.departureTime)}`}
                      airline={`${airlineNames[inbound.carrierCode] ?? inbound.carrierCode} - ${inbound.carrierCode} ${inbound.flightNumber}`}
                      duration={formatDuration(inbound.duration)}
                      cabin={form.cabinClass ?? "Economy"}
                    />
                  )}
                </div>

                <div className="mt-6 rounded-[1.6rem] bg-[#131b2e] p-5 text-white">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/60">Estimated total</p>
                  <div className="mt-3 flex items-end justify-between gap-4">
                    <div>
                      <p className="font-headline text-4xl font-bold tracking-[-0.05em]">
                        {totalPrice ? `$${totalPrice.toFixed(0)}` : departure.price ? `$${departure.price}` : "Quote"}
                      </p>
                      <p className="mt-2 text-sm text-white/60">Includes selected flight segment{inbound ? "s" : ""}</p>
                    </div>
                    <CheckCircle2 className="h-6 w-6 text-[#e2c383]" strokeWidth={2.2} />
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}

function TopNav({ onHome }: { onHome: () => void }) {
  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/50 bg-white/80 px-6 py-4 shadow-sm shadow-slate-200/40 backdrop-blur-xl md:px-8">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <button
          onClick={onHome}
          className="font-headline text-2xl font-extrabold tracking-[-0.06em] text-slate-950"
        >
          FlightAI
        </button>
        <div className="hidden items-center gap-8 md:flex">
          <a className="font-headline text-sm font-medium tracking-tight text-slate-500 transition hover:text-slate-800" href="/">
            Home
          </a>
          <a className="font-headline text-sm font-medium tracking-tight text-slate-500 transition hover:text-slate-800" href="/search">
            Flights
          </a>
          <a className="border-b-2 border-slate-950 pb-1 font-headline text-sm font-semibold tracking-tight text-slate-950" href="#details">
            Passenger
          </a>
          <a className="font-headline text-sm font-medium tracking-tight text-slate-500 transition hover:text-slate-800" href="#contact">
            Contact
          </a>
        </div>
        <button
          onClick={() => window.history.back()}
          className="rounded-full bg-black px-6 py-2.5 font-headline text-sm font-semibold text-white transition hover:opacity-90"
        >
          Review Flights
        </button>
      </div>
    </nav>
  );
}

function SiteFooter() {
  return (
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
  );
}

function InfoPanel({
  label,
  value,
  tone
}: {
  label: string;
  value: string;
  tone: "light" | "dark";
}) {
  return (
    <div className={`rounded-[1.5rem] px-5 py-4 ${tone === "dark" ? "bg-[#131b2e] text-white" : "bg-[#f0f4f8]"}`}>
      <p className={`text-[10px] font-semibold uppercase tracking-[0.22em] ${tone === "dark" ? "text-white/55" : "text-slate-400"}`}>
        {label}
      </p>
      <p className={`mt-2 text-base font-semibold ${tone === "dark" ? "text-white" : "text-slate-900"}`}>{value}</p>
    </div>
  );
}

function ProgressPill({
  children,
  active = false
}: {
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <div
      className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] ${
        active ? "bg-black text-white" : "border border-slate-200 bg-white text-slate-500"
      }`}
    >
      {children}
    </div>
  );
}

function Field({
  label,
  input,
  required = false
}: {
  label: string;
  input: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
        {label}
        {required ? " *" : ""}
      </label>
      {input}
    </div>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value
}: {
  icon: typeof UserRound;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white">
        <Icon className="h-4 w-4 text-slate-600" strokeWidth={2} />
      </div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">{label}</p>
        <p className="mt-1 text-sm font-semibold text-slate-700">{value}</p>
      </div>
    </div>
  );
}

function JourneyCard({
  title,
  airportFrom,
  airportTo,
  date,
  airline,
  duration,
  cabin
}: {
  title: string;
  airportFrom: string;
  airportTo: string;
  date: string;
  airline: string;
  duration: string;
  cabin: string;
}) {
  return (
    <div className="rounded-[1.6rem] border border-slate-200/80 bg-[#fbfcfe] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-headline text-2xl font-bold tracking-[-0.04em] text-slate-900">{title}</h3>
          <p className="mt-2 text-sm text-slate-500">{airportFrom}</p>
          <p className="text-sm text-slate-500">{airportTo}</p>
        </div>
        <div className="rounded-full bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          Active
        </div>
      </div>

      <div className="mt-4 space-y-2 text-sm text-slate-600">
        <p>{date}</p>
        <p>{airline}</p>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-600">
          <Clock3 className="h-3.5 w-3.5" strokeWidth={2} />
          {duration}
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-600">
          <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2} />
          {cabin}
        </div>
      </div>
    </div>
  );
}

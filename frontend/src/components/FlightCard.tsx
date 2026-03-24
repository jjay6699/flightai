"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Clock3, Plane, Ticket } from "lucide-react";
import { FlightOffer } from "@/lib/types";
import { formatDate, formatDuration, formatTime } from "@/lib/flight-utils";
import { fetchAirlineMeta } from "@/lib/airline-meta";

export default function FlightCard({
  flight,
  onSelect
}: {
  flight: FlightOffer;
  onSelect: (flight: FlightOffer) => void;
}) {
  const [logoFailed, setLogoFailed] = useState(false);
  const [airlineName, setAirlineName] = useState<string | null>(null);
  const outbound = flight.segments[0];
  const inbound = flight.segments.length > 1 ? flight.segments[1] : null;
  const stops = Math.max(0, flight.segments.length - 1);
  const logoSrc = `/api/logo?code=${encodeURIComponent(flight.validatingAirline)}&v=2`;

  useEffect(() => {
    let active = true;
    fetchAirlineMeta(flight.validatingAirline)
      .then((meta) => {
        if (!active) return;
        setAirlineName(meta.name);
      })
      .catch(() => {
        if (!active) return;
        setAirlineName(null);
      });

    return () => {
      active = false;
    };
  }, [flight.validatingAirline]);

  return (
    <article className="overflow-hidden rounded-[1.6rem] border border-white/70 bg-white/90 shadow-[0_18px_50px_rgba(15,23,42,0.07)] backdrop-blur-sm transition hover:-translate-y-1 hover:shadow-[0_24px_64px_rgba(15,23,42,0.1)]">
      <div className="p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {!logoFailed ? (
              <img
                src={logoSrc}
                alt={`${flight.validatingAirline} logo`}
                className="h-14 w-14 object-contain"
                onError={() => setLogoFailed(true)}
              />
            ) : (
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-[#f4f7fb] text-xs font-semibold text-slate-500">
                {flight.validatingAirline}
              </div>
            )}

            <div>
              <p className="font-headline text-[1.55rem] font-bold leading-none tracking-[-0.04em] text-slate-900">
                {flight.validatingAirline} {outbound.flightNumber}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {airlineName ?? flight.validatingAirline} - {outbound.aircraft ?? "A320"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <div className="flex items-baseline gap-2 text-right">
              <p className="font-headline text-[1.9rem] font-bold leading-none tracking-[-0.05em] text-slate-900">
                {flight.price ? `$${flight.price}` : "Quote"}
              </p>
              <p className="text-xs font-medium text-slate-500">per traveler</p>
            </div>
            <button
              onClick={() => onSelect(flight)}
              className="inline-flex items-center gap-2 rounded-full bg-black px-5 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:-translate-y-0.5"
            >
              Select Flight
              <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
            </button>
          </div>
        </div>

        <div className="mt-5 rounded-[1.4rem] border border-slate-200/80 bg-[#fbfcfe] px-5 py-5">
          <div className="grid items-center gap-5 md:grid-cols-[1fr_auto_1fr]">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Departure</p>
              <p className="mt-1.5 font-headline text-[2rem] font-bold tracking-[-0.04em] text-slate-900">
                {formatTime(outbound.departureTime)}
              </p>
              <p className="text-base font-semibold text-slate-700">{outbound.departureIata}</p>
              <p className="mt-0.5 text-sm text-slate-500">{formatDate(outbound.departureTime)}</p>
            </div>

            <div className="flex min-w-[15rem] flex-col items-center gap-3 text-center">
              <div className="flex w-full items-center gap-3 text-slate-400">
                <span className="h-2 w-2 rounded-full bg-slate-300" />
                <div className="h-px flex-1 bg-slate-300" />
                <Plane className="h-4 w-4 text-slate-500" strokeWidth={2} />
                <div className="h-px flex-1 bg-slate-300" />
                <span className="h-2 w-2 rounded-full bg-slate-300" />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                  {stops === 0 ? "Nonstop" : `${stops} stop${stops > 1 ? "s" : ""}`}
                </p>
                <p className="text-sm font-medium text-slate-500">{formatDuration(outbound.duration)}</p>
              </div>
            </div>

            <div className="md:text-right">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Arrival</p>
              <p className="mt-1.5 font-headline text-[2rem] font-bold tracking-[-0.04em] text-slate-900">
                {formatTime(outbound.arrivalTime)}
              </p>
              <p className="text-base font-semibold text-slate-700">{outbound.arrivalIata}</p>
              <p className="mt-0.5 text-sm text-slate-500">{formatDate(outbound.arrivalTime)}</p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-500">
          <MetaPill icon={Clock3} label="Duration" value={formatDuration(outbound.duration)} />
          <MetaPill icon={Ticket} label="Segments" value={String(flight.segments.length)} />
          <div className="rounded-full border border-slate-200 bg-white px-4 py-2.5">
            {stops === 0 ? "Direct route" : `${stops} stop routing`}
          </div>
          {inbound && (
            <div className="rounded-full border border-dashed border-slate-200 bg-white px-4 py-2.5">
              Return available {inbound.departureIata} to {inbound.arrivalIata}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function MetaPill({
  icon: Icon,
  label,
  value
}: {
  icon: typeof Clock3;
  label: string;
  value: string;
}) {
  return (
    <div className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-2.5">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f0f4f8]">
        <Icon className="h-4 w-4 text-slate-600" strokeWidth={2} />
      </div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">{label}</p>
        <p className="text-sm font-semibold text-slate-700">{value}</p>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { FlightSegment, PassengerDetails } from "@/lib/types";
import { formatDate, formatTime } from "@/lib/flight-utils";
import { getAirlineBrand } from "@/lib/airline-branding";
import { cacheLogoFromApi, getCachedLogo } from "@/lib/logo-cache";

type BarcodePart = {
  unit: number;
  filled: boolean;
};

function buildBarcode(seed: string): BarcodePart[] {
  // Deterministic pseudo-random pattern so the same ticket always renders the same visual barcode.
  let state = 0;
  for (const char of seed) {
    state = (state * 31 + char.charCodeAt(0)) >>> 0;
  }

  const next = () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };

  const parts: BarcodePart[] = [];

  // Quiet zone
  parts.push({ unit: 7, filled: false });

  // Start guard pattern
  parts.push({ unit: 2, filled: true });
  parts.push({ unit: 1, filled: false });
  parts.push({ unit: 1, filled: true });
  parts.push({ unit: 1, filled: false });
  parts.push({ unit: 2, filled: true });
  parts.push({ unit: 2, filled: false });

  // Main body
  for (let i = 0; i < 120; i += 1) {
    parts.push({ unit: 1 + Math.floor(next() * 3), filled: true });
    parts.push({ unit: 1 + Math.floor(next() * 2), filled: false });
  }

  // End guard pattern
  parts.push({ unit: 2, filled: true });
  parts.push({ unit: 1, filled: false });
  parts.push({ unit: 1, filled: true });
  parts.push({ unit: 1, filled: false });
  parts.push({ unit: 2, filled: true });

  // Quiet zone
  parts.push({ unit: 7, filled: false });

  return parts;
}

function buildFullName(details: PassengerDetails) {
  return [details.firstName, details.middleName, details.lastName].filter(Boolean).join(" ").trim();
}

export default function BoardingPassCard({
  label,
  segment,
  passenger,
  bookingRef,
  seat,
  boardingTime,
  qrUrl,
  airlineName,
  airportNames,
  logoUrl
}: {
  label: string;
  segment: FlightSegment;
  passenger: PassengerDetails;
  bookingRef: string;
  seat: string;
  boardingTime: string;
  qrUrl?: string | null;
  airlineName?: string | null;
  airportNames?: { departure?: string | null; arrival?: string | null };
  logoUrl?: string | null;
}) {
  const [logoIndex, setLogoIndex] = useState(0);
  const [cachedLogoUrl, setCachedLogoUrl] = useState<string | null>(() => getCachedLogo(segment.carrierCode));
  const fallbackApiLogo = `/api/logo?code=${segment.carrierCode}&v=2`;
  const directAirhex = `https://content.airhex.com/content/logos/airlines_${segment.carrierCode}_200_200_s.png`;
  const logoCandidates = [
    ...(logoUrl && !logoUrl.includes("image/svg+xml") ? [logoUrl] : []),
    ...(cachedLogoUrl && !cachedLogoUrl.includes("image/svg+xml") ? [cachedLogoUrl] : []),
    fallbackApiLogo,
    directAirhex
  ];
  const resolvedLogoUrl = logoCandidates[logoIndex];
  const logoFailed = logoIndex >= logoCandidates.length;
  const stubBarcode = useMemo(() => buildBarcode(`${bookingRef}${segment.flightNumber}`), [bookingRef, segment.flightNumber]);
  const barcodeTotalUnits = useMemo(() => stubBarcode.reduce((sum, part) => sum + part.unit, 0), [stubBarcode]);
  const fullName = buildFullName(passenger);
  const brand = getAirlineBrand(segment.carrierCode);

  useEffect(() => {
    setLogoIndex(0);
    setCachedLogoUrl(getCachedLogo(segment.carrierCode));

    let active = true;
    cacheLogoFromApi(segment.carrierCode)
      .then((dataUrl) => {
        if (!active || !dataUrl || dataUrl.includes("image/svg+xml")) return;
        setCachedLogoUrl(dataUrl);
      })
      .catch(() => {
        // Keep existing fallbacks.
      });

    return () => {
      active = false;
    };
  }, [segment.carrierCode]);

  return (
    <div className="overflow-hidden rounded-3xl border border-line bg-white shadow-lift">
      <div className="flex items-center justify-between px-6 py-3 text-white" style={{ backgroundColor: brand.primary }}>
        <div className="text-xs font-semibold uppercase tracking-[0.3em]">Boarding Pass</div>
        <div className="text-xs font-semibold uppercase tracking-[0.35em]">{bookingRef}</div>
      </div>

      <div className="grid gap-5 px-6 py-4 lg:grid-cols-[1.45fr,0.05fr,0.85fr]">
        <div className="space-y-3">
          <div className="flex items-center gap-3 border-b border-line pb-3">
            {!logoFailed ? (
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white p-1.5">
                <img
                  src={resolvedLogoUrl}
                  alt={`${segment.carrierCode} logo`}
                  className="h-9 w-9 object-contain"
                  onError={() => setLogoIndex((current) => current + 1)}
                />
              </div>
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-sm font-semibold text-slate-500 ring-1 ring-slate-200/90">
                {segment.carrierCode}
              </div>
            )}
            <div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Airline</div>
              <div className="text-sm font-semibold text-ink">{airlineName ?? segment.carrierCode}</div>
            </div>
            <div className="border-l border-line pl-3">
              <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Flight</div>
              <div className="text-sm font-semibold text-ink">{segment.carrierCode} {segment.flightNumber}</div>
            </div>
          </div>

          <div className="text-[32px] font-semibold leading-none text-ink">
            {segment.departureIata} -&gt; {segment.arrivalIata}
          </div>
          <div className="space-y-1 border-b border-line pb-3 text-xs text-slate-500">
            <div>
              Departure: {airportNames?.departure ?? ""} {airportNames?.departure ? `(${segment.departureIata})` : segment.departureIata}
            </div>
            <div>
              Arrival: {airportNames?.arrival ?? ""} {airportNames?.arrival ? `(${segment.arrivalIata})` : segment.arrivalIata}
            </div>
          </div>

          <div className="grid gap-2 text-sm text-slate-600">
            <div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Passenger</div>
              <div className="text-lg font-semibold text-ink">{fullName}</div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Departure</div>
                <div className="text-lg font-semibold text-ink">{formatTime(segment.departureTime)}</div>
                <div className="text-xs text-slate-500">{formatDate(segment.departureTime)}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Arrival</div>
                <div className="text-lg font-semibold text-ink">{formatTime(segment.arrivalTime)}</div>
                <div className="text-xs text-slate-500">{formatDate(segment.arrivalTime)}</div>
              </div>
            </div>
            <div className="grid gap-4 border-t border-line pt-2 text-sm sm:grid-cols-3">
              <div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Cabin</div>
                <div className="font-semibold text-ink">{passenger.cabinClass ?? "Economy"}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Seat</div>
                <div className="font-semibold text-ink">{seat}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Boarding</div>
                <div className="font-semibold text-ink">{boardingTime}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="hidden items-center justify-center lg:flex">
          <div className="h-full w-px border-l border-dashed border-line" />
        </div>

        <div className="flex h-full flex-col gap-3">
          <div className="flex items-center gap-3">
            {!logoFailed ? (
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white p-1.5">
                <img
                  src={resolvedLogoUrl}
                  alt={`${segment.carrierCode} logo`}
                  className="h-7 w-7 object-contain"
                  onError={() => setLogoIndex((current) => current + 1)}
                />
              </div>
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-[11px] font-semibold text-slate-500 ring-1 ring-slate-200/90">
                {segment.carrierCode}
              </div>
            )}
            <div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">
                {airlineName ?? segment.carrierCode}
              </div>
              <div className="text-sm font-semibold text-ink">{segment.carrierCode} {segment.flightNumber}</div>
            </div>
          </div>

          <div className="flex min-h-[220px] flex-col rounded-2xl border border-dashed border-line bg-slate-50 p-3" style={{ borderColor: brand.soft }}>
            <div className="flex flex-1 items-center justify-center rounded-2xl border border-line bg-white p-3">
              {qrUrl ? (
                <img src={qrUrl} alt="QR" className="h-36 w-36 max-h-[150px] max-w-[150px]" />
              ) : (
                <div className="h-36 w-36 max-h-[150px] max-w-[150px]" />
              )}
            </div>
            <div className="mt-2 text-center text-[10px] uppercase tracking-[0.2em] text-slate-400">
              Scan for boarding
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 border-b border-line pb-3 text-xs text-slate-600">
            <div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Passenger</div>
              <div className="font-semibold text-ink">{fullName}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Route</div>
              <div className="font-semibold text-ink">{segment.departureIata} -&gt; {segment.arrivalIata}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Cabin</div>
              <div className="font-semibold text-ink">{passenger.cabinClass ?? "Economy"}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Seat</div>
              <div className="font-semibold text-ink">{seat}</div>
            </div>
          </div>

          <div className="mt-auto">
            <div className="h-10 w-full overflow-hidden rounded-sm border border-line bg-white">
              <div className="flex h-full items-stretch">
                {stubBarcode.map((part, index) => (
                  <div
                    key={`${part.unit}-${index}`}
                    style={{ width: `${(part.unit / barcodeTotalUnits) * 100}%` }}
                    className={part.filled ? "bg-ink" : "bg-transparent"}
                  />
                ))}
              </div>
            </div>
            <div className="mt-1 text-[9px] uppercase tracking-[0.18em] text-slate-400">
              {segment.carrierCode} {segment.flightNumber} · {bookingRef}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-line px-6 py-3 text-xs uppercase tracking-[0.2em] text-slate-400">
        <span>{label}</span>
        <span>Boarding closes 15 minutes before departure</span>
      </div>
    </div>
  );
}

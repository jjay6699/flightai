"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import TicketPrintDocument from "@/components/TicketPrintDocument";
import { cacheLogoFromApi, getCachedLogo } from "@/lib/logo-cache";
import { fetchAirlineMeta } from "@/lib/airline-meta";

type TicketPayload = {
  bookingRef: string;
  ticketData: {
    passenger: {
      firstName: string;
      middleName?: string;
      lastName: string;
      passportNumber?: string;
      seatPreference?: string;
      cabinClass?: "Economy" | "Premium Economy" | "Business" | "First";
    };
    segments: Array<{
      departureIata: string;
      arrivalIata: string;
      departureTime: string;
      arrivalTime: string;
      duration: string;
      carrierCode: string;
      flightNumber: string;
      aircraft?: string;
      stops: number;
    }>;
    issueDate: string;
    totalFare: string;
    airlineNames: Record<number, string | null | undefined>;
    passes: Array<{
      label: string;
      seat: string;
      boardingTime: string;
    }>;
    airportNames: Record<number, {
      departure?: { name?: string | null; city?: string | null; country?: string | null } | null;
      arrival?: { name?: string | null; city?: string | null; country?: string | null } | null;
    }>;
  };
};

function TicketPrintPageContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams?.get("sessionId") ?? null;
  const bookingRef = searchParams?.get("bookingRef") ?? null;
  const type = (searchParams?.get("type") ?? "bundle") as "bundle" | "boarding_passes" | "itinerary";
  const [payload, setPayload] = useState<TicketPayload | null>(null);
  const [logoMap, setLogoMap] = useState<Record<string, string>>({});
  const [qrReady, setQrReady] = useState(false);
  const [logosReady, setLogosReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId || !bookingRef) {
      setError("Missing session or booking reference.");
      return;
    }

    fetch(`/api/payments/ticket-data/${encodeURIComponent(sessionId)}?bookingRef=${encodeURIComponent(bookingRef)}&type=${encodeURIComponent(type)}`, {
      cache: "no-store"
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Unable to load printable ticket");
        }
        return data as TicketPayload;
      })
      .then((data) => {
        setPayload(data);
      })
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : "Unable to load printable ticket");
      });
  }, [sessionId, bookingRef, type]);

  useEffect(() => {
    if (!payload) return;
    if (type === "itinerary") {
      setLogosReady(true);
      return;
    }
    setLogosReady(false);

    Promise.all(
      payload.ticketData.segments.map(async (segment) => {
        const airlineMeta = await fetchAirlineMeta(segment.carrierCode);
        const apiLogo = airlineMeta.logo;
        if (apiLogo) return [segment.carrierCode, apiLogo] as const;
        const cached = getCachedLogo(segment.carrierCode);
        if (cached) return [segment.carrierCode, cached] as const;
        const fetched = await cacheLogoFromApi(segment.carrierCode);
        return [segment.carrierCode, fetched] as const;
      })
    ).then((entries) => {
      const next: Record<string, string> = {};
      entries.forEach(([code, url]) => {
        if (url) next[code] = url;
      });
      setLogoMap(next);
      setLogosReady(true);
    });
  }, [payload]);

  useEffect(() => {
    if (!payload) return;
    if (type === "itinerary") {
      setQrReady(true);
      return;
    }

    import("qrcode").then((QRCode) => {
      Promise.all(
        payload.ticketData.segments.map((segment) =>
          QRCode.toDataURL(
            `PASS|${payload.bookingRef}|${segment.departureIata}|${segment.arrivalIata}|${segment.departureTime}`
          )
        )
      ).then((urls) => {
        setPayload((current) => current ? {
          ...current,
          ticketData: {
            ...current.ticketData,
            passes: current.ticketData.passes.map((item, index) => ({
              ...item,
              qrUrl: urls[index]
            }))
          }
        } : current);
        setQrReady(true);
      });
    });
  }, [payload?.bookingRef, payload?.ticketData?.segments]);

  const isReady = Boolean(payload) && qrReady && logosReady;

  return (
    <main className="min-h-screen bg-white">
      <style jsx global>{`
        @page boarding {
          size: A4 landscape;
          margin: 0;
        }
        @page itinerary {
          size: A4 portrait;
          margin: 0;
        }
        html, body {
          background: #ffffff;
          margin: 0;
          padding: 0;
        }
        [data-print-page] {
          page: boarding;
          break-after: page;
          page-break-after: always;
          break-inside: avoid;
        }
        [data-itinerary-page] {
          page: itinerary;
          break-after: page;
          page-break-after: always;
          break-inside: avoid;
          box-shadow: none !important;
        }
        [data-print-ready="true"] {
          background: #ffffff;
        }
      `}</style>

      {!isReady && !error && (
        <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">
          Preparing printable documents...
        </div>
      )}

      {error && (
        <div className="flex min-h-screen items-center justify-center text-sm text-rose-600">
          {error}
        </div>
      )}

      {payload && (
        <div data-print-ready={isReady ? "true" : "false"}>
          <TicketPrintDocument
            bookingRef={payload.bookingRef}
            passenger={payload.ticketData.passenger}
            segments={payload.ticketData.segments}
            issueDate={payload.ticketData.issueDate}
            airportNames={payload.ticketData.airportNames}
            airlineNames={payload.ticketData.airlineNames}
            passes={payload.ticketData.passes}
            totalFare={payload.ticketData.totalFare}
            logoMap={logoMap}
            type={type}
          />
        </div>
      )}
    </main>
  );
}

export default function TicketPrintPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-white text-sm text-slate-500">
          Preparing printable documents...
        </main>
      }
    >
      <TicketPrintPageContent />
    </Suspense>
  );
}

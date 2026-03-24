"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Download,
  LoaderCircle,
  LockKeyhole,
  PlaneTakeoff,
  ShieldCheck,
  Ticket as TicketIcon,
  UserRound
} from "lucide-react";
import { FlightOffer, PassengerDetails, FlightSegment, PurchaseType } from "@/lib/types";
import { loadPassenger, loadSelectedDeparture, loadSelectedReturn, clearSession, loadBookingEntitlement, saveBookingEntitlement } from "@/lib/storage";
import { formatDate, formatTime, generateBoardingTime, generateSeat } from "@/lib/flight-utils";
import BoardingPassCard from "@/components/BoardingPassCard";
import ItineraryDocument from "@/components/ItineraryDocument";
import { cacheLogoFromApi, getCachedLogo } from "@/lib/logo-cache";
import { fetchAirlineMeta } from "@/lib/airline-meta";

const pxToPt = 0.75;
const a4WidthPt = 595.28;
const a4HeightPt = 841.89;
const marginPt = 36;

type PassData = {
  label: string;
  segmentIndex: number;
  seat: string;
  boardingTime: string;
  qrUrl?: string | null;
};

type ExportPage = {
  element: HTMLElement | null;
  kind: "a4" | "fit";
};

type AirportNames = { name?: string | null; city?: string | null; country?: string | null };

type SegmentMeta = {
  airlineName?: string | null;
  airlineLogo?: string | null;
  departureAirport?: AirportNames | null;
  arrivalAirport?: AirportNames | null;
};

const footerLinks = [
  "Privacy Policy",
  "Terms of Carriage",
  "International Visas",
  "GDPR Compliance"
];

const purchaseOptions: Array<{
  type: PurchaseType;
  title: string;
  priceLabel: string;
  description: string;
}> = [
  {
    type: "bundle_both",
    title: "Unlock boarding passes + itinerary",
    priceLabel: "$20",
    description: "Best value. Removes watermarks and enables every export."
  },
  {
    type: "boarding_passes_only",
    title: "Unlock boarding passes",
    priceLabel: "$15",
    description: "Removes the pass watermark and enables QR-ready boarding pass downloads."
  },
  {
    type: "itinerary_only",
    title: "Unlock itinerary only",
    priceLabel: "$15",
    description: "Removes the itinerary watermark and enables A4 itinerary export."
  }
];

function buildFullName(details: PassengerDetails) {
  return [details.firstName, details.middleName, details.lastName].filter(Boolean).join(" ").trim();
}

function formatMoney(value: string | null, currency: string | null) {
  if (!value) return "N/A";
  const amount = Number(value);
  if (Number.isNaN(amount)) return value;
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: 0
    }).format(amount);
  } catch {
    return `${currency || "$"}${amount}`;
  }
}

function formatAirportLabel(code: string, airport?: AirportNames | null) {
  if (!airport) return code;
  return `${airport.city ?? airport.name ?? code}${airport.name && airport.city && airport.city !== airport.name ? `, ${airport.name}` : ""}`;
}

async function fetchAirport(code: string) {
  const res = await fetch(`/api/airport?code=${encodeURIComponent(code)}`);
  const data = await res.json();
  return data?.name || data?.city ? { name: data?.name ?? null, city: data?.city ?? null, country: data?.country ?? null } : null;
}

export default function TicketPage() {
  const router = useRouter();
  const [departure, setDeparture] = useState<FlightOffer | null>(null);
  const [ret, setReturn] = useState<FlightOffer | null>(null);
  const [passenger, setPassenger] = useState<(PassengerDetails & { bookingRef: string }) | null>(null);
  const [passes, setPasses] = useState<PassData[]>([]);
  const [segmentMeta, setSegmentMeta] = useState<Record<number, SegmentMeta>>({});
  const [logoMap, setLogoMap] = useState<Record<string, string>>({});
  const [entitlement, setEntitlement] = useState({
    boardingPasses: false,
    itinerary: false,
    lastSessionId: ""
  });
  const [checkoutLoading, setCheckoutLoading] = useState<PurchaseType | null>(null);
  const [verificationState, setVerificationState] = useState<"idle" | "verifying" | "success" | "error">("idle");
  const [paymentMessage, setPaymentMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const passRefs = useRef<Array<HTMLDivElement | null>>([]);
  const itineraryRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const selectedDeparture = loadSelectedDeparture();
    const selectedReturn = loadSelectedReturn();
    const passengerData = loadPassenger();
    if (!selectedDeparture || !passengerData) {
      setError("Missing flight or passenger details. Please restart your booking.");
      return;
    }

    setDeparture(selectedDeparture);
    setReturn(selectedReturn);
    setPassenger(passengerData);
    const existingEntitlement = loadBookingEntitlement(passengerData.bookingRef);
    if (existingEntitlement) {
      setEntitlement({
        boardingPasses: existingEntitlement.boardingPasses,
        itinerary: existingEntitlement.itinerary,
        lastSessionId: existingEntitlement.lastSessionId || ""
      });
    }

    const segments: FlightSegment[] = [selectedDeparture.segments[0]];
    if (selectedReturn?.segments[0]) {
      segments.push(selectedReturn.segments[0]);
    }

    const passData: PassData[] = segments.map((segment, index) => ({
      label: index === 0 ? "Departure" : "Return",
      segmentIndex: index,
      seat: generateSeat(passengerData.seatPreference),
      boardingTime: generateBoardingTime(segment.departureTime)
    }));

    setPasses(passData);

    Promise.all(
      segments.map(async (segment, index) => {
        const [airlineMeta, departureAirport, arrivalAirport] = await Promise.all([
          fetchAirlineMeta(segment.carrierCode),
          fetchAirport(segment.departureIata),
          fetchAirport(segment.arrivalIata)
        ]);
        return [index, { airlineName: airlineMeta.name, airlineLogo: airlineMeta.logo, departureAirport, arrivalAirport }] as const;
      })
    ).then((entries) => {
      const next: Record<number, SegmentMeta> = {};
      entries.forEach(([index, meta]) => {
        next[index] = meta;
      });
      setSegmentMeta(next);
    });

    Promise.all(
      segments.map(async (segment) => {
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
    });
  }, []);

  useEffect(() => {
    if (!departure || !passenger) return;

    const sessionId = new URLSearchParams(window.location.search).get("session_id");
    const checkoutState = new URLSearchParams(window.location.search).get("checkout");

    if (checkoutState === "cancelled") {
      setPaymentMessage("Checkout was cancelled. Your previews are still available and the documents stay locked until payment is completed.");
      window.history.replaceState({}, "", "/ticket");
      return;
    }

    if (!sessionId) return;

    setVerificationState("verifying");
    setPaymentMessage("Verifying your Stripe test payment.");

    fetch(`/api/payments/verify-payment/${encodeURIComponent(sessionId)}?bookingRef=${encodeURIComponent(passenger.bookingRef)}`, {
      cache: "no-store"
    })
      .then(async (res) => {
        const payload = await res.json();
        if (!res.ok || !payload.success) {
          throw new Error(payload.error || "Payment verification failed");
        }
        return payload;
      })
      .then((payload) => {
        const nextEntitlement = {
          boardingPasses: Boolean(payload.access?.boardingPasses),
          itinerary: Boolean(payload.access?.itinerary),
          lastSessionId: sessionId
        };
        setEntitlement((current) => ({
          boardingPasses: current.boardingPasses || nextEntitlement.boardingPasses,
          itinerary: current.itinerary || nextEntitlement.itinerary,
          lastSessionId: sessionId
        }));
        saveBookingEntitlement(passenger.bookingRef, {
          ...nextEntitlement,
          lastSessionId: sessionId
        });
        setVerificationState("success");
        setPaymentMessage("Payment confirmed. Your documents are now unlocked for this booking.");
        window.history.replaceState({}, "", "/ticket");
      })
      .catch((verificationError) => {
        setVerificationState("error");
        setPaymentMessage(verificationError instanceof Error ? verificationError.message : "Unable to verify payment.");
        window.history.replaceState({}, "", "/ticket");
      });
  }, [departure, passenger]);

  useEffect(() => {
    if (!departure || !passenger) return;

    if (!entitlement.boardingPasses) {
      setPasses((current) => current.map((item) => ({ ...item, qrUrl: undefined })));
      return;
    }

    const segments: FlightSegment[] = [departure.segments[0], ...(ret?.segments[0] ? [ret.segments[0]] : [])];
    import("qrcode").then((QRCode) => {
      Promise.all(
        segments.map((segment) =>
          QRCode.toDataURL(
            `PASS|${passenger.bookingRef}|${segment.departureIata}|${segment.arrivalIata}|${segment.departureTime}`
          )
        )
      ).then((urls) => {
        setPasses((prev) => prev.map((item, idx) => ({ ...item, qrUrl: urls[idx] })));
      });
    });
  }, [departure, ret, passenger, entitlement.boardingPasses]);

  async function startCheckout(purchaseType: PurchaseType) {
    if (!passenger) return;
    setCheckoutLoading(purchaseType);
    setPaymentMessage(null);

    try {
      const response = await fetch("/api/payments/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          bookingRef: passenger.bookingRef,
          passengerName: buildFullName(passenger),
          purchaseType,
          ticketData: ticketPayload
        })
      });
      const payload = await response.json();
      if (!response.ok || !payload.url) {
        throw new Error(payload.error || "Unable to start Stripe checkout");
      }

      window.location.href = payload.url;
    } catch (checkoutError) {
      setPaymentMessage(checkoutError instanceof Error ? checkoutError.message : "Unable to start checkout.");
      setCheckoutLoading(null);
    }
  }

  async function downloadElements(pages: ExportPage[], filename: string) {
    const validPages = pages.filter((page): page is { element: HTMLElement; kind: "a4" | "fit" } => Boolean(page.element));
    if (!validPages.length) return;
    const html2canvas = (await import("html2canvas")).default;
    const { jsPDF } = await import("jspdf");

    const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });

    for (let index = 0; index < validPages.length; index += 1) {
      const { element, kind } = validPages[index];
      const canvas = await html2canvas(element, { scale: 2, backgroundColor: "#ffffff", useCORS: true });
      const imgData = canvas.toDataURL("image/png");

      if (index > 0) {
        pdf.addPage();
      }

      if (kind === "a4") {
        pdf.addImage(imgData, "PNG", 0, 0, a4WidthPt, a4HeightPt);
      } else {
        const widthPt = canvas.width * pxToPt * 0.5;
        const heightPt = canvas.height * pxToPt * 0.5;
        const scale = Math.min((a4WidthPt - marginPt * 2) / widthPt, (a4HeightPt - marginPt * 2) / heightPt);
        const renderWidth = widthPt * scale;
        const renderHeight = heightPt * scale;
        const x = (a4WidthPt - renderWidth) / 2;
        const y = (a4HeightPt - renderHeight) / 2;
        pdf.addImage(imgData, "PNG", x, y, renderWidth, renderHeight);
      }
    }

    pdf.save(filename);
  }

  function getItineraryPages(): ExportPage[] {
    if (!itineraryRef.current) return [];
    return Array.from(itineraryRef.current.querySelectorAll("[data-itinerary-page]")).map((element) => ({
      element: element as HTMLElement,
      kind: "a4" as const
    }));
  }

  if (error) {
    return (
      <>
        <TopNav
          onHome={() => router.push("/")}
          onReset={() => {
            clearSession();
            router.push("/");
          }}
        />
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

  if (!departure || !passenger) {
    return null;
  }

  const outbound = departure.segments[0];
  const inbound = ret?.segments[0] ?? null;
  const fullName = buildFullName(passenger);
  const segments: FlightSegment[] = [outbound, ...(inbound ? [inbound] : [])];
  const totalFare = formatMoney(
    departure.price ? String(Number(departure.price) + (ret?.price ? Number(ret.price) : 0)) : departure.price,
    departure.currency
  );
  const issueDate = formatDate(new Date().toISOString());
  const airlineNamesByIndex = segments.reduce<Record<number, string | null | undefined>>((acc, segment, index) => {
    acc[index] = segmentMeta[index]?.airlineName ?? segment.carrierCode;
    return acc;
  }, {});
  const canDownloadBoarding = entitlement.boardingPasses;
  const canDownloadItinerary = entitlement.itinerary;
  const canDownloadBundle = canDownloadBoarding && canDownloadItinerary;
  const ticketPayload = {
    passenger,
    segments,
    issueDate,
    totalFare,
    airlineNames: airlineNamesByIndex,
    passes: passes.map((item) => ({
      label: item.label,
      seat: item.seat,
      boardingTime: item.boardingTime
    })),
    airportNames: segments.reduce<Record<number, { departure?: SegmentMeta["departureAirport"]; arrival?: SegmentMeta["arrivalAirport"] }>>((acc, _segment, index) => {
      acc[index] = {
        departure: segmentMeta[index]?.departureAirport,
        arrival: segmentMeta[index]?.arrivalAirport
      };
      return acc;
    }, {})
  };

  function downloadSecureAsset(type: "bundle" | "boarding_passes" | "itinerary") {
    if (!passenger || !entitlement.lastSessionId) {
      setPaymentMessage("A verified checkout session is required before downloading. Complete payment again if this booking was unlocked on another device.");
      return;
    }

    if (type === "bundle") {
      downloadElements([
        ...getItineraryPages(),
        ...passes.map((item) => ({ element: passRefs.current[item.segmentIndex], kind: "fit" as const }))
      ], `FlightAI-${passenger.bookingRef}-ticket-pack.pdf`);
      return;
    }

    if (type === "boarding_passes") {
      downloadElements(
        passes.map((item) => ({ element: passRefs.current[item.segmentIndex], kind: "fit" as const })),
        `FlightAI-${passenger.bookingRef}-boarding-passes.pdf`
      );
      return;
    }

    downloadElements(getItineraryPages(), `FlightAI-${passenger.bookingRef}-itinerary.pdf`);
  }

  return (
    <>
      <TopNav
        onHome={() => router.push("/")}
        onReset={() => {
          clearSession();
          router.push("/");
        }}
      />

      <main className="pt-24">
        <section className="relative px-6 pb-10 pt-10 md:px-8">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_18%,rgba(218,226,253,0.46),transparent_30%),radial-gradient(circle_at_84%_14%,rgba(226,195,131,0.16),transparent_25%)]" />
          <div className="mx-auto max-w-7xl">
            <div className="rounded-[2rem] border border-white/70 bg-white/60 p-8 shadow-[0_30px_90px_rgba(15,23,42,0.08)] backdrop-blur-sm md:p-10">
              <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-3xl">
                  <p className="font-label text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                    FlightAI Ticket Desk
                  </p>
                  <h1 className="mt-4 font-headline text-4xl font-extrabold tracking-[-0.05em] text-slate-900 md:text-6xl">
                    Your boarding passes are ready.
                  </h1>
                  <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
                    Review every segment, download the final documents, and keep the same premium booking flow all the way through issuance.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[32rem]">
                  <InfoPanel
                    label="Booking Reference"
                    value={passenger.bookingRef}
                    tone="light"
                  />
                  <InfoPanel
                    label="Ticket Status"
                    value={canDownloadBundle ? "Fully unlocked" : canDownloadBoarding || canDownloadItinerary ? "Partially unlocked" : "Payment required"}
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
                  Passenger {fullName}
                </div>
                <div className="rounded-full border border-slate-200 bg-white/80 px-5 py-3">
                  {segments.length} active segment{segments.length > 1 ? "s" : ""}
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <ProgressPill active>1. Flight Selection</ProgressPill>
                <ProgressPill active>2. Passenger Details</ProgressPill>
                <ProgressPill active>3. Ticket Delivery</ProgressPill>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-24 md:px-8">
          <div className="grid gap-8 xl:grid-cols-[340px,minmax(0,1fr)]">
            <aside className="space-y-6 xl:sticky xl:top-28 xl:h-fit">
              <div className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)] backdrop-blur-sm md:p-8">
                <p className="font-label text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Ticket Summary
                </p>
                <h2 className="mt-3 font-headline text-3xl font-bold tracking-[-0.04em] text-slate-900">
                  Issued for {fullName}
                </h2>

                <div className="mt-6 rounded-[1.6rem] bg-[#131b2e] p-5 text-white">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/60">Total fare</p>
                      <p className="mt-3 font-headline text-4xl font-bold tracking-[-0.05em]">{totalFare}</p>
                      <p className="mt-2 text-sm leading-6 text-white/60">
                        Combined ticket estimate for selected segment{segments.length > 1 ? "s" : ""}
                      </p>
                    </div>
                    <CheckCircle2 className="h-6 w-6 text-[#e2c383]" strokeWidth={2.2} />
                  </div>
                </div>

                <div className="mt-6 grid gap-4 rounded-[1.6rem] border border-slate-200/80 bg-[#fbfcfe] p-5">
                  <MiniStat icon={UserRound} label="Passenger" value={fullName} />
                  <MiniStat icon={ShieldCheck} label="Cabin" value={passenger.cabinClass ?? "Economy"} />
                  <MiniStat icon={TicketIcon} label="Booking Ref" value={passenger.bookingRef} />
                </div>
              </div>

              <div className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)] backdrop-blur-sm md:p-8">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-label text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                      Downloads
                    </p>
                    <h3 className="mt-2 font-headline text-2xl font-bold tracking-[-0.04em] text-slate-900">
                      Unlock exports
                    </h3>
                  </div>
                  <Download className="h-5 w-5 text-slate-400" strokeWidth={2} />
                </div>

                <div className="mt-5 rounded-[1.4rem] border border-slate-200 bg-[#f7f9fc] p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Access status
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {canDownloadBundle
                      ? "All documents are unlocked. Downloads below will export the clean versions."
                      : "Previews stay watermarked until Stripe confirms payment. QR codes and downloads unlock only for paid items."}
                  </p>
                  {paymentMessage && (
                    <div className={`mt-3 rounded-2xl px-4 py-3 text-sm ${
                      verificationState === "error"
                        ? "bg-rose-50 text-rose-600"
                        : verificationState === "success"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-white text-slate-600"
                    }`}>
                      {verificationState === "verifying" && (
                        <span className="mr-2 inline-flex align-middle">
                          <LoaderCircle className="h-4 w-4 animate-spin" strokeWidth={2.2} />
                        </span>
                      )}
                      {paymentMessage}
                    </div>
                  )}
                </div>

                <div className="mt-6 rounded-[1.6rem] border border-slate-200 bg-[#fbfcfe] p-4">
                  <div className="flex items-end justify-between gap-4 border-b border-slate-200 pb-4">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                        Pricing
                      </p>
                      <h4 className="mt-2 font-headline text-xl font-bold tracking-[-0.04em] text-slate-900">
                        Choose your access
                      </h4>
                    </div>
                    <p className="text-xs font-medium text-slate-500">One-time payment</p>
                  </div>

                  <div className="mt-4 space-y-3">
                    {purchaseOptions.map((option) => {
                    const unlocked =
                      option.type === "bundle_both"
                        ? canDownloadBundle
                        : option.type === "boarding_passes_only"
                          ? canDownloadBoarding
                          : canDownloadItinerary;

                    return (
                      <button
                        key={option.type}
                        onClick={() => startCheckout(option.type)}
                        disabled={unlocked || checkoutLoading !== null || verificationState === "verifying"}
                        className={`w-full rounded-[1.4rem] border px-4 py-4 text-left transition ${
                          option.type === "bundle_both"
                            ? "border-slate-950 bg-slate-950 text-white shadow-[0_18px_35px_rgba(15,23,42,0.18)]"
                            : "border-slate-200 bg-white text-slate-800 hover:border-slate-300"
                        } disabled:cursor-not-allowed disabled:opacity-60`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-3">
                              <span className={`text-2xl font-black tracking-[-0.05em] ${option.type === "bundle_both" ? "text-white" : "text-slate-950"}`}>
                                {option.priceLabel}
                              </span>
                              <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${
                                unlocked
                                  ? option.type === "bundle_both"
                                    ? "bg-white/12 text-white/70"
                                    : "bg-emerald-50 text-emerald-700"
                                  : option.type === "bundle_both"
                                    ? "bg-white/12 text-white/70"
                                    : "bg-slate-100 text-slate-500"
                              }`}>
                                {unlocked ? "Unlocked" : option.type === "bundle_both" ? "Most popular" : "Single access"}
                              </span>
                            </div>
                            <p className="mt-3 text-sm font-semibold uppercase tracking-[0.16em]">{option.title}</p>
                            <p className={`mt-2 text-sm leading-6 ${option.type === "bundle_both" ? "text-white/70" : "text-slate-500"}`}>
                              {unlocked ? "Already available for this booking reference." : option.description}
                            </p>
                          </div>
                          {checkoutLoading === option.type ? (
                            <LoaderCircle className={`mt-1 h-5 w-5 animate-spin ${option.type === "bundle_both" ? "text-white" : "text-slate-500"}`} strokeWidth={2.2} />
                          ) : unlocked ? (
                            <CheckCircle2 className={`mt-1 h-5 w-5 ${option.type === "bundle_both" ? "text-[#e2c383]" : "text-emerald-600"}`} strokeWidth={2.2} />
                          ) : (
                            <CreditCard className={`mt-1 h-5 w-5 ${option.type === "bundle_both" ? "text-white" : "text-slate-500"}`} strokeWidth={2.2} />
                          )}
                        </div>
                      </button>
                    );
                    })}
                  </div>
                </div>

                <div className="mt-6 space-y-3 border-t border-slate-100 pt-6">
                  <button
                    onClick={() => downloadSecureAsset("bundle")}
                    disabled={!canDownloadBundle}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-black px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    {canDownloadBundle ? "Download boarding passes + itinerary" : "Unlock both to download pack"}
                  </button>
                  <button
                    onClick={() => downloadSecureAsset("boarding_passes")}
                    disabled={!canDownloadBoarding}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    {canDownloadBoarding ? "Download boarding passes" : "Unlock boarding passes first"}
                  </button>
                  <button
                    onClick={() => downloadSecureAsset("itinerary")}
                    disabled={!canDownloadItinerary}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    {canDownloadItinerary ? "Download itinerary only" : "Unlock itinerary first"}
                  </button>
                </div>

                <div className="mt-6 space-y-3">
                  {segments.map((segment, index) => (
                    <FlightMiniCard
                      key={segment.flightNumber + index}
                      label={index === 0 ? "Departure" : "Return"}
                      route={`${segment.departureIata} to ${segment.arrivalIata}`}
                      time={`${formatDate(segment.departureTime)} at ${formatTime(segment.departureTime)}`}
                      airline={`${segmentMeta[index]?.airlineName ?? segment.carrierCode} - ${segment.carrierCode} ${segment.flightNumber}`}
                    />
                  ))}
                </div>
              </div>
            </aside>

            <section id="ticket-board" className="space-y-6">
              <div className="rounded-[2rem] border border-white/70 bg-white/50 p-3 shadow-[0_24px_60px_rgba(15,23,42,0.04)] backdrop-blur-sm md:p-4">
                <div className="space-y-6">
                  {passes.map((item) => (
                    <div key={item.segmentIndex} ref={(el) => { passRefs.current[item.segmentIndex] = el; }}>
                      <BoardingPassCard
                        label={item.label}
                        segment={segments[item.segmentIndex]}
                        passenger={passenger}
                        bookingRef={passenger.bookingRef}
                        seat={item.seat}
                        boardingTime={item.boardingTime}
                        qrUrl={item.qrUrl}
                        airlineName={segmentMeta[item.segmentIndex]?.airlineName}
                        airportNames={{
                          departure: formatAirportLabel(
                            segments[item.segmentIndex].departureIata,
                            segmentMeta[item.segmentIndex]?.departureAirport
                          ),
                          arrival: formatAirportLabel(
                            segments[item.segmentIndex].arrivalIata,
                            segmentMeta[item.segmentIndex]?.arrivalAirport
                          )
                        }}
                        logoUrl={logoMap[segments[item.segmentIndex].carrierCode]}
                        locked={!canDownloadBoarding}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[2rem] border border-white/70 bg-white/50 p-3 shadow-[0_24px_60px_rgba(15,23,42,0.04)] backdrop-blur-sm md:p-4">
                <div className="mb-4 px-2">
                  <p className="font-label text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Itinerary Preview
                  </p>
                </div>
                <div className="overflow-x-auto rounded-[1.8rem] bg-white/80 p-2">
                  <div ref={itineraryRef} className="min-w-[794px]">
                    <ItineraryDocument
                      bookingRef={passenger.bookingRef}
                      passenger={passenger}
                      segments={segments}
                      issueDate={issueDate}
                      airlineNames={airlineNamesByIndex}
                      passes={passes.map((item) => ({
                        label: item.label,
                        seat: item.seat,
                        boardingTime: item.boardingTime
                      }))}
                      totalFare={totalFare}
                      airportNames={segments.reduce<Record<number, { departure?: SegmentMeta["departureAirport"]; arrival?: SegmentMeta["arrivalAirport"] }>>((acc, _segment, index) => {
                        acc[index] = {
                          departure: segmentMeta[index]?.departureAirport,
                          arrival: segmentMeta[index]?.arrivalAirport
                        };
                        return acc;
                      }, {})}
                      locked={!canDownloadItinerary}
                    />
                  </div>
                </div>
              </div>
            </section>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}

function TopNav({
  onHome,
  onReset
}: {
  onHome: () => void;
  onReset: () => void;
}) {
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
          <a className="font-headline text-sm font-medium tracking-tight text-slate-500 transition hover:text-slate-800" href="/passenger">
            Passenger
          </a>
          <a className="border-b-2 border-slate-950 pb-1 font-headline text-sm font-semibold tracking-tight text-slate-950" href="#ticket-board">
            Ticket
          </a>
        </div>
        <button
          onClick={onReset}
          className="rounded-full bg-black px-6 py-2.5 font-headline text-sm font-semibold text-white transition hover:opacity-90"
        >
          New Search
        </button>
      </div>
    </nav>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-slate-200/50 bg-[#f6fafe] px-6 py-12 md:px-8">
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
              key={link}
              className="font-label text-xs uppercase tracking-[0.14em] text-slate-500 underline underline-offset-4 transition-colors hover:text-slate-800"
              href="#"
            >
              {link}
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

function FlightMiniCard({
  label,
  route,
  time,
  airline
}: {
  label: string;
  route: string;
  time: string;
  airline: string;
}) {
  return (
    <div className="rounded-[1.4rem] border border-slate-200 bg-[#fbfcfe] p-4">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">{label}</p>
        <p className="text-sm font-semibold text-slate-900">{airline}</p>
      </div>
      <p className="mt-3 text-lg font-semibold text-slate-900">{route}</p>
      <p className="mt-1 text-sm text-slate-500">{time}</p>
    </div>
  );
}

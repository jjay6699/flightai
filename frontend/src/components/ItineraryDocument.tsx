"use client";

import { FlightSegment, PassengerDetails } from "@/lib/types";
import { formatDate, formatDuration, formatTime } from "@/lib/flight-utils";

type AirportNames = {
  departure?: { name?: string | null; city?: string | null; country?: string | null } | null;
  arrival?: { name?: string | null; city?: string | null; country?: string | null } | null;
};

type PassMeta = {
  label: string;
  seat: string;
  boardingTime: string;
};

function buildFullName(details: PassengerDetails) {
  return [details.firstName, details.middleName, details.lastName].filter(Boolean).join(" ").trim();
}

function formatAirport(code: string, airport?: { name?: string | null; city?: string | null } | null) {
  if (!airport) return code;
  return `${airport.city ?? airport.name ?? code}${airport.name && airport.city && airport.city !== airport.name ? `, ${airport.name}` : ""}`;
}

function buildTicketNumber(seed: string, index: number) {
  let value = 0;
  const base = `${seed}-${index}`;
  for (const char of base) {
    value = (value * 31 + char.charCodeAt(0)) >>> 0;
  }
  return `375${String(value).padStart(10, "0").slice(0, 10)}`;
}

export default function ItineraryDocument({
  bookingRef,
  passenger,
  segments,
  issueDate,
  airportNames,
  airlineNames,
  passes,
  totalFare,
  locked = false
}: {
  bookingRef: string;
  passenger: PassengerDetails;
  segments: FlightSegment[];
  issueDate: string;
  airportNames: Record<number, AirportNames>;
  airlineNames: Record<number, string | null | undefined>;
  passes: PassMeta[];
  totalFare: string;
  locked?: boolean;
}) {
  const fullName = buildFullName(passenger);
  const importantNotes = [
    "The airline booking reference can be used to check in, select seats, and purchase baggage allowance.",
    "All departure and arrival times are in local time.",
    "Tickets must be used in the sequence set out in the booking.",
    "Please arrive at the airport at least 3 hours before departure to ensure you have enough time to check in.",
    "Your ID must be valid for at least 6 months beyond the date you complete your booking.",
    "A transit visa may be required for transfers in a third country. Confirm visa details with the relevant embassy before travel."
  ];

  return (
    <div className="flex w-[794px] flex-col gap-6">
      <div data-itinerary-page className="relative h-[1123px] w-[794px] overflow-hidden bg-white px-8 py-8 text-slate-800 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
        <div className="flex items-start justify-between gap-6">
          <div>
            <img src="/itinerary-logo.svg" alt="Itinerary logo" className="h-12 w-auto object-contain" />
            <div className="mt-6 space-y-1.5 text-[15px] leading-6">
              <p>
                Booking No. <span className="font-semibold text-slate-900">{bookingRef}</span>
              </p>
              <p>
                Airline booking reference (PNR): <span className="font-semibold text-slate-900">{bookingRef}</span>
              </p>
              <p>
                Passenger: <span className="font-semibold text-slate-900">{fullName}</span>
              </p>
            </div>
          </div>

        <div className="text-right">
          <h2 className="font-headline text-[1.85rem] font-bold tracking-[-0.04em] text-slate-900">eTicket Itinerary</h2>
          <p className="mt-1 text-xs text-slate-500">Issued Date: {issueDate}</p>
          <div className="mt-5 rounded-2xl bg-slate-50 px-4 py-3 text-left">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Total fare</p>
            <p className="mt-1.5 text-lg font-bold text-slate-900">{totalFare}</p>
          </div>
        </div>
      </div>

        <section className="mt-6 overflow-hidden border border-slate-200">
          <div className="bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-900">Passenger Details</div>
          <div className="border-t border-slate-200 bg-white px-4 py-3">
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="text-sm font-semibold text-slate-900">{fullName}</p>
                <p className="mt-0.5 text-xs text-slate-500">Adult traveler</p>
              </div>
              <div className="space-y-1 text-right text-xs text-slate-600">
                {segments.map((_segment, index) => (
                  <div key={index}>
                    <span className="font-semibold text-slate-800">{passes[index]?.label ?? `Segment ${index + 1}`}</span>
                    {" "}
                    ticket number: {buildTicketNumber(bookingRef, index)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-4 overflow-hidden border border-slate-200">
          <div className="bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-900">Flight Details</div>
          <div className="bg-white px-4 py-3">
            {segments.map((segment, index) => (
              <div key={`${segment.carrierCode}-${segment.flightNumber}-${index}`} className={index > 0 ? "mt-3 border-t border-slate-200 pt-3" : ""}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      {passes[index]?.label ?? `Segment ${index + 1}`}
                    </p>
                    <h3 className="mt-1 text-[1.25rem] font-bold tracking-[-0.04em] text-slate-900">
                      {segment.departureIata} to {segment.arrivalIata}
                    </h3>
                    <p className="mt-1 text-[13px] font-semibold text-slate-800">
                      {airlineNames[index] ?? segment.carrierCode} {segment.carrierCode} {segment.flightNumber}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 px-3 py-2 text-right">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Ticket Number</p>
                    <p className="mt-1.5 text-xs font-semibold text-slate-900">{buildTicketNumber(bookingRef, index)}</p>
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-between gap-3 border-b border-slate-200 pb-2.5">
                  <div className="w-[42%]">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Departure</p>
                    <p className="mt-1.5 text-[1.45rem] font-bold tracking-[-0.04em] text-slate-900">{segment.departureIata}</p>
                    <p className="mt-1 text-[11px] leading-4 text-slate-600">{formatAirport(segment.departureIata, airportNames[index]?.departure)}</p>
                    <p className="mt-1 text-[11px] font-medium text-slate-700">{formatDate(segment.departureTime)}</p>
                    <p className="text-base font-semibold text-slate-900">{formatTime(segment.departureTime)}</p>
                  </div>

                  <div className="w-[16%] text-center">
                    <div className="text-xs font-semibold tracking-[0.18em] text-slate-500">AIR</div>
                    <p className="mt-1.5 text-[11px] font-semibold text-slate-700">{formatDuration(segment.duration)}</p>
                    <p className="mt-0.5 text-[11px] text-slate-500">{segment.stops === 0 ? "Direct" : `${segment.stops} stop`}</p>
                  </div>

                  <div className="w-[42%]">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Arrival</p>
                    <p className="mt-1.5 text-[1.45rem] font-bold tracking-[-0.04em] text-slate-900">{segment.arrivalIata}</p>
                    <p className="mt-1 text-[11px] leading-4 text-slate-600">{formatAirport(segment.arrivalIata, airportNames[index]?.arrival)}</p>
                    <p className="mt-1 text-[11px] font-medium text-slate-700">{formatDate(segment.arrivalTime)}</p>
                    <p className="text-base font-semibold text-slate-900">{formatTime(segment.arrivalTime)}</p>
                  </div>
                </div>

                <div className="mt-2.5 flex gap-3">
                  <InfoCell label="Cabin" value={passenger.cabinClass ?? "Economy"} />
                  <InfoCell label="Seat" value={passes[index]?.seat ?? "--"} />
                  <InfoCell label="Boarding" value={passes[index]?.boardingTime ?? "--"} />
                  <InfoCell label="Aircraft" value={segment.aircraft ?? "A320"} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-4 overflow-hidden border border-slate-200">
          <div className="bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-900">Booking Summary</div>
          <div className="flex gap-3 px-4 py-2.5">
            <InfoCell label="Segments" value={String(segments.length)} />
            <InfoCell label="Passenger Type" value="Adult" />
            <InfoCell label="Seat Preference" value={passenger.seatPreference || "No preference"} />
            <InfoCell label="Document" value={passenger.passportNumber || "Not provided"} />
          </div>
        </section>

        {locked && <WatermarkOverlay />}
      </div>

      <div data-itinerary-page className="relative h-[1123px] w-[794px] overflow-hidden bg-white px-8 py-8 text-slate-800 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
        <section>
          <h3 className="text-base font-semibold text-slate-900">Important Information</h3>
          <ul className="mt-2.5 space-y-1.5 text-[12px] leading-5 text-slate-600">
            {importantNotes.map((note) => (
              <li key={note} className="flex items-start gap-3">
                <span className="mt-[6px] h-1.5 w-1.5 rounded-full bg-slate-900" />
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </section>

        {locked && <WatermarkOverlay />}
      </div>
    </div>
  );
}

function WatermarkOverlay() {
  return (
    <>
      <div className="pointer-events-none absolute inset-0 bg-white/10 backdrop-blur-[1px]" />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
        <div className="rotate-[-18deg] text-center text-[58px] font-black uppercase tracking-[0.32em] text-slate-900/10">
          Unpaid Preview
        </div>
      </div>
    </>
  );
}

function InfoCell({
  label,
  value
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 flex-1">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-1.5 text-xs font-semibold text-slate-900">{value}</p>
    </div>
  );
}

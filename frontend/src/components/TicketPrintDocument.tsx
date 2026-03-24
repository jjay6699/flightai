"use client";

import BoardingPassCard from "@/components/BoardingPassCard";
import ItineraryDocument from "@/components/ItineraryDocument";
import { FlightSegment, PassengerDetails } from "@/lib/types";

type AirportNames = {
  departure?: { name?: string | null; city?: string | null; country?: string | null } | null;
  arrival?: { name?: string | null; city?: string | null; country?: string | null } | null;
};

type PassMeta = {
  label: string;
  seat: string;
  boardingTime: string;
  qrUrl?: string | null;
};

export default function TicketPrintDocument({
  bookingRef,
  passenger,
  segments,
  issueDate,
  airportNames,
  airlineNames,
  passes,
  totalFare,
  logoMap,
  type
}: {
  bookingRef: string;
  passenger: PassengerDetails;
  segments: FlightSegment[];
  issueDate: string;
  airportNames: Record<number, AirportNames>;
  airlineNames: Record<number, string | null | undefined>;
  passes: PassMeta[];
  totalFare: string;
  logoMap: Record<string, string>;
  type: "bundle" | "boarding_passes" | "itinerary";
}) {
  return (
    <div className="bg-white">
      {(type === "bundle" || type === "boarding_passes") && (
        <div>
          {segments.map((segment, index) => (
            <div
              key={`${segment.carrierCode}-${segment.flightNumber}-${index}`}
              data-print-page
              className="flex h-[794px] w-[1123px] items-center justify-center bg-white px-10 py-8"
            >
              <div className="w-full scale-[1.02]">
                <BoardingPassCard
                  label={passes[index]?.label ?? (index === 0 ? "Departure" : "Return")}
                  segment={segment}
                  passenger={passenger}
                  bookingRef={bookingRef}
                  seat={passes[index]?.seat ?? "--"}
                  boardingTime={passes[index]?.boardingTime ?? "--"}
                  qrUrl={passes[index]?.qrUrl}
                  airlineName={airlineNames[index]}
                  airportNames={{
                    departure: airportNames[index]?.departure
                      ? `${airportNames[index]?.departure?.city ?? airportNames[index]?.departure?.name ?? segment.departureIata}${airportNames[index]?.departure?.name && airportNames[index]?.departure?.city && airportNames[index]?.departure?.city !== airportNames[index]?.departure?.name ? `, ${airportNames[index]?.departure?.name}` : ""}`
                      : segment.departureIata,
                    arrival: airportNames[index]?.arrival
                      ? `${airportNames[index]?.arrival?.city ?? airportNames[index]?.arrival?.name ?? segment.arrivalIata}${airportNames[index]?.arrival?.name && airportNames[index]?.arrival?.city && airportNames[index]?.arrival?.city !== airportNames[index]?.arrival?.name ? `, ${airportNames[index]?.arrival?.name}` : ""}`
                      : segment.arrivalIata
                  }}
                  logoUrl={logoMap[segment.carrierCode]}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {(type === "bundle" || type === "itinerary") && (
        <div className="w-[794px]">
          <ItineraryDocument
            bookingRef={bookingRef}
            passenger={passenger}
            segments={segments}
            issueDate={issueDate}
            airportNames={airportNames}
            airlineNames={airlineNames}
            passes={passes.map((item) => ({
              label: item.label,
              seat: item.seat,
              boardingTime: item.boardingTime
            }))}
            totalFare={totalFare}
          />
        </div>
      )}
    </div>
  );
}

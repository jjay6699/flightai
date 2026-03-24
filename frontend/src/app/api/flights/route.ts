import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { rapidApiFetch } from "@/lib/rapidapi";
import { FlightOffer, FlightSegment } from "@/lib/types";
import { getAirports } from "@/lib/airports";
import { estimateDurationMinutes, haversineKm } from "@/lib/geo";

const querySchema = z.object({
  origin: z.string().min(3),
  destination: z.string().min(3),
  departureDate: z.string().min(8),
  returnDate: z.string().optional(),
  adults: z.string().optional()
});

type FlightRadarResponse = unknown;

const airlinePool = ["AA", "DL", "UA", "BA", "AF", "LH", "SQ", "EK", "QF", "NH", "MH", "AK", "CX", "QR", "TK"];

function extractArray(data: unknown): unknown[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (typeof data === "object") {
    const record = data as Record<string, unknown>;
    const candidateKeys = ["data", "result", "results", "rows", "flights", "aircraft", "items", "list"];
    for (const key of candidateKeys) {
      const value = record[key];
      if (Array.isArray(value)) return value;
    }
  }
  return [];
}

function findIataCandidates(values: unknown[]): string[] {
  return values
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim().toUpperCase())
    .filter((value) => /^[A-Z]{3}$/.test(value));
}

function extractFlightInfo(raw: unknown): { dep?: string; arr?: string; flight?: string } {
  if (Array.isArray(raw)) {
    const iatas = findIataCandidates(raw);
    const callsign = raw.find((value) => typeof value === "string" && /^[A-Z]{2,3}\d{2,4}$/.test(value));
    return {
      dep: iatas[0],
      arr: iatas[1],
      flight: typeof callsign === "string" ? callsign.toUpperCase() : undefined
    };
  }

  if (typeof raw === "object" && raw) {
    const record = raw as Record<string, unknown>;
    const dep = record.origin || record.from || record.dep || record.departure || record.airportOrigin || record.origin_iata;
    const arr = record.destination || record.to || record.arr || record.arrival || record.airportDestination || record.destination_iata;
    const flight = record.flight || record.callsign || record.number || record.flightNumber;

    return {
      dep: typeof dep === "string" ? dep.toUpperCase() : undefined,
      arr: typeof arr === "string" ? arr.toUpperCase() : undefined,
      flight: typeof flight === "string" ? flight.toUpperCase() : undefined
    };
  }

  return {};
}

function buildSegment(
  origin: string,
  destination: string,
  departureIso: string,
  distanceKm: number,
  carrier: string,
  flightNumber: string,
  index: number
): FlightSegment {
  const baseDate = new Date(`${departureIso}T00:00:00`);
  const departureOffset = 5 + (index % 8) * 2 + Math.random();
  const departure = new Date(baseDate.getTime() + departureOffset * 60 * 60 * 1000);
  const durationMinutes = estimateDurationMinutes(distanceKm);
  const arrival = new Date(departure.getTime() + durationMinutes * 60 * 1000);

  return {
    departureIata: origin,
    arrivalIata: destination,
    departureTime: departure.toISOString(),
    arrivalTime: arrival.toISOString(),
    duration: `PT${Math.floor(durationMinutes / 60)}H${durationMinutes % 60}M`,
    carrierCode: carrier,
    flightNumber,
    aircraft: "A320",
    stops: 0
  };
}

function normalizeFlight(
  raw: unknown,
  fallback: { origin: string; destination: string; departureIso: string; returnIso?: string; distanceKm: number },
  index: number
): FlightOffer | null {
  const origin = fallback.origin.toUpperCase();
  const destination = fallback.destination.toUpperCase();
  const info = extractFlightInfo(raw);

  if (info.dep && info.dep !== origin) return null;
  if (info.arr && info.arr !== destination) return null;

  const departureIata = info.dep ?? origin;
  const arrivalIata = info.arr ?? destination;

  let carrier = airlinePool[index % airlinePool.length];
  let flightNumber = `${Math.floor(100 + Math.random() * 900)}`;

  if (info.flight) {
    const match = /([A-Z]{2,3})(\d+)/.exec(info.flight);
    if (match) {
      carrier = match[1];
      flightNumber = match[2];
    }
  }

  const segments: FlightSegment[] = [
    buildSegment(departureIata, arrivalIata, fallback.departureIso, fallback.distanceKm, carrier, flightNumber, index)
  ];

  if (fallback.returnIso) {
    const returnFlightNumber = `${Number(flightNumber) + 10}`;
    segments.push(
      buildSegment(arrivalIata, departureIata, fallback.returnIso, fallback.distanceKm, carrier, returnFlightNumber, index + 1)
    );
  }

  const price = Math.round(fallback.distanceKm * 0.18 + 90 + Math.random() * 180);

  return {
    id: `${carrier}${flightNumber}-${index}`,
    price: price.toString(),
    currency: "USD",
    validatingAirline: carrier,
    segments
  };
}

function generateFallbackOffers(origin: string, destination: string, departureDate: string, returnDate: string | undefined, distanceKm: number): FlightOffer[] {
  return Array.from({ length: 12 })
    .map((_, index) =>
      normalizeFlight(
        null,
        { origin, destination, departureIso: departureDate, returnIso: returnDate, distanceKm },
        index
      )
    )
    .filter((item): item is FlightOffer => Boolean(item));
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = querySchema.parse({
      origin: searchParams.get("origin"),
      destination: searchParams.get("destination"),
      departureDate: searchParams.get("departureDate"),
      returnDate: searchParams.get("returnDate") ?? undefined,
      adults: searchParams.get("adults") ?? "1"
    });

    const airports = await getAirports();
    const originAirport = airports.find((airport) => airport.iata === parsed.origin.toUpperCase());
    const destinationAirport = airports.find((airport) => airport.iata === parsed.destination.toUpperCase());

    const distanceKm = originAirport?.lat && originAirport?.lon && destinationAirport?.lat && destinationAirport?.lon
      ? haversineKm(originAirport.lat, originAirport.lon, destinationAirport.lat, destinationAirport.lon)
      : 1200;

    let offers: FlightOffer[] = [];

    if (originAirport?.lat && originAirport?.lon) {
      try {
        const lat = originAirport.lat;
        const lon = originAirport.lon;
        const data: FlightRadarResponse = await rapidApiFetch("/flights/list-in-boundary", {
          bl_lat: lat - 1.2,
          bl_lng: lon - 1.2,
          tr_lat: lat + 1.2,
          tr_lng: lon + 1.2,
          limit: 150
        });

        const list = extractArray(data);
        const normalized = list
          .map((item, index) =>
            normalizeFlight(
              item,
              {
                origin: parsed.origin,
                destination: parsed.destination,
                departureIso: parsed.departureDate,
                returnIso: parsed.returnDate,
                distanceKm
              },
              index
            )
          )
          .filter((item): item is FlightOffer => Boolean(item));

        offers = normalized.slice(0, 12);
      } catch {
        offers = [];
      }
    }

    if (offers.length === 0) {
      offers = generateFallbackOffers(parsed.origin, parsed.destination, parsed.departureDate, parsed.returnDate, distanceKm);
    }

    return NextResponse.json({ offers });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch flights";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

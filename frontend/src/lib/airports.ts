import { rapidApiFetch } from "@/lib/rapidapi";
import { AirportRecord, extractArray, normalizeAirport } from "@/lib/airport-data";
import { fallbackAirports } from "@/lib/airports-fallback";

let airportCache: AirportRecord[] | null = null;
let lastFetch = 0;
let inFlight: Promise<AirportRecord[]> | null = null;

async function fetchAirports(): Promise<AirportRecord[]> {
  const data = await rapidApiFetch<unknown>("/airports/list");
  const list = extractArray(data)
    .map((item) => (typeof item === "object" && item ? normalizeAirport(item as Record<string, unknown>) : null))
    .filter((item): item is AirportRecord => Boolean(item));

  return list.length > 0 ? list : fallbackAirports;
}

export async function getAirports(): Promise<AirportRecord[]> {
  const now = Date.now();
  if (airportCache && now - lastFetch < 1000 * 60 * 60 * 12) {
    return airportCache;
  }
  if (inFlight) return inFlight;

  inFlight = fetchAirports()
    .catch(() => fallbackAirports)
    .then((list) => {
      airportCache = list;
      lastFetch = Date.now();
      inFlight = null;
      return list;
    });

  return inFlight;
}

export async function searchAirports(keyword: string): Promise<AirportRecord[]> {
  const term = keyword.trim().toLowerCase();
  if (!term) return [];
  const airports = await getAirports();
  return airports
    .filter((airport) => {
      const haystack = `${airport.iata} ${airport.name} ${airport.city} ${airport.country}`.toLowerCase();
      return haystack.includes(term);
    })
    .slice(0, 6);
}

import { rapidApiFetch } from "@/lib/rapidapi";

export type AirlineRecord = {
  code: string;
  name: string;
};

const airlineNameFallback: Record<string, string> = {
  AA: "American Airlines",
  ABY: "Air Arabia Abu Dhabi",
  AF: "Air France",
  AK: "AirAsia",
  BA: "British Airways",
  CL: "Lufthansa CityLine",
  CX: "Cathay Pacific",
  DL: "Delta Air Lines",
  EK: "Emirates",
  ETD: "Etihad Airways",
  KAL: "Korean Air",
  LH: "Lufthansa",
  MH: "Malaysia Airlines",
  NH: "ANA",
  QF: "Qantas",
  QR: "Qatar Airways",
  SQ: "Singapore Airlines",
  TK: "Turkish Airlines",
  UA: "United Airlines"
};

let airlineCache: AirlineRecord[] | null = null;
let lastFetch = 0;
let inFlight: Promise<AirlineRecord[]> | null = null;

function normalizeAirline(raw: Record<string, unknown>): AirlineRecord | null {
  const code = typeof raw.code === "string"
    ? raw.code
    : typeof raw.iata === "string"
      ? raw.iata
      : typeof raw.iataCode === "string"
        ? raw.iataCode
        : typeof raw.icao === "string"
          ? raw.icao
          : typeof raw.icaoCode === "string"
            ? raw.icaoCode
            : "";

  const name = typeof raw.name === "string"
    ? raw.name
    : typeof raw.airline === "string"
      ? raw.airline
      : typeof raw.title === "string"
        ? raw.title
        : "";

  if (!code || !name) return null;
  return { code: code.toUpperCase(), name };
}

function extractArray(data: unknown): unknown[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (typeof data === "object") {
    const record = data as Record<string, unknown>;
    const keys = ["data", "result", "results", "rows", "airlines", "items", "list"];
    for (const key of keys) {
      const value = record[key];
      if (Array.isArray(value)) return value;
    }
  }
  return [];
}

async function fetchAirlines(): Promise<AirlineRecord[]> {
  const data = await rapidApiFetch<unknown>("/airlines/list");
  return extractArray(data)
    .map((item) => (typeof item === "object" && item ? normalizeAirline(item as Record<string, unknown>) : null))
    .filter((item): item is AirlineRecord => Boolean(item));
}

export async function getAirlines(): Promise<AirlineRecord[]> {
  const now = Date.now();
  if (airlineCache && now - lastFetch < 1000 * 60 * 60 * 12) {
    return airlineCache;
  }
  if (inFlight) return inFlight;

  inFlight = fetchAirlines()
    .catch(() => [])
    .then((list) => {
      airlineCache = list;
      lastFetch = Date.now();
      inFlight = null;
      return list;
    });

  return inFlight;
}

export async function findAirlineName(code: string) {
  const lookup = code.toUpperCase();
  if (airlineNameFallback[lookup]) return airlineNameFallback[lookup];

  const list = await getAirlines();
  const entry = list.find((item) => item.code === lookup);
  return entry?.name ?? null;
}

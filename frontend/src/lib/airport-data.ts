export type AirportRecord = {
  iata: string;
  name: string;
  city: string;
  country: string;
  lat?: number;
  lon?: number;
};

function pickString(value: unknown): string {
  if (typeof value === "string") return value.trim();
  return "";
}

function pickNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const num = Number(value);
    if (Number.isFinite(num)) return num;
  }
  return undefined;
}

export function normalizeAirport(raw: Record<string, unknown>): AirportRecord | null {
  const iata = pickString(raw.iata || raw.iataCode || raw.codeIata || raw.iata_code || raw.code);
  if (!iata) return null;

  const name = pickString(raw.name || raw.airport_name || raw.title) || iata;
  const city = pickString(raw.city || raw.cityName || raw.city_name || raw.city_code || raw.locationCity || raw.location);
  const country = pickString(raw.country || raw.countryName || raw.country_name || raw.countryCode);
  const lat = pickNumber(raw.lat || raw.latitude);
  const lon = pickNumber(raw.lon || raw.lng || raw.longitude || raw.long);

  return {
    iata: iata.toUpperCase(),
    name,
    city,
    country,
    lat,
    lon
  };
}

export function extractArray(data: unknown): unknown[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (typeof data === "object") {
    const record = data as Record<string, unknown>;
    const candidateKeys = ["data", "result", "results", "rows", "airports", "items", "list"];
    for (const key of candidateKeys) {
      const value = record[key];
      if (Array.isArray(value)) return value;
    }
  }
  return [];
}

import { rapidApiFetch } from "@/lib/rapidapi";

let logosCache: Record<string, string> | null = null;
let lastFetch = 0;
let inFlight: Promise<Record<string, string>> | null = null;

function extractLogoMap(data: unknown): Record<string, string> {
  if (!data) return {};
  if (typeof data === "object") {
    const record = data as Record<string, unknown>;
    const candidate = record.data || record.result || record.results || record.rows || record.logos || record.items || record.list;
    if (candidate && typeof candidate === "object") {
      return Object.entries(candidate as Record<string, unknown>).reduce<Record<string, string>>((acc, [key, value]) => {
        if (typeof value === "string") {
          acc[key.toUpperCase()] = value;
        }
        return acc;
      }, {});
    }
  }
  return {};
}

async function fetchLogos(): Promise<Record<string, string>> {
  const data = await rapidApiFetch<unknown>("/airlines/get-logos");
  return extractLogoMap(data);
}

export async function getAirlineLogos() {
  const now = Date.now();
  if (logosCache && now - lastFetch < 1000 * 60 * 60 * 12) {
    return logosCache;
  }
  if (inFlight) return inFlight;

  inFlight = fetchLogos()
    .catch(() => ({}))
    .then((map) => {
      logosCache = map;
      lastFetch = Date.now();
      inFlight = null;
      return map;
    });

  return inFlight;
}

const baseUrl = process.env.RAPIDAPI_BASE_URL ?? "https://flight-radar1.p.rapidapi.com";
const host = process.env.RAPIDAPI_HOST ?? "flight-radar1.p.rapidapi.com";

export async function rapidApiFetch<T>(path: string, params?: Record<string, string | number | undefined>) {
  const key = process.env.RAPIDAPI_KEY;
  if (!key) {
    throw new Error("Missing RAPIDAPI_KEY");
  }

  const url = new URL(`${baseUrl}${path}`);
  if (params) {
    Object.entries(params).forEach(([paramKey, value]) => {
      if (value === undefined || value === null || value === "") return;
      url.searchParams.set(paramKey, String(value));
    });
  }

  const response = await fetch(url.toString(), {
    headers: {
      "Content-Type": "application/json",
      "x-rapidapi-host": host,
      "x-rapidapi-key": key
    },
    cache: "no-store"
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`RapidAPI request failed: ${response.status} ${text}`);
  }

  return response.json() as Promise<T>;
}

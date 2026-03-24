import { z } from "zod";

const tokenSchema = z.object({
  access_token: z.string(),
  expires_in: z.number().int().positive()
});

let cachedToken: { token: string; expiresAt: number } | null = null;

const baseUrl = process.env.AMADEUS_BASE_URL ?? "https://test.api.amadeus.com";

export async function getAmadeusToken() {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 10_000) {
    return cachedToken.token;
  }

  const key = process.env.AMADEUS_API_KEY;
  const secret = process.env.AMADEUS_API_SECRET;
  if (!key || !secret) {
    throw new Error("Missing AMADEUS_API_KEY or AMADEUS_API_SECRET");
  }

  const response = await fetch(`${baseUrl}/v1/security/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: key,
      client_secret: secret
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Amadeus auth failed: ${response.status} ${text}`);
  }

  const data = tokenSchema.parse(await response.json());
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000
  };
  return cachedToken.token;
}

export async function amadeusFetch<T>(path: string, params?: Record<string, string>) {
  const token = await getAmadeusToken();
  const url = new URL(`${baseUrl}${path}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        url.searchParams.set(key, value);
      }
    });
  }

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`
    },
    cache: "no-store"
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Amadeus request failed: ${response.status} ${text}`);
  }

  return response.json() as Promise<T>;
}


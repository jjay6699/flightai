import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAirports } from "@/lib/airports";

const schema = z.object({
  code: z.string().min(3)
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = schema.parse({ code: searchParams.get("code") });
    const airports = await getAirports();
    const match = airports.find((airport) => airport.iata === parsed.code.toUpperCase());
    return NextResponse.json({
      name: match?.name ?? null,
      city: match?.city ?? null,
      country: match?.country ?? null
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch airport";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

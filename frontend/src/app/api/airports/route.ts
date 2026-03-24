import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { searchAirports } from "@/lib/airports";
import { AirportOption } from "@/lib/types";

const querySchema = z.object({
  keyword: z.string().min(2)
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = querySchema.parse({
      keyword: searchParams.get("keyword")
    });

    const results = await searchAirports(parsed.keyword);

    const options: AirportOption[] = results.map((item) => ({
      iataCode: item.iata,
      name: item.name,
      city: item.city,
      country: item.country
    }));

    return NextResponse.json({ options });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch airports";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

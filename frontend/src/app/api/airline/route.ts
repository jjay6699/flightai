import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { findAirlineName } from "@/lib/airlines";
import { getAirlineLogos } from "@/lib/airline-logos";

const schema = z.object({
  code: z.string().min(2)
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = schema.parse({ code: searchParams.get("code") });
    const name = await findAirlineName(parsed.code);
    const logos: Record<string, string> = await getAirlineLogos().catch(() => ({}));
    const logo = logos[parsed.code.toUpperCase()] ?? null;
    return NextResponse.json({ name, logo });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch airline";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

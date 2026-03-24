import { NextResponse } from "next/server";
import { generateBookingRef } from "@/lib/flight-utils";

export async function GET() {
  return NextResponse.json({ bookingRef: generateBookingRef() });
}


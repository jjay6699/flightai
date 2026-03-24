import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createTicketPdf } from "@/lib/pdf";
import { generateBoardingTime, generateGate, generateSeat } from "@/lib/flight-utils";

const schema = z.object({
  passenger: z.object({
    firstName: z.string().min(1),
    middleName: z.string().optional(),
    lastName: z.string().min(1),
    passportNumber: z.string().optional(),
    seatPreference: z.string().optional()
  }),
  flight: z.object({
    id: z.string(),
    price: z.string().nullable(),
    currency: z.string().nullable(),
    validatingAirline: z.string(),
    segments: z.array(
      z.object({
        departureIata: z.string(),
        arrivalIata: z.string(),
        departureTime: z.string(),
        arrivalTime: z.string(),
        duration: z.string(),
        carrierCode: z.string(),
        flightNumber: z.string(),
        aircraft: z.string().optional(),
        stops: z.number()
      })
    )
  }),
  bookingRef: z.string().min(5),
  gate: z.string().optional(),
  seat: z.string().optional(),
  segmentIndex: z.number().optional()
});

export async function POST(request: NextRequest) {
  try {
    const payload = schema.parse(await request.json());
    const segmentIndex = payload.segmentIndex ?? 0;
    const segment = payload.flight.segments[segmentIndex] ?? payload.flight.segments[0];

    const gate = payload.gate ?? generateGate();
    const seat = payload.seat ?? generateSeat(payload.passenger.seatPreference);
    const boardingTime = generateBoardingTime(segment.departureTime);

    const pdfBytes = await createTicketPdf(
      {
        passenger: payload.passenger,
        flight: payload.flight,
        bookingRef: payload.bookingRef,
        gate,
        seat,
        boardingTime
      },
      segmentIndex
    );

    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=BoardingPass-${payload.bookingRef}-${segmentIndex + 1}.pdf`
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate ticket";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

import { NextRequest, NextResponse } from "next/server";

const backendBaseUrl = process.env.BACKEND_URL ?? "http://localhost:3001";

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const search = request.nextUrl.searchParams.toString();
    const query = search ? `?${search}` : "";
    const response = await fetch(`${backendBaseUrl}/api/ticket-data/${params.sessionId}${query}`, {
      cache: "no-store"
    });
    const payload = await response.json();
    return NextResponse.json(payload, { status: response.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load ticket data";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextRequest } from "next/server";

const backendBaseUrl = process.env.BACKEND_URL ?? "http://localhost:3001";

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const search = request.nextUrl.searchParams.toString();
  const query = search ? `?${search}` : "";
  const response = await fetch(`${backendBaseUrl}/api/download/${params.sessionId}${query}`, {
    cache: "no-store"
  });

  if (!response.ok) {
    const text = await response.text();
    return new Response(text || JSON.stringify({ error: "Download failed" }), {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("content-type") ?? "application/json"
      }
    });
  }

  const arrayBuffer = await response.arrayBuffer();
  return new Response(arrayBuffer, {
    status: 200,
    headers: {
      "Content-Type": response.headers.get("content-type") ?? "application/pdf",
      "Content-Disposition": response.headers.get("content-disposition") ?? "attachment; filename=\"download.pdf\"",
      "Content-Length": String(arrayBuffer.byteLength),
      "Cache-Control": "no-store"
    }
  });
}

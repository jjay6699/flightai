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

  return new Response(response.body, {
    status: response.status,
    headers: {
      "Content-Type": response.headers.get("content-type") ?? "application/pdf",
      "Content-Disposition": response.headers.get("content-disposition") ?? "attachment"
    }
  });
}

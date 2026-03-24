import { NextRequest, NextResponse } from "next/server";
import { getAirlineLogos } from "@/lib/airline-logos";

function svgFallback(code: string) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
  <rect width="120" height="120" rx="24" fill="#F1F5F9" />
  <text x="60" y="68" font-size="32" font-family="Arial, sans-serif" text-anchor="middle" fill="#475569" font-weight="700">${code}</text>
</svg>`;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = (searchParams.get("code") || "").toUpperCase();
  if (!code || code.length < 2) {
    return new NextResponse("Missing code", { status: 400 });
  }

  const kiwiUrl = `https://images.kiwi.com/airlines/128/${code}.png`;
  const airhexUrl = `https://content.airhex.com/content/logos/airlines_${code}_200_200_s.png`;

  try {
    const response = await fetch(kiwiUrl, { cache: "no-store" });
    if (response.ok) {
      const arrayBuffer = await response.arrayBuffer();
      return new NextResponse(arrayBuffer, {
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "public, max-age=86400"
        }
      });
    }
  } catch {
    // fall through to other sources
  }

  try {
    const response = await fetch(airhexUrl, { cache: "no-store" });
    if (response.ok) {
      const arrayBuffer = await response.arrayBuffer();
      return new NextResponse(arrayBuffer, {
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "public, max-age=86400"
        }
      });
    }
  } catch {
    // fall through to secondary sources
  }

  try {
    const logos = await getAirlineLogos();
    const logoUrl = logos[code];
    if (logoUrl) {
      const response = await fetch(logoUrl, { cache: "no-store" });
      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        return new NextResponse(arrayBuffer, {
          headers: {
            "Content-Type": "image/png",
            "Cache-Control": "public, max-age=86400"
          }
        });
      }
    }
  } catch {
    // fall through to svg fallback
  }

  const svg = svgFallback(code);
  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=86400"
    }
  });
}

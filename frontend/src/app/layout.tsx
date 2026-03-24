import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://flight-ai.online"),
  title: {
    default: "FlightAI | Visa-Ready Boarding Passes and Travel Itineraries",
    template: "%s | FlightAI"
  },
  description:
    "Generate visa-ready boarding passes, onward travel proof, and polished itinerary PDFs with FlightAI. Fast digital delivery for travelers, visa applications, and onward ticket documentation.",
  keywords: [
    "visa ready boarding pass",
    "onward ticket",
    "travel itinerary pdf",
    "boarding pass generator",
    "visa travel proof",
    "flight itinerary generator",
    "dummy ticket",
    "onward travel proof",
    "embassy travel itinerary",
    "FlightAI"
  ],
  alternates: {
    canonical: "/"
  },
  openGraph: {
    title: "FlightAI | Visa-Ready Boarding Passes and Travel Itineraries",
    description:
      "Generate visa-ready boarding passes, onward travel proof, and itinerary PDFs with fast digital delivery.",
    url: "https://flight-ai.online",
    siteName: "FlightAI",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/flight-logo.png",
        width: 910,
        height: 244,
        alt: "FlightAI"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "FlightAI | Visa-Ready Boarding Passes and Travel Itineraries",
    description:
      "Generate visa-ready boarding passes, onward travel proof, and itinerary PDFs with fast digital delivery.",
    images: ["/flight-logo.png"]
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1
    }
  },
  icons: {
    icon: "/fligh-fav.png",
    shortcut: "/fligh-fav.png",
    apple: "/fligh-fav.png"
  },
  category: "travel"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}


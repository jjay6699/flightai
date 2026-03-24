import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FlightAI | Premium Flight Search",
  description: "AI powered flight search and ticket generator."
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


import InfoPageShell from "@/components/InfoPageShell";

export default function InternationalVisasPage() {
  return (
    <InfoPageShell
      eyebrow="International Visas"
      title="Travel documents should never replace real visa checks."
      intro="Visa rules change frequently and can depend on nationality, destination, transit points, passport validity, return requirements, and airline policy. Use this page as a reminder to verify the real rules before travel."
      sections={[
        {
          heading: "Verify official sources",
          body: [
            "Always confirm visa, transit, entry, and onward-travel requirements through official embassy, consulate, government immigration, or airline sources before relying on any itinerary.",
            "Requirements can change without notice and may differ for one-way travel, return journeys, multi-city trips, or connecting routes through third countries."
          ]
        },
        {
          heading: "Passport validity and onward proof",
          body: [
            "Many countries require passports to remain valid for at least six months beyond the planned date of departure or arrival. Some destinations also require proof of return travel, onward travel, accommodation, or financial means.",
            "Customers should verify whether printed itineraries or airline-issued tickets are required for their specific visa, transit, or immigration process."
          ]
        },
        {
          heading: "Transit and stopover checks",
          body: [
            "Even if your final destination does not require a visa, a transit airport or stopover country may still impose separate entry or transit conditions.",
            "Always review each segment in your route individually, especially where airport transfers, overnight stopovers, or separate validating carriers are involved."
          ]
        },
        {
          heading: "No legal advice",
          body: [
            "FlightAI does not provide immigration or legal advice. This information is general guidance only and should not be treated as a guarantee of admissibility or compliance.",
            "If your travel case is complex, seek guidance from the appropriate consular authority or a qualified immigration professional."
          ]
        }
      ]}
    />
  );
}

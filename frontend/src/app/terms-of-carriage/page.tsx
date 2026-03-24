import InfoPageShell from "@/components/InfoPageShell";

export default function TermsOfCarriagePage() {
  return (
    <InfoPageShell
      eyebrow="Terms of Carriage"
      title="Important conditions for document use."
      intro="These terms explain how generated boarding passes and itineraries should be understood, what they are intended for, and the limits of FlightAI’s responsibility."
      sections={[
        {
          heading: "Service scope",
          body: [
            "FlightAI provides generated travel document outputs based on user-supplied itinerary and passenger information. These outputs are intended for the use case selected by the customer and are not a substitute for airline-issued transportation contracts unless explicitly stated otherwise.",
            "Customers are responsible for reviewing all generated details before use, including names, dates, routes, cabin selections, and booking references."
          ]
        },
        {
          heading: "User responsibility",
          body: [
            "You are responsible for ensuring that any generated document is used lawfully and in accordance with local immigration, airline, or travel regulations.",
            "FlightAI does not guarantee acceptance by airlines, immigration authorities, embassies, or third parties, and customers should independently verify all requirements relevant to their journey."
          ]
        },
        {
          heading: "Payment and access",
          body: [
            "Paid access unlocks the selected digital document type for the relevant booking reference. Access may be limited to the purchased combination, such as boarding passes only, itinerary only, or both.",
            "Refund handling, if any, is subject to payment processor rules, fraud checks, and the condition of the generated service at the time of purchase."
          ]
        },
        {
          heading: "Liability limits",
          body: [
            "FlightAI is not liable for missed travel, denied boarding, visa refusals, immigration outcomes, or third-party losses arising from user input, regulatory requirements, or misuse of generated documents.",
            "To the fullest extent permitted by law, liability is limited to the amount paid for the affected order."
          ]
        }
      ]}
    />
  );
}

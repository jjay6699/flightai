import InfoPageShell from "@/components/InfoPageShell";

export default function PrivacyPolicyPage() {
  return (
    <InfoPageShell
      eyebrow="Privacy Policy"
      title="How FlightAI handles your booking data."
      intro="This page explains what information is collected across search, passenger details, ticket generation, and payment verification, and how that data is used to operate the service."
      sections={[
        {
          heading: "Information we collect",
          body: [
            "FlightAI collects the information you enter to search flights, prepare passenger details, generate ticket previews, and complete checkout. This may include route selections, traveler names, seat preferences, cabin preferences, and optional passport details.",
            "We also collect technical information required to run the site safely, including browser data, IP address, device information, and usage logs that help us monitor reliability and abuse."
          ]
        },
        {
          heading: "How we use information",
          body: [
            "Your data is used to generate realistic flight documents, present previews, verify completed purchases, and maintain booking access for the selected booking reference.",
            "Payment details are processed by Stripe. FlightAI does not store full card numbers or card security codes on its own systems."
          ]
        },
        {
          heading: "Retention and storage",
          body: [
            "Passenger and booking information may be stored temporarily in browser storage and in backend systems required to complete your current booking flow. Operational logs and payment metadata may be retained for fraud prevention, support, and dispute handling.",
            "We aim to keep retained information limited to what is reasonably necessary to operate the service and respond to legal, accounting, or security obligations."
          ]
        },
        {
          heading: "Third-party services",
          body: [
            "FlightAI uses external providers for payment processing, airline or airport metadata, and flight information sources. Those providers may process limited request data needed to complete those services.",
            "Where third-party tools are used, their own privacy terms and data handling practices may also apply."
          ]
        }
      ]}
    />
  );
}

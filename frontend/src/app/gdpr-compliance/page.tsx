import InfoPageShell from "@/components/InfoPageShell";

export default function GdprCompliancePage() {
  return (
    <InfoPageShell
      eyebrow="GDPR Compliance"
      title="Data rights for users in the EEA and UK."
      intro="If you are located in the European Economic Area or the United Kingdom, this page summarizes the rights commonly associated with GDPR-style data protection rules and how FlightAI approaches those obligations."
      sections={[
        {
          heading: "Legal basis",
          body: [
            "FlightAI processes data where reasonably necessary to perform the requested service, maintain security, comply with legal obligations, and manage customer support or payment verification.",
            "Where consent is required for specific features or communications, that consent may be requested separately."
          ]
        },
        {
          heading: "Your rights",
          body: [
            "Depending on your jurisdiction and the circumstances of processing, you may have rights to request access, correction, deletion, restriction, portability, or objection regarding your personal data.",
            "You may also have the right to lodge a complaint with a supervisory authority if you believe your data has been handled unlawfully."
          ]
        },
        {
          heading: "International transfers",
          body: [
            "Some FlightAI service providers may process data outside your home jurisdiction. Where that occurs, transfers should be supported by appropriate contractual or legal safeguards where required.",
            "Operational use of third-party providers may still involve limited cross-border processing of route, booking, or payment-related metadata."
          ]
        },
        {
          heading: "Requests and response handling",
          body: [
            "To exercise data protection rights, users should contact the service operator with enough information to identify the relevant booking, transaction, or session.",
            "FlightAI may request reasonable proof of identity before completing sensitive data-access or deletion requests."
          ]
        }
      ]}
    />
  );
}

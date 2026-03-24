const allCabinClasses = ["Economy", "Premium Economy", "Business", "First"] as const;
const budgetCabinClasses = ["Economy"] as const;

const budgetAirlines = new Set([
  "AK", // AirAsia
  "D7", // AirAsia X
  "FD", // Thai AirAsia
  "QZ", // Indonesia AirAsia
  "TR", // Scoot
  "U2", // easyJet
  "FR", // Ryanair
  "W6", // Wizz Air
  "FZ", // flydubai
  "G9", // Air Arabia
  "VJ", // VietJet Air
  "5J", // Cebu Pacific
  "JQ", // Jetstar
  "Z2", // Philippines AirAsia
  "OD" // Batik Air Malaysia (ex-Malindo, mixed product but no first)
]);

export type CabinClassOption = (typeof allCabinClasses)[number];

export function getCabinOptionsForCarrier(code: string): CabinClassOption[] {
  return budgetAirlines.has(code.toUpperCase()) ? [...budgetCabinClasses] : [...allCabinClasses];
}

export function getCabinOptionsForTrip(carrierCodes: string[]): CabinClassOption[] {
  if (!carrierCodes.length) return [...allCabinClasses];
  return carrierCodes
    .map((code) => getCabinOptionsForCarrier(code))
    .reduce<CabinClassOption[]>((acc, options) => acc.filter((item) => options.includes(item)), [...allCabinClasses]);
}

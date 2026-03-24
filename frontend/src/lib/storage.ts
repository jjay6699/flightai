import { FlightOffer, PassengerDetails } from "./types";

const departureKey = "flightai:selectedDeparture";
const returnKey = "flightai:selectedReturn";
const passengerKey = "flightai:passenger";
const entitlementKey = "flightai:entitlements";

export type BookingEntitlement = {
  boardingPasses: boolean;
  itinerary: boolean;
  lastSessionId?: string;
  updatedAt: string;
};

export function saveSelectedDeparture(flight: FlightOffer) {
  if (typeof window === "undefined") return;
  localStorage.setItem(departureKey, JSON.stringify(flight));
}

export function saveSelectedReturn(flight: FlightOffer) {
  if (typeof window === "undefined") return;
  localStorage.setItem(returnKey, JSON.stringify(flight));
}

export function clearSelectedReturn() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(returnKey);
}

export function loadSelectedDeparture(): FlightOffer | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(departureKey);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as FlightOffer;
  } catch {
    return null;
  }
}

export function loadSelectedReturn(): FlightOffer | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(returnKey);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as FlightOffer;
  } catch {
    return null;
  }
}

export function savePassenger(details: PassengerDetails & { bookingRef: string }) {
  if (typeof window === "undefined") return;
  localStorage.setItem(passengerKey, JSON.stringify(details));
}

export function loadPassenger(): (PassengerDetails & { bookingRef: string }) | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(passengerKey);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PassengerDetails & { bookingRef: string };
  } catch {
    return null;
  }
}

export function clearSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(departureKey);
  localStorage.removeItem(returnKey);
  localStorage.removeItem(passengerKey);
}

function loadEntitlementMap() {
  if (typeof window === "undefined") return {} as Record<string, BookingEntitlement>;
  const raw = localStorage.getItem(entitlementKey);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, BookingEntitlement>;
  } catch {
    return {};
  }
}

export function loadBookingEntitlement(bookingRef: string): BookingEntitlement | null {
  if (!bookingRef) return null;
  const all = loadEntitlementMap();
  return all[bookingRef] ?? null;
}

export function saveBookingEntitlement(bookingRef: string, entitlement: Partial<BookingEntitlement>) {
  if (typeof window === "undefined" || !bookingRef) return;
  const all = loadEntitlementMap();
  const current = all[bookingRef] ?? {
    boardingPasses: false,
    itinerary: false,
    updatedAt: new Date().toISOString()
  };
  all[bookingRef] = {
    ...current,
    ...entitlement,
    boardingPasses: Boolean(current.boardingPasses || entitlement.boardingPasses),
    itinerary: Boolean(current.itinerary || entitlement.itinerary),
    updatedAt: new Date().toISOString()
  };
  localStorage.setItem(entitlementKey, JSON.stringify(all));
}

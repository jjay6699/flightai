import { FlightOffer, PassengerDetails } from "./types";

const departureKey = "flightai:selectedDeparture";
const returnKey = "flightai:selectedReturn";
const passengerKey = "flightai:passenger";

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

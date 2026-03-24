export function formatDuration(duration: string) {
  const match = /PT(?:(\d+)H)?(?:(\d+)M)?/.exec(duration);
  if (!match) return duration;
  const hours = match[1] ? `${match[1]}h` : "";
  const minutes = match[2] ? `${match[2]}m` : "";
  return `${hours} ${minutes}`.trim();
}

export function formatTime(iso: string) {
  const date = new Date(iso);
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

export function formatDate(iso: string) {
  const date = new Date(iso);
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric"
  }).format(date);
}

export function computeStops(segments: { departureIata: string; arrivalIata: string }[]) {
  return Math.max(0, segments.length - 1);
}

export function generateGate() {
  const letters = ["A", "B", "C", "D", "E"];
  return `${letters[Math.floor(Math.random() * letters.length)]}${Math.floor(Math.random() * 30 + 1)}`;
}

export function generateSeat(preference?: string) {
  const rows = Math.floor(Math.random() * 30 + 5);
  const seats = ["A", "B", "C", "D", "E", "F"];
  if (preference === "Window") return `${rows}${Math.random() > 0.5 ? "A" : "F"}`;
  if (preference === "Aisle") return `${rows}${Math.random() > 0.5 ? "C" : "D"}`;
  return `${rows}${seats[Math.floor(Math.random() * seats.length)]}`;
}

export function generateBoardingTime(departureIso: string) {
  const departure = new Date(departureIso);
  const boarding = new Date(departure.getTime() - 45 * 60 * 1000);
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(boarding);
}

export function generateBookingRef() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let ref = "";
  for (let i = 0; i < 6; i += 1) {
    ref += chars[Math.floor(Math.random() * chars.length)];
  }
  return ref;
}


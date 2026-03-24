export type TripType = "ONE_WAY" | "RETURN";

export type AirportOption = {
  iataCode: string;
  name: string;
  city: string;
  country: string;
};

export type FlightSegment = {
  departureIata: string;
  arrivalIata: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  carrierCode: string;
  flightNumber: string;
  aircraft?: string;
  stops: number;
};

export type FlightOffer = {
  id: string;
  price: string | null;
  currency: string | null;
  segments: FlightSegment[];
  validatingAirline: string;
};

export type PassengerDetails = {
  firstName: string;
  middleName?: string;
  lastName: string;
  passportNumber?: string;
  seatPreference?: string;
  cabinClass?: "Economy" | "Premium Economy" | "Business" | "First";
};

export type TicketDetails = {
  passenger: PassengerDetails;
  flight: FlightOffer;
  bookingRef: string;
  gate: string;
  seat: string;
  boardingTime: string;
};

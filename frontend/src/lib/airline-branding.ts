export type AirlineBrand = {
  primary: string;
  soft: string;
};

export const airlineBranding: Record<string, AirlineBrand> = {
  AA: { primary: "#003A70", soft: "#E6EEF7" },
  DL: { primary: "#C8102E", soft: "#F9E6EA" },
  UA: { primary: "#005DAA", soft: "#E6F0FA" },
  BA: { primary: "#075AAA", soft: "#E6F0FB" },
  AF: { primary: "#002157", soft: "#E5ECF8" },
  LH: { primary: "#05164D", soft: "#E5E9F5" },
  EK: { primary: "#D71920", soft: "#FBE7E9" },
  QF: { primary: "#E4002B", soft: "#FCE6EA" },
  NH: { primary: "#0B2E59", soft: "#E6EDF6" },
  SQ: { primary: "#002F6C", soft: "#E6EEF7" },
  TK: { primary: "#E30A17", soft: "#FCE5E7" },
  CX: { primary: "#00625F", soft: "#E5F3F2" },
  QR: { primary: "#5C0632", soft: "#F2E6ED" },
  MH: { primary: "#002B5C", soft: "#E6EEF7" },
  AK: { primary: "#E31937", soft: "#FCE6EB" }
};

export function getAirlineBrand(code: string): AirlineBrand {
  return airlineBranding[code.toUpperCase()] ?? { primary: "#E6463F", soft: "#FCEBEA" };
}

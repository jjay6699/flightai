import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import QRCode from "qrcode";
import { TicketDetails } from "./types";
import { formatDate, formatTime } from "./flight-utils";

function buildFullName(passenger: TicketDetails["passenger"]) {
  return [passenger.firstName, passenger.middleName, passenger.lastName].filter(Boolean).join(" ").trim();
}

function drawPerforation(page: any, x: number, y: number, height: number) {
  const dotGap = 10;
  const radius = 2;
  for (let offset = 0; offset < height; offset += dotGap) {
    page.drawCircle({ x, y: y + offset, size: radius, color: rgb(0.85, 0.87, 0.92) });
  }
}

function drawBarcode(page: any, x: number, y: number, width: number, height: number, seed: string) {
  const bars = seed.split("").map((char) => char.charCodeAt(0) % 5 + 1);
  const totalUnits = bars.reduce((sum, unit) => sum + unit, 0);
  const unitWidth = width / totalUnits;
  let currentX = x;
  bars.forEach((unit, index) => {
    const barWidth = unit * unitWidth;
    if (index % 2 === 0) {
      page.drawRectangle({ x: currentX, y, width: barWidth, height, color: rgb(0.08, 0.1, 0.15) });
    }
    currentX += barWidth;
  });
}

export async function createTicketPdf(details: TicketDetails, segmentIndex = 0) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([860, 320]);
  const { width, height } = page.getSize();

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const ink = rgb(0.07, 0.1, 0.18);
  const red = rgb(0.9, 0.28, 0.26);
  const light = rgb(0.97, 0.97, 0.98);
  const line = rgb(0.83, 0.85, 0.9);

  page.drawRectangle({ x: 18, y: 18, width: width - 36, height: height - 36, color: rgb(1, 1, 1), borderColor: line, borderWidth: 1 });

  const headerHeight = 48;
  page.drawRectangle({ x: 18, y: height - 18 - headerHeight, width: width - 36, height: headerHeight, color: red });
  page.drawText("BOARDING PASS", { x: 48, y: height - 18 - headerHeight + 16, size: 14, font: bold, color: rgb(1, 1, 1) });

  const segment = details.flight.segments[segmentIndex] ?? details.flight.segments[0];
  const dep = segment.departureIata;
  const arr = segment.arrivalIata;

  page.drawText(details.bookingRef, { x: width - 150, y: height - 18 - headerHeight + 16, size: 12, font: bold, color: rgb(1, 1, 1) });

  page.drawText(`${dep}  ->  ${arr}`, { x: 48, y: height - 110, size: 16, font: bold, color: ink });

  const infoX = 48;
  const infoY = height - 140;
  const rowGap = 30;

  const fields = [
    { label: "Passenger", value: buildFullName(details.passenger) },
    { label: "Flight", value: `${details.flight.validatingAirline} ${segment.flightNumber}` },
    { label: "Departure", value: `${formatDate(segment.departureTime)} · ${formatTime(segment.departureTime)}` },
    { label: "Arrival", value: `${formatDate(segment.arrivalTime)} · ${formatTime(segment.arrivalTime)}` },
    { label: "Gate", value: details.gate },
    { label: "Seat", value: details.seat },
    { label: "Boarding", value: details.boardingTime }
  ];

  fields.forEach((field, index) => {
    const y = infoY - index * rowGap;
    page.drawText(field.label.toUpperCase(), { x: infoX, y, size: 7.5, font: bold, color: rgb(0.45, 0.48, 0.55) });
    page.drawText(field.value, { x: infoX, y: y - 14, size: 11.5, font, color: ink });
  });

  const stubX = width - 250;
  page.drawLine({ start: { x: stubX, y: 36 }, end: { x: stubX, y: height - 66 }, thickness: 1, color: line });
  drawPerforation(page, stubX, 46, height - 120);

  page.drawRectangle({ x: stubX + 22, y: height - 210, width: 160, height: 160, color: light, borderColor: line, borderWidth: 1 });

  const qrPayload = `PASS|${details.bookingRef}|${dep}|${arr}|${segment.departureTime}`;
  const qrDataUrl = await QRCode.toDataURL(qrPayload);
  const qrImage = await pdfDoc.embedPng(qrDataUrl);
  page.drawImage(qrImage, { x: stubX + 38, y: height - 196, width: 128, height: 128 });

  page.drawText("Scan for boarding", { x: stubX + 40, y: height - 220, size: 8, font, color: rgb(0.45, 0.48, 0.55) });

  drawBarcode(page, stubX + 28, 48, 168, 34, `${details.bookingRef}${segment.flightNumber}`);

  return pdfDoc.save();
}

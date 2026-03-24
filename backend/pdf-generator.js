const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const QRCode = require('qrcode');

const A4_PORTRAIT = [595.28, 841.89];
const A4_LANDSCAPE = [841.89, 595.28];

function fullName(passenger) {
  return [passenger.firstName, passenger.middleName, passenger.lastName].filter(Boolean).join(' ').trim();
}

function drawLabel(page, font, text, x, y) {
  page.drawText(text.toUpperCase(), {
    x,
    y,
    size: 9,
    font,
    color: rgb(0.58, 0.65, 0.78)
  });
}

function drawWrapped(page, font, text, x, y, maxWidth, lineHeight, size, color) {
  const words = String(text || '').split(/\s+/).filter(Boolean);
  let line = '';
  let lineY = y;

  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) <= maxWidth) {
      line = next;
      continue;
    }
    if (line) {
      page.drawText(line, { x, y: lineY, size, font, color });
      lineY -= lineHeight;
    }
    line = word;
  }

  if (line) {
    page.drawText(line, { x, y: lineY, size, font, color });
    lineY -= lineHeight;
  }

  return lineY;
}

function formatAirport(code, airport) {
  if (!airport) return code;
  const primary = airport.city || airport.name || code;
  if (airport.name && airport.city && airport.city !== airport.name) {
    return `${primary}, ${airport.name}`;
  }
  return primary;
}

function buildTicketNumber(seed, index) {
  let value = 0;
  const base = `${seed}-${index}`;
  for (const char of base) {
    value = (value * 31 + char.charCodeAt(0)) >>> 0;
  }
  return `375${String(value).padStart(10, '0').slice(0, 10)}`;
}

async function embedQr(pdfDoc, payload) {
  const dataUrl = await QRCode.toDataURL(payload, { margin: 1, width: 320 });
  const base64 = dataUrl.split(',')[1];
  return pdfDoc.embedPng(Buffer.from(base64, 'base64'));
}

function drawItineraryPageOne(pdfDoc, fonts, ticketData, bookingRef) {
  const [width, height] = A4_PORTRAIT;
  const page = pdfDoc.addPage(A4_PORTRAIT);
  const { regular, bold } = fonts;
  const passengerName = fullName(ticketData.passenger);

  page.drawText('FlightAI', {
    x: 38,
    y: height - 56,
    size: 28,
    font: bold,
    color: rgb(0.19, 0.22, 0.29)
  });

  page.drawText('eTicket Itinerary', {
    x: width - 240,
    y: height - 56,
    size: 22,
    font: bold,
    color: rgb(0.08, 0.12, 0.2)
  });

  page.drawText(`Issued Date: ${ticketData.issueDate}`, {
    x: width - 205,
    y: height - 76,
    size: 11,
    font: regular,
    color: rgb(0.46, 0.51, 0.61)
  });

  let y = height - 125;
  const summaryLines = [
    `Booking No. ${bookingRef}`,
    `Airline booking reference (PNR): ${bookingRef}`,
    `Passenger: ${passengerName}`
  ];
  for (const line of summaryLines) {
    page.drawText(line, {
      x: 40,
      y,
      size: 12,
      font: regular,
      color: rgb(0.19, 0.22, 0.29)
    });
    y -= 18;
  }

  page.drawRectangle({
    x: width - 168,
    y: height - 170,
    width: 130,
    height: 64,
    color: rgb(0.96, 0.97, 0.99)
  });
  drawLabel(page, bold, 'Total Fare', width - 150, height - 125);
  page.drawText(ticketData.totalFare || 'N/A', {
    x: width - 150,
    y: height - 152,
    size: 18,
    font: bold,
    color: rgb(0.12, 0.15, 0.24)
  });

  y = height - 220;
  page.drawRectangle({
    x: 40,
    y: y - 38,
    width: width - 80,
    height: 36,
    color: rgb(0.94, 0.96, 0.99)
  });
  page.drawText('Passenger Details', {
    x: 52,
    y: y - 24,
    size: 12,
    font: bold,
    color: rgb(0.16, 0.2, 0.28)
  });

  page.drawRectangle({
    x: 40,
    y: y - 88,
    width: width - 80,
    height: 50,
    borderWidth: 1,
    borderColor: rgb(0.89, 0.91, 0.95)
  });
  page.drawText(passengerName, {
    x: 54,
    y: y - 63,
    size: 12,
    font: bold,
    color: rgb(0.16, 0.2, 0.28)
  });
  page.drawText('Adult traveler', {
    x: 54,
    y: y - 80,
    size: 11,
    font: regular,
    color: rgb(0.48, 0.54, 0.64)
  });

  let ticketY = y - 63;
  ticketData.segments.forEach((segment, index) => {
    page.drawText(`${ticketData.passes[index]?.label || `Segment ${index + 1}`} ticket number: ${buildTicketNumber(bookingRef, index)}`, {
      x: width - 275,
      y: ticketY,
      size: 10,
      font: regular,
      color: rgb(0.33, 0.39, 0.5)
    });
    ticketY -= 15;
  });

  y -= 108;
  page.drawRectangle({
    x: 40,
    y: y - 38,
    width: width - 80,
    height: 36,
    color: rgb(0.94, 0.96, 0.99)
  });
  page.drawText('Flight Details', {
    x: 52,
    y: y - 24,
    size: 12,
    font: bold,
    color: rgb(0.16, 0.2, 0.28)
  });

  let sectionTop = y - 48;
  ticketData.segments.forEach((segment, index) => {
    const top = sectionTop - index * 210;
    if (index > 0) {
      page.drawLine({
        start: { x: 54, y: top + 14 },
        end: { x: width - 54, y: top + 14 },
        thickness: 1,
        color: rgb(0.9, 0.92, 0.95)
      });
    }

    drawLabel(page, bold, ticketData.passes[index]?.label || `Segment ${index + 1}`, 54, top - 3);
    page.drawText(`${segment.departureIata} to ${segment.arrivalIata}`, {
      x: 54,
      y: top - 30,
      size: 18,
      font: bold,
      color: rgb(0.1, 0.14, 0.23)
    });
    page.drawText(`${ticketData.airlineNames[index] || segment.carrierCode} ${segment.carrierCode} ${segment.flightNumber}`, {
      x: 54,
      y: top - 50,
      size: 11,
      font: bold,
      color: rgb(0.2, 0.24, 0.33)
    });

    page.drawRectangle({
      x: width - 170,
      y: top - 35,
      width: 116,
      height: 48,
      color: rgb(0.97, 0.98, 1)
    });
    drawLabel(page, bold, 'Ticket Number', width - 153, top - 8);
    page.drawText(buildTicketNumber(bookingRef, index), {
      x: width - 153,
      y: top - 29,
      size: 10,
      font: bold,
      color: rgb(0.14, 0.18, 0.28)
    });

    const depAirport = ticketData.airportNames[index]?.departure;
    const arrAirport = ticketData.airportNames[index]?.arrival;
    const leftX = 54;
    const midX = 285;
    const rightX = 415;
    const rowY = top - 102;

    drawLabel(page, bold, 'Departure', leftX, rowY + 42);
    page.drawText(segment.departureIata, {
      x: leftX,
      y: rowY + 10,
      size: 22,
      font: bold,
      color: rgb(0.1, 0.14, 0.23)
    });
    drawWrapped(page, regular, formatAirport(segment.departureIata, depAirport), leftX, rowY - 10, 175, 14, 10, rgb(0.39, 0.45, 0.55));
    page.drawText(new Date(segment.departureTime).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }), {
      x: leftX,
      y: rowY - 40,
      size: 10,
      font: regular,
      color: rgb(0.35, 0.4, 0.5)
    });
    page.drawText(new Date(segment.departureTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }), {
      x: leftX,
      y: rowY - 60,
      size: 16,
      font: bold,
      color: rgb(0.1, 0.14, 0.23)
    });

    page.drawText('AIR', {
      x: midX,
      y: rowY + 16,
      size: 12,
      font: bold,
      color: rgb(0.54, 0.6, 0.72)
    });
    page.drawText(segment.duration, {
      x: midX - 8,
      y: rowY - 12,
      size: 10,
      font: bold,
      color: rgb(0.26, 0.31, 0.42)
    });
    page.drawText(segment.stops === 0 ? 'Direct' : `${segment.stops} stop`, {
      x: midX - 8,
      y: rowY - 30,
      size: 10,
      font: regular,
      color: rgb(0.4, 0.46, 0.56)
    });

    drawLabel(page, bold, 'Arrival', rightX, rowY + 42);
    page.drawText(segment.arrivalIata, {
      x: rightX,
      y: rowY + 10,
      size: 22,
      font: bold,
      color: rgb(0.1, 0.14, 0.23)
    });
    drawWrapped(page, regular, formatAirport(segment.arrivalIata, arrAirport), rightX, rowY - 10, 150, 14, 10, rgb(0.39, 0.45, 0.55));
    page.drawText(new Date(segment.arrivalTime).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }), {
      x: rightX,
      y: rowY - 40,
      size: 10,
      font: regular,
      color: rgb(0.35, 0.4, 0.5)
    });
    page.drawText(new Date(segment.arrivalTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }), {
      x: rightX,
      y: rowY - 60,
      size: 16,
      font: bold,
      color: rgb(0.1, 0.14, 0.23)
    });

    const infoY = top - 145;
    page.drawLine({
      start: { x: 54, y: infoY + 8 },
      end: { x: width - 54, y: infoY + 8 },
      thickness: 1,
      color: rgb(0.9, 0.92, 0.95)
    });
    const infoItems = [
      ['Cabin', ticketData.passenger.cabinClass || 'Economy'],
      ['Seat', ticketData.passes[index]?.seat || '--'],
      ['Boarding', ticketData.passes[index]?.boardingTime || '--'],
      ['Aircraft', segment.aircraft || 'A320']
    ];
    infoItems.forEach(([label, value], itemIndex) => {
      const x = 54 + itemIndex * 135;
      drawLabel(page, bold, label, x, infoY - 8);
      page.drawText(String(value), {
        x,
        y: infoY - 27,
        size: 10,
        font: bold,
        color: rgb(0.15, 0.19, 0.28)
      });
    });
  });

  const summaryTop = 140;
  page.drawRectangle({
    x: 40,
    y: summaryTop,
    width: width - 80,
    height: 36,
    color: rgb(0.94, 0.96, 0.99)
  });
  page.drawText('Booking Summary', {
    x: 52,
    y: summaryTop + 12,
    size: 12,
    font: bold,
    color: rgb(0.16, 0.2, 0.28)
  });
  page.drawRectangle({
    x: 40,
    y: 98,
    width: width - 80,
    height: 42,
    borderWidth: 1,
    borderColor: rgb(0.89, 0.91, 0.95)
  });
  [
    ['Segments', String(ticketData.segments.length)],
    ['Passenger Type', 'Adult'],
    ['Seat Preference', ticketData.passenger.seatPreference || 'No preference'],
    ['Document', ticketData.passenger.passportNumber || 'Not provided']
  ].forEach(([label, value], index) => {
    const x = 52 + index * 175;
    drawLabel(page, bold, label, x, 120);
    page.drawText(String(value), {
      x,
      y: 102,
      size: 10,
      font: bold,
      color: rgb(0.16, 0.2, 0.28)
    });
  });
}

function drawItineraryPageTwo(pdfDoc, fonts) {
  const [width, height] = A4_PORTRAIT;
  const page = pdfDoc.addPage(A4_PORTRAIT);
  const { regular, bold } = fonts;
  const importantNotes = [
    'The airline booking reference can be used to check in, select seats, and purchase baggage allowance.',
    'All departure and arrival times are in local time.',
    'Tickets must be used in the sequence set out in the booking.',
    'Please arrive at the airport at least 3 hours before departure to ensure you have enough time to check in.',
    'Your ID must be valid for at least 6 months beyond the date you complete your booking.',
    'A transit visa may be required for transfers in a third country. Confirm visa details with the relevant embassy before travel.'
  ];

  page.drawText('Important Information', {
    x: 40,
    y: height - 60,
    size: 18,
    font: bold,
    color: rgb(0.1, 0.14, 0.23)
  });

  let y = height - 100;
  importantNotes.forEach((note) => {
    page.drawCircle({
      x: 48,
      y: y + 8,
      size: 2.5,
      color: rgb(0.1, 0.14, 0.23)
    });
    y = drawWrapped(page, regular, note, 62, y, width - 110, 18, 12, rgb(0.33, 0.39, 0.5)) - 10;
  });
}

async function drawBoardingPassPage(pdfDoc, fonts, ticketData, bookingRef, segment, passMeta, index) {
  const [width, height] = A4_LANDSCAPE;
  const page = pdfDoc.addPage(A4_LANDSCAPE);
  const { regular, bold } = fonts;
  const passengerName = fullName(ticketData.passenger);
  const brandColor = index % 2 === 0 ? rgb(0.06, 0.43, 0.72) : rgb(0.08, 0.2, 0.47);

  page.drawRectangle({
    x: 30,
    y: 30,
    width: width - 60,
    height: height - 60,
    color: rgb(1, 1, 1),
    borderWidth: 1,
    borderColor: rgb(0.86, 0.89, 0.94)
  });
  page.drawRectangle({
    x: 30,
    y: height - 88,
    width: width - 60,
    height: 30,
    color: brandColor
  });
  page.drawText('BOARDING PASS', {
    x: 50,
    y: height - 78,
    size: 14,
    font: bold,
    color: rgb(1, 1, 1)
  });
  page.drawText(bookingRef, {
    x: width - 120,
    y: height - 78,
    size: 14,
    font: bold,
    color: rgb(1, 1, 1)
  });

  page.drawLine({
    start: { x: width - 255, y: 88 },
    end: { x: width - 255, y: height - 108 },
    thickness: 1,
    color: rgb(0.89, 0.91, 0.95)
  });

  drawLabel(page, bold, 'Airline', 108, height - 128);
  page.drawText(ticketData.airlineNames[index] || segment.carrierCode, {
    x: 108,
    y: height - 148,
    size: 14,
    font: bold,
    color: rgb(0.14, 0.18, 0.28)
  });
  drawLabel(page, bold, 'Flight', 250, height - 128);
  page.drawText(`${segment.carrierCode} ${segment.flightNumber}`, {
    x: 250,
    y: height - 148,
    size: 14,
    font: bold,
    color: rgb(0.14, 0.18, 0.28)
  });

  page.drawText(`${segment.departureIata} -> ${segment.arrivalIata}`, {
    x: 50,
    y: height - 210,
    size: 28,
    font: bold,
    color: rgb(0.08, 0.12, 0.2)
  });
  drawWrapped(page, regular, `Departure: ${formatAirport(segment.departureIata, ticketData.airportNames[index]?.departure)} (${segment.departureIata})`, 50, height - 235, 450, 15, 11, rgb(0.36, 0.42, 0.52));
  drawWrapped(page, regular, `Arrival: ${formatAirport(segment.arrivalIata, ticketData.airportNames[index]?.arrival)} (${segment.arrivalIata})`, 50, height - 255, 450, 15, 11, rgb(0.36, 0.42, 0.52));

  page.drawText(passengerName, {
    x: 50,
    y: height - 315,
    size: 18,
    font: bold,
    color: rgb(0.08, 0.12, 0.2)
  });
  drawLabel(page, bold, 'Passenger', 50, height - 292);

  const depTime = new Date(segment.departureTime);
  const arrTime = new Date(segment.arrivalTime);
  const cols = [
    ['Departure', depTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }), depTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })],
    ['Arrival', arrTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }), arrTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })],
    ['Cabin', ticketData.passenger.cabinClass || 'Economy', ''],
    ['Seat', passMeta.seat || '--', ''],
    ['Boarding', passMeta.boardingTime || '--', '']
  ];
  cols.forEach(([label, primary, secondary], idx) => {
    const x = 50 + idx * 115;
    drawLabel(page, bold, label, x, height - 352);
    page.drawText(primary, {
      x,
      y: height - 375,
      size: 14,
      font: bold,
      color: rgb(0.12, 0.16, 0.25)
    });
    if (secondary) {
      page.drawText(secondary, {
        x,
        y: height - 393,
        size: 10,
        font: regular,
        color: rgb(0.42, 0.48, 0.58)
      });
    }
  });

  const qr = await embedQr(pdfDoc, `PASS|${bookingRef}|${segment.departureIata}|${segment.arrivalIata}|${segment.departureTime}`);
  page.drawRectangle({
    x: width - 220,
    y: height - 310,
    width: 150,
    height: 150,
    borderWidth: 1,
    borderColor: rgb(0.89, 0.91, 0.95)
  });
  page.drawImage(qr, {
    x: width - 205,
    y: height - 295,
    width: 120,
    height: 120
  });
  page.drawText('SCAN FOR BOARDING', {
    x: width - 198,
    y: height - 325,
    size: 10,
    font: regular,
    color: rgb(0.58, 0.65, 0.78)
  });

  const sideInfo = [
    ['Passenger', passengerName],
    ['Route', `${segment.departureIata} -> ${segment.arrivalIata}`],
    ['Cabin', ticketData.passenger.cabinClass || 'Economy'],
    ['Seat', passMeta.seat || '--']
  ];
  sideInfo.forEach(([label, value], itemIndex) => {
    const colX = width - 220 + (itemIndex % 2) * 90;
    const rowY = height - 380 - Math.floor(itemIndex / 2) * 48;
    drawLabel(page, bold, label, colX, rowY);
    page.drawText(String(value), {
      x: colX,
      y: rowY - 18,
      size: 10,
      font: bold,
      color: rgb(0.12, 0.16, 0.25)
    });
  });

  page.drawRectangle({
    x: width - 220,
    y: 95,
    width: 170,
    height: 34,
    color: rgb(0.04, 0.06, 0.1)
  });
  page.drawText(`${segment.carrierCode} ${segment.flightNumber} · ${bookingRef}`, {
    x: width - 213,
    y: 107,
    size: 9,
    font: regular,
    color: rgb(1, 1, 1)
  });

  page.drawText(passMeta.label || (index === 0 ? 'Departure' : 'Return'), {
    x: 50,
    y: 46,
    size: 11,
    font: regular,
    color: rgb(0.58, 0.65, 0.78)
  });
  page.drawText('Boarding closes 15 minutes before departure', {
    x: width - 300,
    y: 46,
    size: 11,
    font: regular,
    color: rgb(0.58, 0.65, 0.78)
  });
}

async function generateTicketPdf({ type, bookingRef, ticketData }) {
  const pdfDoc = await PDFDocument.create();
  const fonts = {
    regular: await pdfDoc.embedFont(StandardFonts.Helvetica),
    bold: await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  };

  if (type === 'itinerary' || type === 'bundle') {
    drawItineraryPageOne(pdfDoc, fonts, ticketData, bookingRef);
    drawItineraryPageTwo(pdfDoc, fonts);
  }

  if (type === 'boarding_passes' || type === 'bundle') {
    for (let index = 0; index < ticketData.segments.length; index += 1) {
      await drawBoardingPassPage(
        pdfDoc,
        fonts,
        ticketData,
        bookingRef,
        ticketData.segments[index],
        ticketData.passes[index] || {},
        index
      );
    }
  }

  return Buffer.from(await pdfDoc.save());
}

module.exports = {
  generateTicketPdf
};

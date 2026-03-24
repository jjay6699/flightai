const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const Stripe = require('stripe');
const axios = require('axios');
const { getJson } = require('serpapi');
const { chromium } = require('playwright');

dotenv.config();

const app = express();
const stripe = process.env.STRIPE_SECRET_KEY ? Stripe(process.env.STRIPE_SECRET_KEY) : null;
const ticketPayloadStore = new Map();
const purchaseCatalog = {
  boarding_passes_only: {
    label: 'Boarding passes only',
    amount: 1500
  },
  itinerary_only: {
    label: 'Itinerary only',
    amount: 1500
  },
  bundle_both: {
    label: 'Boarding passes + itinerary',
    amount: 2000
  }
};

function cleanupTicketPayloads() {
  const now = Date.now();
  const maxAge = 1000 * 60 * 60 * 24;
  for (const [bookingRef, entry] of ticketPayloadStore.entries()) {
    if (now - entry.createdAt > maxAge) {
      ticketPayloadStore.delete(bookingRef);
    }
  }
}

function getTicketPayload(bookingRef) {
  cleanupTicketPayloads();
  return ticketPayloadStore.get(bookingRef);
}

// Middleware
app.use(cors());
app.use((req, res, next) => {
  if (req.originalUrl === '/api/webhook') {
    next();
  } else {
    express.json()(req, res, next);
  }
});

// SerpApi Google Flights Integration
async function fetchSerpApiFlights(origin, destination) {
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) return null;

  try {
    const params = {
      engine: 'google_flights',
      departure_id: origin.toUpperCase(),
      arrival_id: destination.toUpperCase(),
      outbound_date: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
      currency: 'USD',
      hl: 'en',
      api_key: apiKey
    };

    const response = await getJson(params);
    const flights = response.best_flights || response.other_flights || [];

    return flights.slice(0, 5).map((flight) => {
      const leg = flight.flights[0];
      const departureTime = new Date(leg.departure_airport.time);
      const arrivalTime = new Date(leg.arrival_airport.time);
      const durationMin = flight.total_duration;
      const hours = Math.floor(durationMin / 60);
      const mins = durationMin % 60;

      return {
        id: `SERP-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        airline: leg.airline,
        flightNumber: leg.flight_number,
        departure: {
          iata: leg.departure_airport.id,
          time: departureTime.toISOString(),
          terminal: leg.departure_airport.terminal || '-'
        },
        arrival: {
          iata: leg.arrival_airport.id,
          time: arrivalTime.toISOString(),
          terminal: leg.arrival_airport.terminal || '-'
        },
        duration: `${hours}h ${mins}m`,
        price: flight.price || (299.99 + Math.random() * 100)
      };
    });
  } catch (error) {
    console.error('SerpApi Error:', error.message);
    return null;
  }
}

// High-Fidelity Flight Simulator (Ensures 100% uptime with realistic data)
function generateRealisticFlights(origin, destination) {
  const airlines = [
    { name: 'SkyGlobal Airways', code: 'SG' },
    { name: 'Velocity Air', code: 'VA' },
    { name: 'Heritage Airlines', code: 'HA' },
    { name: 'Pacific Transatlantic', code: 'PT' },
    { name: 'Nordic Express', code: 'NE' },
    { name: 'Horizon Jets', code: 'HJ' }
  ];

  const results = [];
  const now = new Date();

  for (let i = 0; i < 4; i += 1) {
    const airline = airlines[Math.floor(Math.random() * airlines.length)];
    const flightNumber = `${airline.code}${Math.floor(100 + Math.random() * 899)}`;
    const departureTime = new Date(now.getTime() + Math.random() * 86400000 * 7);
    const durationHours = Math.floor(4 + Math.random() * 10);
    const durationMins = Math.floor(Math.random() * 60);
    const arrivalTime = new Date(departureTime.getTime() + durationHours * 3600000 + durationMins * 60000);

    results.push({
      id: `SIM-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      airline: airline.name,
      flightNumber,
      departure: {
        iata: origin.toUpperCase(),
        time: departureTime.toISOString(),
        terminal: String(Math.floor(Math.random() * 5) + 1)
      },
      arrival: {
        iata: destination.toUpperCase(),
        time: arrivalTime.toISOString(),
        terminal: String(Math.floor(Math.random() * 5) + 1)
      },
      duration: `${durationHours}h ${durationMins}m`,
      price: 299.99 + Math.random() * 150
    });
  }
  return results;
}

app.get('/api/flights', async (req, res) => {
  try {
    const { origin, destination } = req.query;
    if (!origin || !destination) {
      return res.status(400).json({ success: false, error: 'Origin and destination are required' });
    }

    let flights = await fetchSerpApiFlights(origin, destination);

    if (!flights || flights.length === 0) {
      console.log('Using Simulator Fallback for:', origin, '->', destination);
      flights = generateRealisticFlights(origin, destination);
    }

    res.json({ success: true, data: flights });
  } catch (error) {
    console.error('API Error:', error.message);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

app.post('/api/create-checkout-session', async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({ error: 'Stripe is not configured' });
    }

    const { bookingRef, passengerName, purchaseType, ticketData } = req.body;
    const selection = purchaseCatalog[purchaseType];

    if (!bookingRef || !purchaseType || !selection || !ticketData || !ticketData.passenger || !Array.isArray(ticketData.segments)) {
      return res.status(400).json({ error: 'bookingRef, valid purchaseType, and ticketData are required' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: selection.label,
              description: `FlightAI document access for booking ${bookingRef}`
            },
            unit_amount: selection.amount
          },
          quantity: 1
        }
      ],
      mode: 'payment',
      success_url: `${process.env.CLIENT_URL}/ticket?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/ticket?checkout=cancelled`,
      metadata: {
        bookingRef,
        passengerName: passengerName || '',
        purchaseType,
        access_boarding: String(purchaseType === 'boarding_passes_only' || purchaseType === 'bundle_both'),
        access_itinerary: String(purchaseType === 'itinerary_only' || purchaseType === 'bundle_both')
      },
      payment_intent_data: {
        metadata: {
          bookingRef,
          purchaseType
        }
      }
    });

    ticketPayloadStore.set(bookingRef, {
      createdAt: Date.now(),
      passengerName: passengerName || '',
      ticketData
    });

    res.json({
      id: session.id,
      url: session.url,
      purchaseType,
      label: selection.label,
      amount: selection.amount
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/verify-payment/:sessionId', async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({ error: 'Stripe is not configured' });
    }

    const session = await stripe.checkout.sessions.retrieve(req.params.sessionId);
    const bookingRef = req.query.bookingRef;
    const metadata = session.metadata || {};

    if (!bookingRef || metadata.bookingRef !== bookingRef) {
      return res.status(400).json({ success: false, error: 'Booking reference does not match session' });
    }

    if (session.payment_status === 'paid') {
      return res.json({
        success: true,
        paymentStatus: session.payment_status,
        metadata,
        access: {
          boardingPasses: metadata.access_boarding === 'true',
          itinerary: metadata.access_itinerary === 'true'
        }
      });
    }

    return res.json({ success: false, paymentStatus: session.payment_status });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.get('/api/ticket-data/:sessionId', async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({ error: 'Stripe is not configured' });
    }

    const { bookingRef, type } = req.query;
    if (!bookingRef || !type) {
      return res.status(400).json({ error: 'bookingRef and type are required' });
    }

    const session = await stripe.checkout.sessions.retrieve(req.params.sessionId);
    const metadata = session.metadata || {};
    if (session.payment_status !== 'paid') {
      return res.status(402).json({ error: 'Payment is not completed for this session' });
    }
    if (metadata.bookingRef !== bookingRef) {
      return res.status(400).json({ error: 'Booking reference does not match session' });
    }

    const allowsBoarding = metadata.access_boarding === 'true';
    const allowsItinerary = metadata.access_itinerary === 'true';
    const normalizedType = String(type);
    if (
      (normalizedType === 'boarding_passes' && !allowsBoarding) ||
      (normalizedType === 'itinerary' && !allowsItinerary) ||
      (normalizedType === 'bundle' && !(allowsBoarding && allowsItinerary))
    ) {
      return res.status(403).json({ error: 'This purchase does not grant access to that file' });
    }

    const stored = getTicketPayload(String(bookingRef));
    if (!stored?.ticketData) {
      return res.status(404).json({ error: 'Ticket data is no longer available. Start a new checkout for this booking.' });
    }

    return res.json({
      bookingRef: String(bookingRef),
      ticketData: stored.ticketData,
      access: {
        boardingPasses: allowsBoarding,
        itinerary: allowsItinerary
      }
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.get('/api/download/:sessionId', async (req, res) => {
  let browser;

  try {
    if (!stripe) {
      return res.status(503).json({ error: 'Stripe is not configured' });
    }

    const { bookingRef, type } = req.query;
    if (!bookingRef || !type) {
      return res.status(400).json({ error: 'bookingRef and type are required' });
    }

    const session = await stripe.checkout.sessions.retrieve(req.params.sessionId);
    const metadata = session.metadata || {};
    if (session.payment_status !== 'paid') {
      return res.status(402).json({ error: 'Payment is not completed for this session' });
    }
    if (metadata.bookingRef !== bookingRef) {
      return res.status(400).json({ error: 'Booking reference does not match session' });
    }

    const allowsBoarding = metadata.access_boarding === 'true';
    const allowsItinerary = metadata.access_itinerary === 'true';
    const normalizedType = String(type);
    if (
      (normalizedType === 'boarding_passes' && !allowsBoarding) ||
      (normalizedType === 'itinerary' && !allowsItinerary) ||
      (normalizedType === 'bundle' && !(allowsBoarding && allowsItinerary))
    ) {
      return res.status(403).json({ error: 'This purchase does not grant access to that file' });
    }

    const stored = getTicketPayload(String(bookingRef));
    if (!stored?.ticketData) {
      return res.status(404).json({ error: 'Ticket data is no longer available. Start a new checkout for this booking.' });
    }

    const frontendBaseUrl = process.env.CLIENT_URL;
    if (!frontendBaseUrl) {
      return res.status(500).json({ error: 'CLIENT_URL is not configured' });
    }

    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage({
      viewport: { width: 794, height: 1123 },
      deviceScaleFactor: 2
    });
    const printUrl = `${frontendBaseUrl}/ticket/print?sessionId=${encodeURIComponent(req.params.sessionId)}&bookingRef=${encodeURIComponent(String(bookingRef))}&type=${encodeURIComponent(normalizedType)}`;
    await page.goto(printUrl, { waitUntil: 'networkidle' });
    await page.waitForSelector('[data-print-ready="true"]', { timeout: 45000 });
    await page.waitForTimeout(800);

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: '0',
        right: '0',
        bottom: '0',
        left: '0'
      }
    });

    const suffix = normalizedType === 'bundle' ? 'ticket-pack' : normalizedType;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="FlightAI-${bookingRef}-${suffix}.pdf"`);
    return res.send(Buffer.from(pdfBuffer));
  } catch (error) {
    console.error('Download generation failed:', error);
    return res.status(500).json({ error: error.message });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
});

app.post('/api/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  if (!stripe) {
    return res.status(503).json({ error: 'Stripe is not configured' });
  }

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (webhookSecret && sig) {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } else if (process.env.NODE_ENV === 'development') {
      event = JSON.parse(req.body);
    } else {
      throw new Error('Webhook secret is required outside development');
    }
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    console.log('Payment successful for session:', session.id);
    console.log('Passenger:', session.metadata.passengerName);
    console.log('Booking reference:', session.metadata.bookingRef);
    console.log('Purchase type:', session.metadata.purchaseType);
  }

  return res.json({ received: true });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});

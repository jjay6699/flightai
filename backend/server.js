const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const Stripe = require('stripe');
const axios = require('axios');
const { getJson } = require('serpapi');

dotenv.config();

const app = express();
const stripe = process.env.STRIPE_SECRET_KEY ? Stripe(process.env.STRIPE_SECRET_KEY) : null;

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
      engine: "google_flights",
      departure_id: origin.toUpperCase(),
      arrival_id: destination.toUpperCase(),
      outbound_date: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0], // Default to 7 days out
      currency: "USD",
      hl: "en",
      api_key: apiKey
    };

    const response = await getJson(params);
    const flights = response.best_flights || response.other_flights || [];
    
    return flights.slice(0, 5).map(flight => {
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
  
  // Generate 3-5 realistic options
  for (let i = 0; i < 4; i++) {
    const airline = airlines[Math.floor(Math.random() * airlines.length)];
    const flightNumber = `${airline.code}${Math.floor(100 + Math.random() * 899)}`;
    const departureTime = new Date(now.getTime() + (Math.random() * 86400000 * 7)); // Within next 7 days
    
    // Simulate realistic flight duration (average 3-12 hours for international)
    const durationHours = Math.floor(4 + Math.random() * 10);
    const durationMins = Math.floor(Math.random() * 60);
    const arrivalTime = new Date(departureTime.getTime() + (durationHours * 3600000) + (durationMins * 60000));

    results.push({
      id: `SIM-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      airline: airline.name,
      flightNumber: flightNumber,
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
      price: 299.99 + (Math.random() * 150)
    });
  }
  return results;
}

// Optimized Flight API Endpoint
app.get('/api/flights', async (req, res) => {
  try {
    const { origin, destination } = req.query;
    if (!origin || !destination) {
      return res.status(400).json({ success: false, error: 'Origin and destination are required' });
    }

    // Try real data first via SerpApi
    let flights = await fetchSerpApiFlights(origin, destination);
    
    // Fallback to simulator if SerpApi fails, has no key, or returns no results
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

// Create Checkout Session
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({ error: 'Stripe is not configured' });
    }
    const { flightId, passengerName } = req.body;
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Dummy Flight Ticket - ${flightId}`,
              description: `Realistic dummy ticket for ${passengerName || 'Passenger'}`,
            },
            unit_amount: 500, // $5.00
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.CLIENT_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/`,
      metadata: {
        flightId,
        passengerName
      }
    });

    res.json({ id: session.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Stripe verify endpoint (simulating DB completion query)
app.get('/api/verify-payment/:sessionId', async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({ error: 'Stripe is not configured' });
    }
    const session = await stripe.checkout.sessions.retrieve(req.params.sessionId);
    if (session.payment_status === 'paid') {
      res.json({ success: true, metadata: session.metadata });
    } else {
      res.json({ success: false });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Stripe Webhook
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
    } else {
      // Fallback for dev if secret not provided
      event = JSON.parse(req.body);
    }
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    console.log('✅ Payment successful for session:', session.id);
    console.log('Passenger:', session.metadata.passengerName);
    console.log('Flight ID:', session.metadata.flightId);
    // In a real app, you'd save this to a database or trigger ticket generation here
  }

  res.json({ received: true });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});

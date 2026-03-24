import { useState } from 'react';
import SearchForm from '../components/SearchForm';
import TicketPreview from '../components/TicketPreview';
import { PlaneTakeoff, ShieldCheck, Download } from 'lucide-react';
import axios from 'axios';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_12345'); 

export default function Home() {
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [passengerName, setPassengerName] = useState('');
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const handleSearch = async (searchParams) => {
    setLoading(true);
    setPassengerName(searchParams.passengerName);
    try {
      const response = await axios.get('http://localhost:3001/api/flights', {
        params: searchParams
      });
      setFlights(response.data.data);
      setSelectedFlight(null);
    } catch (error) {
      console.error('Failed to fetch flights', error);
      alert('Error fetching flights. Please make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (!selectedFlight) return;
    setIsCheckingOut(true);
    try {
      const stripe = await stripePromise;
      const response = await axios.post('http://localhost:3001/api/create-checkout-session', {
        flightId: selectedFlight.id,
        passengerName: passengerName
      });
      
      const session = response.data;
      const result = await stripe.redirectToCheckout({
        sessionId: session.id
      });
      
      if (result.error) {
        alert(result.error.message);
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('An error occurred during checkout.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: '3rem', marginTop: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
          <div style={{ background: 'var(--surface-solid)', padding: '1rem', borderRadius: '50%', boxShadow: 'var(--shadow-lg)', display: 'inline-flex' }}>
            <PlaneTakeoff size={48} color="var(--primary)" />
          </div>
        </div>
        <h1 className="title-main">
          Aero<span className="text-gradient">Mock</span>
        </h1>
        <p className="subtitle-main">
          Experience the most advanced dummy ticket generator. Get hyper-realistic boarding passes for visa proof, onward travel, or just for fun.
        </p>
      </div>

      <div className="hero-grid">
        <div className="glass-panel" style={{ alignSelf: 'start' }}>
          <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: 'var(--primary)' }}>#1</span> Flight Details
          </h2>
          <SearchForm onSearch={handleSearch} isLoading={loading} />
          
          {flights.length > 0 && (
            <div className="flight-options" style={{ marginTop: '2rem' }}>
              <h3 style={{ marginBottom: '1rem' }}>Select a Flight</h3>
              {flights.map((flight) => (
                <div 
                  key={flight.id}
                  className={`flight-option-card ${selectedFlight?.id === flight.id ? 'selected' : ''}`}
                  onClick={() => setSelectedFlight(flight)}
                >
                  <div>
                    <div className="option-times">
                      {new Date(flight.departure.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - 
                      {new Date(flight.arrival.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                    <div className="option-airline">{flight.airline} ({flight.duration})</div>
                  </div>
                  <div className="option-price">Select</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass-panel" style={{ textAlign: 'center' }}>
            <h2 style={{ marginBottom: '1.5rem', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: 'var(--primary)' }}>#2</span> Ticket Preview
            </h2>
            
            {selectedFlight ? (
              <>
                <TicketPreview flight={selectedFlight} passengerName={passengerName} isWatermarked={true} />
                
                <div style={{ marginTop: '3rem', padding: '2rem', background: 'rgba(255,255,255,0.5)', borderRadius: 'var(--radius-md)' }}>
                  <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Get Your Unwatermarked Ticket</h3>
                  <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                    Remove the watermark and instantly download your high-quality ticket.
                  </p>
                  
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)', fontWeight: '500' }}>
                      <ShieldCheck size={20} color="#10b981" /> 100% Authentic Look
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)', fontWeight: '500' }}>
                      <Download size={20} color="var(--primary)" /> Instant Download
                    </div>
                  </div>

                  <button 
                    className="btn btn-primary" 
                    style={{ width: '100%', maxWidth: '300px', margin: '2rem auto 0', fontSize: '1.125rem', padding: '1rem' }}
                    onClick={handleCheckout}
                    disabled={isCheckingOut}
                  >
                    {isCheckingOut ? 'Processing...' : 'Pay $5.00 to Download'}
                  </button>
                  <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Secure payment powered by Stripe.</p>
                </div>
              </>
            ) : (
              <div style={{ padding: '4rem 0', color: 'var(--text-muted)' }}>
                {loading ? 'Searching for real flight routes...' : 'Enter your flight details and search to see the preview here.'}
              </div>
            )}
        </div>
      </div>
    </div>
  );
}

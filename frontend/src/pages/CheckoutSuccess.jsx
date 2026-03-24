import { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import TicketPreview from '../components/TicketPreview';
import { CheckCircle, Download, ArrowLeft } from 'lucide-react';
import html2canvas from 'html2canvas';

export default function CheckoutSuccess() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [status, setStatus] = useState('verifying');
  const [ticketData, setTicketData] = useState(null);
  const ticketRef = useRef(null);

  useEffect(() => {
    if (!sessionId) {
      setStatus('error');
      return;
    }

    const verify = async () => {
      try {
        const response = await axios.get(`http://localhost:3001/api/verify-payment/${sessionId}`);
        if (response.data.success) {
          const flightReq = await axios.get('http://localhost:3001/api/flights');
          const flight = flightReq.data.data.find(f => f.id === response.data.metadata.flightId) || flightReq.data.data[0];
          
          setTicketData({
            flight,
            passengerName: response.data.metadata.passengerName
          });
          setStatus('success');
        } else {
          setStatus('error');
        }
      } catch (err) {
        setStatus('error');
      }
    };

    verify();
  }, [sessionId]);

  const downloadTicket = async () => {
    if (!ticketRef.current) return;
    
    try {
      const canvas = await html2canvas(ticketRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
      });
      
      const link = document.createElement('a');
      link.download = `ticket-${ticketData.passengerName.replace(/\s+/g, '-')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Failed to download ticket', error);
      alert('Failed to generate ticket image. Please try again.');
    }
  };

  if (status === 'verifying') {
    return (
      <div className="glass-panel text-center" style={{ maxWidth: '600px', margin: '4rem auto' }}>
        <h2>Verifying Payment...</h2>
        <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Please wait while we confirm your transaction.</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="glass-panel text-center" style={{ maxWidth: '600px', margin: '4rem auto' }}>
        <h2 style={{ color: '#ef4444' }}>Payment Verification Failed</h2>
        <p style={{ marginTop: '1rem', marginBottom: '2rem' }}>We could not verify your payment session.</p>
        <Link to="/" className="btn btn-primary">
          <ArrowLeft size={20} /> Return Home
        </Link>
      </div>
    );
  }

  return (
    <div className="glass-panel" style={{ maxWidth: '1000px', margin: '2rem auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '1.5rem', borderRadius: '50%', display: 'inline-flex' }}>
            <CheckCircle size={64} color="#10b981" />
          </div>
        </div>
        <h1 className="title-main" style={{ fontSize: '3rem', marginBottom: '1rem' }}>Your Ticket is Ready!</h1>
        <p style={{ fontSize: '1.25rem', color: 'rgba(255, 255, 255, 0.6)', maxWidth: '600px', margin: '0 auto' }}>
          Payment verified. Your official AeroMock dummy ticket has been generated without watermarks.
        </p>
      </div>

      <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '3.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(255, 255, 255, 0.05)', boxShadow: 'inset 0 0 20px rgba(0,0,0,0.2)' }}>
        <div ref={ticketRef}>
          <TicketPreview 
            flight={ticketData.flight} 
            passengerName={ticketData.passengerName} 
            isWatermarked={false} 
          />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginTop: '3rem' }}>
        <button className="btn btn-success" onClick={downloadTicket} style={{ padding: '1rem 2rem', fontSize: '1.125rem' }}>
          <Download size={24} /> Download Ticket (PNG)
        </button>
        <Link to="/" className="btn btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.125rem' }}>
          <ArrowLeft size={24} /> Create Another
        </Link>
      </div>
    </div>
  );
}

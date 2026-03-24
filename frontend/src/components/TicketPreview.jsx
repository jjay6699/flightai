import { Plane } from 'lucide-react';

export default function TicketPreview({ flight, passengerName, isWatermarked = true }) {
  if (!flight) return null;

  const depTime = new Date(flight.departure.time);
  const arrTime = new Date(flight.arrival.time);

  return (
    <div className={`ticket-wrapper ${isWatermarked ? 'preview' : ''}`}>
      {isWatermarked && (
        <div className="watermark">
          <div className="watermark-text">DUMMY TICKET</div>
        </div>
      )}
      
      <div className="ticket" id="boarding-pass">
        <div className="ticket-left">
          <div className="ticket-header">
            <div className="airline-logo">
              <Plane size={24} />
              {flight.airline}
            </div>
            <div style={{ fontWeight: '700', color: 'var(--text-muted)' }}>
              BOARDING PASS
            </div>
          </div>

          <div className="flight-route">
            <div className="route-point">
              <div className="route-city">{flight.departure.iata}</div>
              <div className="route-desc">Depart</div>
            </div>
            <div className="route-plane">
              <hr />
              <Plane size={24} style={{ transform: 'rotate(90deg)' }} />
              <hr />
            </div>
            <div className="route-point">
              <div className="route-city">{flight.arrival.iata}</div>
              <div className="route-desc">Arrive</div>
            </div>
          </div>

          <div className="ticket-details">
            <div className="detail-block">
              <div className="detail-label">Passenger</div>
              <div className="detail-value" style={{ textTransform: 'uppercase' }}>
                {passengerName || 'JANE DOE'}
              </div>
            </div>
            <div className="detail-block">
              <div className="detail-label">Flight</div>
              <div className="detail-value">{flight.flightNumber}</div>
            </div>
            <div className="detail-block">
              <div className="detail-label">Date</div>
              <div className="detail-value">
                {depTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
            
            <div className="detail-block">
              <div className="detail-label">Departure</div>
              <div className="detail-value">
                {depTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            <div className="detail-block">
              <div className="detail-label">Terminal</div>
              <div className="detail-value">{flight.departure.terminal || '-'}</div>
            </div>
            <div className="detail-block">
              <div className="detail-label">Gate</div>
              <div className="detail-value">A{Math.floor(Math.random() * 30) + 1}</div>
            </div>
          </div>
        </div>

        <div className="ticket-right">
           <div className="detail-block" style={{ marginBottom: '1.5rem' }}>
              <div className="detail-label">Seat</div>
              <div className="detail-value" style={{ fontSize: '2.5rem', lineHeight: '1', color: 'var(--primary)' }}>
                {Math.floor(Math.random() * 30) + 10}{['A','B','C','D','E','F'][Math.floor(Math.random() * 6)]}
              </div>
            </div>
            
            <div className="detail-block" style={{ marginBottom: '1.5rem' }}>
              <div className="detail-label">Class</div>
              <div className="detail-value" style={{ letterSpacing: '0.1em' }}>ECONOMY</div>
            </div>

            <div className="barcode-container">
              <div className="barcode">
                ||| | || ||| || ||| | ||| ||| | || ||| || ||| | |||
              </div>
              <div className="barcode-number">
                {Math.random().toString().slice(2, 14)}
              </div>
            </div>
        </div>
      </div>
    </div>
  );
}

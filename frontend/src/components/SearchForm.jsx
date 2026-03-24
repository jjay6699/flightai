import { useState } from 'react';
import { Search } from 'lucide-react';

export default function SearchForm({ onSearch, isLoading }) {
  const [formData, setFormData] = useState({
    origin: 'JFK',
    destination: 'LHR',
    date: new Date().toISOString().split('T')[0],
    passengerName: 'Jane Doe'
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label className="form-label">Passenger Name</label>
        <input 
          type="text" 
          name="passengerName"
          className="form-input" 
          value={formData.passengerName}
          onChange={handleChange}
          required
          placeholder="e.g. John Smith"
        />
      </div>
      
      <div className="search-grid">
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">From (IATA)</label>
          <input 
            type="text" 
            name="origin"
            className="form-input" 
            value={formData.origin}
            onChange={handleChange}
            required
            maxLength={3}
            style={{ textTransform: 'uppercase' }}
            placeholder="JFK"
          />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">To (IATA)</label>
          <input 
            type="text" 
            name="destination"
            className="form-input" 
            value={formData.destination}
            onChange={handleChange}
            required
            maxLength={3}
            style={{ textTransform: 'uppercase' }}
            placeholder="LHR"
          />
        </div>
      </div>
      
      <div className="form-group">
        <label className="form-label">Departure Date</label>
        <input 
          type="date" 
          name="date"
          className="form-input" 
          value={formData.date}
          onChange={handleChange}
          required
        />
      </div>

      <button 
        type="submit" 
        className="btn btn-primary" 
        style={{ width: '100%', marginTop: '1rem' }}
        disabled={isLoading}
      >
        <Search size={20} />
        {isLoading ? 'Searching...' : 'Search Flights'}
      </button>
    </form>
  );
}

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import CheckoutSuccess from './pages/CheckoutSuccess';

function App() {
  return (
    <Router>
      <div className="app-container">
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/success" element={<CheckoutSuccess />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;

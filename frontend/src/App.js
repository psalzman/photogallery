import React from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard/AdminDashboard';
import PhotoGallery from './components/PhotoGallery';
import Footer from './components/Footer';

// Wrapper component that forces remount when location changes
function RouteWrapper({ Component }) {
  const location = useLocation();
  // Use location.key to force remount
  return <Component key={location.key} />;
}

function App() {
  return (
    <Router>
      <div style={{ minHeight: '100vh', paddingBottom: '60px', boxSizing: 'border-box' }}>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/gallery" element={<RouteWrapper Component={PhotoGallery} />} />
        </Routes>
      </div>
      <Footer />
    </Router>
  );
}

export default App;

import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard/AdminDashboard';
import PhotoGallery from './components/PhotoGallery';
import Footer from './components/Footer';

function App() {
  return (
    <Router>
      <div style={{ minHeight: '100vh', paddingBottom: '60px', boxSizing: 'border-box' }}>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/gallery" element={<PhotoGallery />} />
        </Routes>
      </div>
      <Footer />
    </Router>
  );
}

export default App;

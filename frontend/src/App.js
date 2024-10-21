import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard/AdminDashboard';
import PhotoGallery from './components/PhotoGallery';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/gallery" element={<PhotoGallery />} />
      </Routes>
    </Router>
  );
}

export default App;

import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import PhotoGallery from './components/PhotoGallery';

function PrivateRoute({ children, allowedRole }) {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');

  if (!token) {
    return <Navigate to="/" replace />;
  }

  if (allowedRole && userRole !== allowedRole) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function App() {
  return (
    <Router>
      <div style={styles.app}>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route
            path="/admin"
            element={
              <PrivateRoute allowedRole="admin">
                <AdminDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/gallery"
            element={
              <PrivateRoute>
                <PhotoGallery />
              </PrivateRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

const styles = {
  app: {
    fontFamily: "'Arial', sans-serif",
    minHeight: '100vh',
    margin: 0,
    padding: 0,
    backgroundColor: '#1a1a1a',
    color: '#ffffff',
  },
};

export default App;

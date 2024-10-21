import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import styles from './styles';
import ManageAccessCodes from './ManageAccessCodes';
import AssignAccessCode from './AssignAccessCode';
import UploadPhotos from './UploadPhotos';
import ExistingAccessCodes from './ExistingAccessCodes';
import ViewGallery from './ViewGallery';
import PrintSelections from './PrintSelections';

function AdminDashboard() {
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    navigate('/');
  }, [navigate]);

  return (
    <div style={styles.container}>
      <div style={styles.sidebar}>
        <h2 style={styles.sidebarTitle}>Admin Dashboard</h2>
        <button onClick={handleLogout} style={styles.logoutButton}>Logout</button>
      </div>
      <div style={styles.content}>
        {error && <p style={styles.error}>{error}</p>}
        {message && <p style={styles.message}>{message}</p>}
        
        <div style={styles.row}>
          <div style={styles.column}>
            <ManageAccessCodes setError={setError} setMessage={setMessage} />
          </div>
          <div style={styles.column}>
            <AssignAccessCode setError={setError} setMessage={setMessage} />
          </div>
        </div>

        <div style={styles.row}>
          <div style={styles.column}>
            <UploadPhotos setError={setError} setMessage={setMessage} />
          </div>
          <div style={styles.column}>
            <ExistingAccessCodes />
          </div>
        </div>

        <ViewGallery setError={setError} />
        <PrintSelections setError={setError} />
      </div>
    </div>
  );
}

export default AdminDashboard;

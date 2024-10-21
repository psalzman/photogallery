import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

function ConfirmationDialog({ isOpen, onClose, onConfirm, photoUrl }) {
  if (!isOpen) return null;

  return (
    <div style={styles.modal}>
      <div style={styles.modalContent}>
        <h2>Confirm Photo Selection</h2>
        <p>Are you sure this is the photo you want printed? Choosing this photo for printing is irreversible.</p>
        <img src={photoUrl} alt="Selected" style={styles.confirmationImage} />
        <div style={styles.buttonContainer}>
          <button onClick={onConfirm} style={styles.confirmButton}>Confirm</button>
          <button onClick={onClose} style={styles.cancelButton}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

function PhotoGallery() {
  const [photos, setPhotos] = useState([]);
  const [error, setError] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [confirmationDialog, setConfirmationDialog] = useState({ isOpen: false, photoId: null, photoUrl: '' });
  const [hasSelectedPhoto, setHasSelectedPhoto] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        setAccessCode(decodedToken.code);
      } catch (err) {
        console.error('Error decoding token:', err);
        setError('Session expired. Please login again.');
        navigate('/');
      }
    } else {
      navigate('/');
    }
  }, [navigate]);

  const fetchPhotos = useCallback(async () => {
    if (!accessCode) return;

    setIsLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5001/api/photos/${accessCode}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const fetchedPhotos = response.data.photos.map(photo => ({
        ...photo,
        thumbnailUrl: `http://localhost:5001/photo-uploads/${accessCode}/${photo.thumbnail_filename}`,
        fullUrl: `http://localhost:5001/photo-uploads/${accessCode}/${photo.filename}`
      }));
      setPhotos(fetchedPhotos);
      setHasSelectedPhoto(fetchedPhotos.some(photo => photo.selected_for_printing === 1));
    } catch (err) {
      setError('Failed to fetch photos. Please try again later.');
      console.error('Error fetching photos:', err);
    } finally {
      setIsLoading(false);
    }
  }, [accessCode]);

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  const handleSelectPhoto = (photoId, photoUrl) => {
    setConfirmationDialog({ isOpen: true, photoId, photoUrl });
  };

  const handleConfirmSelection = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Sending request to select photo for printing:', confirmationDialog.photoId);
      const response = await axios.post(`http://localhost:5001/api/photos/${confirmationDialog.photoId}/select-print`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Response from select-print:', response.data);
      alert('Photo selected for printing!');
      setConfirmationDialog({ isOpen: false, photoId: null, photoUrl: '' });
      setHasSelectedPhoto(true);
      // Update the local state to reflect the change
      setPhotos(photos.map(photo => 
        photo.id === confirmationDialog.photoId 
          ? { ...photo, selected_for_printing: 1 } 
          : { ...photo, selected_for_printing: 0 }
      ));
    } catch (err) {
      console.error('Error selecting photo for printing:', err.response ? err.response.data : err.message);
      setError('Failed to select photo for printing. Please try again later.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    navigate('/');
  };

  const openModal = (photo) => {
    setSelectedPhoto(photo);
  };

  const closeModal = () => {
    setSelectedPhoto(null);
  };

  const handleDownload = (photo) => {
    const link = document.createElement('a');
    link.href = photo.fullUrl;
    link.download = photo.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return <div style={styles.container}><p>Loading photos...</p></div>;
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Photo Gallery</h1>
      <button onClick={handleLogout} style={styles.logoutButton}>Logout</button>
      {error && <p style={styles.error}>{error}</p>}
      <div style={styles.photoGrid}>
        {photos.map(photo => (
          <div key={photo.id} style={styles.photoContainer}>
            <div style={styles.photoWrapper}>
              <img 
                src={photo.thumbnailUrl} 
                alt={photo.filename} 
                style={styles.photo} 
                onClick={() => openModal(photo)}
              />
              {photo.selected_for_printing === 1 && (
                <div style={styles.selectedOverlay}>
                  <span style={styles.checkmark}>✓</span>
                </div>
              )}
            </div>
            {!hasSelectedPhoto && photo.selected_for_printing === 0 && (
              <button onClick={() => handleSelectPhoto(photo.id, photo.url)} style={styles.selectButton}>
                Select for Printing
              </button>
            )}
            {photo.selected_for_printing === 1 && (
              <p style={styles.selectedText}>Selected for Printing</p>
            )}
            <button onClick={() => handleDownload(photo)} style={styles.downloadButton}>
              Download
            </button>
          </div>
        ))}
      </div>
      {selectedPhoto && (
        <div style={styles.modal} onClick={closeModal}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <img src={selectedPhoto.fullUrl} alt={selectedPhoto.filename} style={styles.modalImage} />
            <button onClick={closeModal} style={styles.closeButton}>Close</button>
          </div>
        </div>
      )}
      <ConfirmationDialog
        isOpen={confirmationDialog.isOpen}
        onClose={() => setConfirmationDialog({ isOpen: false, photoId: null, photoUrl: '' })}
        onConfirm={handleConfirmSelection}
        photoUrl={confirmationDialog.photoUrl}
      />
    </div>
  );
}

const styles = {
  container: {
    padding: '40px',
    backgroundColor: '#1e1e1e',
    color: '#ffffff',
    minHeight: '100vh',
  },
  title: {
    textAlign: 'center',
    marginBottom: '30px',
  },
  error: {
    color: '#ff4d4d',
    textAlign: 'center',
    marginBottom: '20px',
  },
  photoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '20px',
  },
  photoContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  photoWrapper: {
    position: 'relative',
    width: '100%',
    height: '200px',
  },
  photo: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  selectedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: '4px',
  },
  checkmark: {
    color: '#4CAF50',
    fontSize: '48px',
    fontWeight: 'bold',
  },
  selectButton: {
    marginTop: '10px',
    padding: '5px 10px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  selectedText: {
    marginTop: '10px',
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  downloadButton: {
    marginTop: '10px',
    padding: '5px 10px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  logoutButton: {
    position: 'absolute',
    top: '20px',
    right: '20px',
    padding: '10px 20px',
    backgroundColor: '#f44336',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#2c2c2c',
    padding: '20px',
    borderRadius: '8px',
    position: 'relative',
    maxWidth: '90%',
    maxHeight: '90%',
    overflow: 'auto',
  },
  modalImage: {
    maxWidth: '100%',
    maxHeight: '70vh',
    objectFit: 'contain',
  },
  closeButton: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    padding: '5px 10px',
    backgroundColor: '#f44336',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  confirmationImage: {
    maxWidth: '100%',
    maxHeight: '50vh',
    objectFit: 'contain',
    marginBottom: '20px',
  },
  buttonContainer: {
    display: 'flex',
    justifyContent: 'space-around',
    marginTop: '20px',
  },
  confirmButton: {
    padding: '10px 20px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  cancelButton: {
    padding: '10px 20px',
    backgroundColor: '#f44336',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
};

export default PhotoGallery;

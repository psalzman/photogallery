import API_BASE_URL from '../config/api';
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import Slideshow from './Slideshow';

function ConfirmationDialog({ isOpen, onClose, onConfirm, photoUrl }) {
  if (!isOpen) return null;

  return (
    <div style={styles.modal}>
      <div style={styles.modalContent}>
        <h2>Confirm Photo Selection</h2>
        <p>Are you sure this is the photo you want printed? Choosing this photo for printing is irreversible.</p>
        <img src={photoUrl} alt="Selected" style={styles.confirmationImage} />
        <div style={styles.buttonContainer}>
          <button onClick={onConfirm} style={styles.button}>Confirm</button>
          <button onClick={onClose} style={styles.button}>Cancel</button>
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
  const [modalAnimation, setModalAnimation] = useState('');
  const [slideshowIndex, setSlideshowIndex] = useState(null);
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
      const response = await axios.get(`${API_BASE_URL}/api/photos/${accessCode}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const fetchedPhotos = response.data.photos.map(photo => ({
        ...photo,
        thumbnailUrl: `${API_BASE_URL}/photo-uploads/${accessCode}/${photo.thumbnail_filename}`,
        fullUrl: `${API_BASE_URL}/photo-uploads/${accessCode}/${photo.filename}`
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
      const response = await axios.post(`${API_BASE_URL}/api/photos/${confirmationDialog.photoId}/select-print`, {}, {
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
    setModalAnimation('openAnimation');
  };

  const closeModal = () => {
    setModalAnimation('closeAnimation');
    setTimeout(() => {
      setSelectedPhoto(null);
      setModalAnimation('');
    }, 300); // Match this with the animation duration
  };

  const handleDownload = (photo) => {
    const link = document.createElement('a');
    link.href = photo.fullUrl;
    link.download = photo.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openSlideshow = (index) => {
    setSlideshowIndex(index);
  };

  const closeSlideshow = () => {
    setSlideshowIndex(null);
  };

  if (isLoading) {
    return <div style={styles.container}><p>Loading photos...</p></div>;
  }

  return (
    <div style={styles.container}>
      <button onClick={handleLogout} style={styles.logoutButton}>Logout</button>
      <h1 style={styles.title}>Photo Gallery</h1>
      {error && <p style={styles.error}>{error}</p>}
      <div style={styles.photoGrid}>
        {photos.map((photo, index) => (
          <div key={photo.id} style={styles.photoContainer}>
            <div style={styles.photoWrapper}>
              <img 
                src={photo.thumbnailUrl} 
                alt={photo.filename} 
                style={styles.photo} 
                onClick={() => openSlideshow(index)}
              />
              {photo.selected_for_printing === 1 && (
                <div style={styles.selectedOverlay}>
                  <span style={styles.checkmark}>✓</span>
                </div>
              )}
            </div>
            {!hasSelectedPhoto && photo.selected_for_printing === 0 && (
              <button onClick={() => handleSelectPhoto(photo.id, photo.fullUrl)} style={styles.button}>
                Select for Printing
              </button>
            )}
            {photo.selected_for_printing === 1 && (
              <p style={styles.selectedText}>Selected for Printing</p>
            )}
            <button onClick={() => handleDownload(photo)} style={styles.button}>
              Download
            </button>
          </div>
        ))}
      </div>
      {selectedPhoto && (
        <div style={{...styles.modal, animation: `${modalAnimation} 0.3s ease-out`}} onClick={closeModal}>
          <div style={{...styles.modalContent, animation: `${modalAnimation === 'openAnimation' ? 'modalContentOpen' : 'modalContentClose'} 0.3s ease-out`}} onClick={e => e.stopPropagation()}>
            <img src={selectedPhoto.fullUrl} alt={selectedPhoto.filename} style={styles.modalImage} />
            <button onClick={closeModal} style={styles.button}>Close</button>
          </div>
        </div>
      )}
      <ConfirmationDialog
        isOpen={confirmationDialog.isOpen}
        onClose={() => setConfirmationDialog({ isOpen: false, photoId: null, photoUrl: '' })}
        onConfirm={handleConfirmSelection}
        photoUrl={confirmationDialog.photoUrl}
      />
      {slideshowIndex !== null && (
        <Slideshow
          photos={photos}
          startIndex={slideshowIndex}
          onClose={closeSlideshow}
        />
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '40px',
    backgroundColor: '#1e1e1e',
    color: '#ffffff',
    minHeight: '100vh',
    position: 'relative',
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
  button: {
    marginTop: '10px',
    padding: '10px 20px',
    backgroundColor: '#333333',
    color: 'white',
    border: 'none',
    borderRadius: '25px',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
    width: '180px',
    fontSize: '14px',
    '&:hover': {
      backgroundColor: '#555555',
    },
  },
  logoutButton: {
    position: 'absolute',
    top: '20px',
    right: '20px',
    padding: '10px 20px',
    backgroundColor: '#333333',
    color: 'white',
    border: 'none',
    borderRadius: '25px',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
    fontSize: '14px',
    '&:hover': {
      backgroundColor: '#555555',
    },
  },
  selectedText: {
    marginTop: '10px',
    color: '#ffffff',
    fontWeight: 'bold',
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
  '@keyframes openAnimation': {
    from: { opacity: 0 },
    to: { opacity: 1 },
  },
  '@keyframes closeAnimation': {
    from: { opacity: 1 },
    to: { opacity: 0 },
  },
  '@keyframes modalContentOpen': {
    from: { transform: 'scale(0.8)', opacity: 0 },
    to: { transform: 'scale(1)', opacity: 1 },
  },
  '@keyframes modalContentClose': {
    from: { transform: 'scale(1)', opacity: 1 },
    to: { transform: 'scale(0.8)', opacity: 0 },
  },
};

export default PhotoGallery;

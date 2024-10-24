import API_BASE_URL from '../config/api';
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import Slideshow from './Slideshow';

const styles = {
  container: {
    backgroundColor: '#1e1e1e',
    color: '#ffffff',
    minHeight: '100vh',
    position: 'relative',
  },
  headerWrapper: {
    backgroundColor: '#333333',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  title: {
    color: '#ffffff',
    fontSize: '28px',
    fontWeight: '300',
    letterSpacing: '2px',
    margin: 0,
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  userName: {
    color: '#ffffff',
    fontSize: '22px',
    fontWeight: '300',
    letterSpacing: '1px',
    marginBottom: '5px',
  },
  accessCode: {
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: '300',
    letterSpacing: '1px',
  },
  error: {
    color: '#ff4d4d',
    textAlign: 'center',
    marginBottom: '20px',
  },
  photoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '20px',
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
  },
  photoContainer: {
    display: 'flex',
    flexDirection: 'column',
  },
  photoWrapper: {
    position: 'relative',
    paddingBottom: '100%',
    overflow: 'hidden',
  },
  photo: {
    position: 'absolute',
    top: 0,
    left: 0,
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
  photoActions: {
    marginTop: '10px',
  },
  button: {
    marginTop: '5px',
    padding: '8px 16px',
    backgroundColor: '#333333',
    color: 'white',
    border: 'none',
    borderRadius: '25px',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
    width: '100%',
    fontSize: '14px',
  },
  logoutButton: {
    padding: '10px 20px',
    backgroundColor: '#1e1e1e',
    color: 'white',
    border: 'none',
    borderRadius: '25px',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
    fontSize: '14px',
  },
  selectedText: {
    marginTop: '5px',
    color: '#ffffff',
    fontWeight: 'bold',
    textAlign: 'center',
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
  }
};

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
  const [fullName, setFullName] = useState('');
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
        setFullName(decodedToken.fullName || 'User');
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
      setPhotos(response.data.photos);
      setHasSelectedPhoto(response.data.photos.some(photo => photo.selected_for_printing === 1));
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
    }, 300);
  };

  const handleDownload = async (photo) => {
    try {
      const response = await fetch(photo.imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = photo.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Failed to download the file. Please try again.');
    }
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
      <div style={styles.headerWrapper}>
        <div style={styles.header}>
          <h1 style={styles.title}>.l'art pour l'art</h1>
          <button onClick={handleLogout} style={styles.logoutButton}>Logout</button>
        </div>
      </div>
      <div style={styles.userInfo}>
        <span style={styles.userName}>{fullName}</span>
        <span style={styles.accessCode}>Access Code: {accessCode}</span>
      </div>
      {error && <p style={styles.error}>{error}</p>}
      <div style={styles.photoGrid}>
        {photos.map((photo, index) => (
          <div key={photo.id} style={styles.photoContainer}>
            <div style={styles.photoWrapper}>
              <img 
                src={photo.thumbnailUrl || photo.imageUrl} 
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
            <div style={styles.photoActions}>
              {!hasSelectedPhoto && photo.selected_for_printing === 0 && (
                <button onClick={() => handleSelectPhoto(photo.id, photo.imageUrl)} style={styles.button}>
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
          </div>
        ))}
      </div>
      {selectedPhoto && (
        <div style={{...styles.modal, animation: `${modalAnimation} 0.3s ease-out`}} onClick={closeModal}>
          <div style={{...styles.modalContent, animation: `${modalAnimation === 'openAnimation' ? 'modalContentOpen' : 'modalContentClose'} 0.3s ease-out`}} onClick={e => e.stopPropagation()}>
            <img src={selectedPhoto.imageUrl} alt={selectedPhoto.filename} style={styles.modalImage} />
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

export default PhotoGallery;

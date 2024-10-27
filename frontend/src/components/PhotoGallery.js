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
        <h2 style={styles.headerTitle}>Confirm Photo Selection</h2>
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

const styles = {
  container: {
    backgroundColor: '#1e1e1e',
    color: '#ffffff',
    minHeight: '100vh',
    padding: '40px',
    boxSizing: 'border-box',
    maxWidth: '1600px',
    margin: '0 auto'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '40px',
    backgroundColor: '#333333',
    padding: '25px 40px',
    marginLeft: -40,
    marginRight: -40,
    borderRadius: '0 0 12px 12px'
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: '32px',
    fontWeight: '300',
    letterSpacing: '2px',
    margin: 0
  },
  userInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '12px',
    padding: '40px',
    marginBottom: '40px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
  },
  userName: {
    fontSize: '24px',
    fontWeight: '300',
    letterSpacing: '1px',
    marginBottom: '15px'
  },
  accessCode: {
    fontSize: '18px',
    opacity: 0.8
  },
  error: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    color: '#ff3b30',
    padding: '20px',
    borderRadius: '12px',
    marginBottom: '30px',
    textAlign: 'center'
  },
  photoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
    gap: '40px',
    padding: '40px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
  },
  photoContainer: {
    position: 'relative',
    paddingBottom: '100%',
    backgroundColor: '#2c2c2c',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)',
    transition: 'transform 0.3s ease'
  },
  photo: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    cursor: 'pointer'
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
    borderRadius: '12px'
  },
  checkmark: {
    color: '#ffffff',
    fontSize: '64px',
    fontWeight: 'bold',
    textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
  },
  photoActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: '20px',
    background: 'linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent)',
    display: 'flex',
    gap: '10px',
    flexDirection: 'column'
  },
  button: {
    padding: '12px 20px',
    backgroundColor: '#333333',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
    fontSize: '16px',
    fontWeight: '500'
  },
  logoutButton: {
    padding: '12px 24px',
    backgroundColor: '#333333',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
    fontSize: '16px',
    fontWeight: '500'
  },
  selectedText: {
    textAlign: 'center',
    color: '#ffffff',
    backgroundColor: '#444444',
    padding: '12px',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '500'
  },
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  },
  modalContent: {
    backgroundColor: '#2c2c2c',
    padding: '40px',
    borderRadius: '12px',
    maxWidth: '90%',
    maxHeight: '90%',
    position: 'relative',
    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.3)'
  },
  modalImage: {
    maxWidth: '100%',
    maxHeight: '80vh',
    objectFit: 'contain',
    borderRadius: '8px'
  },
  confirmationImage: {
    maxWidth: '100%',
    maxHeight: '60vh',
    objectFit: 'contain',
    marginBottom: '30px',
    borderRadius: '8px'
  },
  buttonContainer: {
    display: 'flex',
    justifyContent: 'center',
    gap: '20px',
    marginTop: '30px'
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    fontSize: '18px'
  },
  '@media (max-width: 1200px)': {
    photoGrid: {
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '30px',
      padding: '30px'
    }
  },
  '@media (max-width: 768px)': {
    container: {
      padding: '20px'
    },
    header: {
      padding: '15px 20px',
      marginLeft: -20,
      marginRight: -20,
      marginBottom: '20px'
    },
    headerTitle: {
      fontSize: '24px'
    },
    userInfo: {
      padding: '20px',
      marginBottom: '20px'
    },
    userName: {
      fontSize: '18px',
      marginBottom: '10px'
    },
    accessCode: {
      fontSize: '14px'
    },
    photoGrid: {
      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
      gap: '15px',
      padding: '15px'
    },
    photoContainer: {
      borderRadius: '8px',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)'
    },
    selectedOverlay: {
      borderRadius: '8px'
    },
    checkmark: {
      fontSize: '36px'
    },
    photoActions: {
      padding: '10px'
    },
    button: {
      padding: '8px 16px',
      fontSize: '14px'
    },
    logoutButton: {
      padding: '8px 16px',
      fontSize: '14px'
    },
    selectedText: {
      padding: '8px',
      fontSize: '14px'
    },
    modalContent: {
      padding: '20px'
    },
    confirmationImage: {
      marginBottom: '20px'
    },
    buttonContainer: {
      gap: '15px',
      marginTop: '20px'
    },
    loadingContainer: {
      fontSize: '16px'
    }
  }
};

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
        const tokenValue = token.startsWith('Bearer ') ? token.slice(7) : token;
        const decodedToken = jwtDecode(tokenValue);
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
      const response = await axios.get(`${API_BASE_URL}/photos/${accessCode}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      setPhotos(response.data.photos);
      setHasSelectedPhoto(response.data.photos.some(photo => photo.selected_for_printing === 1));
    } catch (err) {
      console.error('Error fetching photos:', err);
      setError('Failed to fetch photos. Please try again later.');
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
      const response = await axios.post(`${API_BASE_URL}/photos/${confirmationDialog.photoId}/select-print`, {}, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      alert('Photo selected for printing!');
      setConfirmationDialog({ isOpen: false, photoId: null, photoUrl: '' });
      setHasSelectedPhoto(true);
      setPhotos(photos.map(photo => 
        photo.id === confirmationDialog.photoId 
          ? { ...photo, selected_for_printing: 1 } 
          : { ...photo, selected_for_printing: 0 }
      ));
    } catch (err) {
      console.error('Error selecting photo for printing:', err);
      setError('Failed to select photo for printing. Please try again later.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    navigate('/');
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
    return <div style={styles.loadingContainer}>Loading photos...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.headerTitle}>.l'art pour l'art</h1>
        <button onClick={handleLogout} style={styles.logoutButton}>Logout</button>
      </div>

      <div style={styles.userInfo}>
        <div style={styles.userName}>{fullName}</div>
        <div style={styles.accessCode}>Access Code: {accessCode}</div>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.photoGrid}>
        {photos.map((photo, index) => (
          <div key={photo.id} style={styles.photoContainer}>
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
            <div style={styles.photoActions}>
              {!hasSelectedPhoto && photo.selected_for_printing === 0 && (
                <button onClick={() => handleSelectPhoto(photo.id, photo.imageUrl)} style={styles.button}>
                  Select for Printing
                </button>
              )}
              {photo.selected_for_printing === 1 && (
                <div style={styles.selectedText}>Selected for Printing</div>
              )}
              <button onClick={() => handleDownload(photo)} style={styles.button}>
                Download
              </button>
            </div>
          </div>
        ))}
      </div>

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

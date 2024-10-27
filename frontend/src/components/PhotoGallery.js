import API_BASE_URL from '../config/api';
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import Slideshow from './Slideshow';
import './PhotoGallery.css';

const styles = {
  container: {
    backgroundColor: '#000000',
    color: '#ffffff',
    minHeight: '100vh',
    padding: '0',
    margin: '0',
    boxSizing: 'border-box',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 40px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    position: 'sticky',
    top: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    zIndex: 1000,
    backdropFilter: 'blur(10px)',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: '24px',
    fontWeight: '300',
    letterSpacing: '2px',
    margin: 0,
  },
  userInfo: {
    padding: '20px 40px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    backgroundColor: '#000000',
  },
  userName: {
    fontSize: '18px',
    fontWeight: '300',
    marginBottom: '5px',
  },
  accessCode: {
    fontSize: '14px',
    opacity: 0.7,
  },
  error: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    color: '#ff3b30',
    padding: '15px 40px',
    textAlign: 'center',
    borderBottom: '1px solid rgba(255, 59, 48, 0.2)',
  },
  photoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '2px',
    padding: '2px 20px',
    maxWidth: '2000px',
    margin: '0 auto',
  },
  '@media (max-width: 1400px)': {
    photoGrid: {
      gridTemplateColumns: 'repeat(3, 1fr)',
    },
  },
  '@media (max-width: 1000px)': {
    photoGrid: {
      gridTemplateColumns: 'repeat(2, 1fr)',
      padding: '2px 10px',
    },
  },
  '@media (max-width: 600px)': {
    photoGrid: {
      gridTemplateColumns: '1fr',
      padding: '1px 5px',
    },
    header: {
      padding: '15px 20px',
    },
    headerTitle: {
      fontSize: '20px',
    },
    userInfo: {
      padding: '15px 20px',
    },
    button: {
      padding: '8px 16px',
      fontSize: '12px',
    },
    logoutButton: {
      padding: '6px 12px',
      fontSize: '12px',
    },
    modalContent: {
      padding: '20px',
    },
  },
};

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
  const [downloadProgress, setDownloadProgress] = useState(null);
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

  const handleDownloadAll = async () => {
    try {
      const token = localStorage.getItem('token');
      setDownloadProgress({ percent: 0, text: 'Starting download...' });

      const response = await axios({
        method: 'get',
        url: `${API_BASE_URL}/photos/${accessCode}/download-all`,
        headers: {
          'Authorization': `Bearer ${token}`
        },
        responseType: 'blob',
        onDownloadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setDownloadProgress({
              percent,
              text: `Downloading: ${percent}%`
            });
          } else {
            // If total is unknown, show bytes downloaded
            const mb = Math.round(progressEvent.loaded / 1024 / 1024);
            setDownloadProgress({
              percent: null,
              text: `Downloaded: ${mb} MB`
            });
          }
        }
      });

      // Create download link
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `photos-${accessCode}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // Clear progress after a short delay
      setTimeout(() => {
        setDownloadProgress(null);
      }, 1000);
    } catch (error) {
      console.error('Error downloading photos:', error);
      setError('Failed to download photos. Please try again later.');
      setDownloadProgress(null);
    }
  };

  const handleSelectPhoto = (photoId, photoUrl) => {
    setConfirmationDialog({ isOpen: true, photoId, photoUrl });
  };

  const handleConfirmSelection = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE_URL}/photos/${confirmationDialog.photoId}/select-print`, {}, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
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
      {downloadProgress && (
        <>
          <div className="download-progress">
            <div 
              className="download-progress-bar" 
              style={{ width: downloadProgress.percent ? `${downloadProgress.percent}%` : '100%' }}
            />
          </div>
          <div className="download-progress-text">
            {downloadProgress.text}
          </div>
        </>
      )}

      <div style={styles.header}>
        <h1 style={styles.headerTitle}>.l'art pour l'art</h1>
        <div className="header-buttons">
          <button 
            onClick={handleDownloadAll} 
            className="download-all-button"
            disabled={downloadProgress !== null}
          >
            Download All
          </button>
          <button onClick={handleLogout} className="logout-button">Logout</button>
        </div>
      </div>

      <div style={styles.userInfo}>
        <div style={styles.userName}>{fullName}</div>
        <div style={styles.accessCode}>Access Code: {accessCode}</div>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.photoGrid}>
        {photos.map((photo, index) => (
          <div key={photo.id} className="photo-container">
            <img 
              src={photo.thumbnailUrl || photo.imageUrl} 
              alt={photo.filename} 
              className="photo"
              onClick={() => openSlideshow(index)}
            />
            {photo.selected_for_printing === 1 && (
              <div style={styles.selectedOverlay}>
                <span style={styles.checkmark}>✓</span>
              </div>
            )}
            <div className="photo-actions">
              {!hasSelectedPhoto && photo.selected_for_printing === 0 && (
                <button onClick={() => handleSelectPhoto(photo.id, photo.imageUrl)} className="photo-button">
                  Select for Printing
                </button>
              )}
              {photo.selected_for_printing === 1 && (
                <div style={styles.selectedText}>Selected for Printing</div>
              )}
              <button onClick={() => handleDownload(photo)} className="photo-button">
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

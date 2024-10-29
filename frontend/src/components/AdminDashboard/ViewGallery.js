import React, { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import baseStyles from './styles';
import API_BASE_URL from '../../config/api';

const styles = {
  ...baseStyles,
  searchWrapper: {
    position: 'sticky',
    top: 0,
    backgroundColor: '#1e1e1e',
    padding: '15px 0',
    zIndex: 100,
    marginBottom: '20px',
    '@media (max-width: 768px)': {
      padding: '10px 0',
    },
  },
  photoControls: {
    display: 'flex',
    gap: '10px',
    marginTop: '10px',
    flexWrap: 'wrap',
    '@media (max-width: 768px)': {
      flexDirection: 'column',
    },
  },
  photoInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    background: 'rgba(0, 0, 0, 0.7)',
    padding: '8px',
    color: 'white',
    fontSize: '12px',
    '@media (max-width: 768px)': {
      fontSize: '10px',
      padding: '5px',
    },
  },
  deleteButton: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    backgroundColor: '#333333',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    transition: 'background-color 0.3s ease',
    zIndex: 2,
    '&:hover': {
      backgroundColor: '#444444',
    },
    '@media (max-width: 768px)': {
      width: '24px',
      height: '24px',
      fontSize: '16px',
    },
  },
  modalNavButton: {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    color: 'white',
    border: 'none',
    padding: '15px',
    cursor: 'pointer',
    fontSize: '24px',
    '@media (max-width: 768px)': {
      padding: '10px',
      fontSize: '20px',
    },
  },
  modalCloseButton: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    color: 'white',
    border: 'none',
    padding: '10px',
    cursor: 'pointer',
    borderRadius: '50%',
    '@media (max-width: 768px)': {
      top: '5px',
      right: '5px',
      padding: '8px',
    },
  },
};

function ViewGallery({ setError }) {
  const [photos, setPhotos] = useState([]);
  const [galleryAccessCodeSearchQuery, setGalleryAccessCodeSearchQuery] = useState('');
  const [galleryAccessCodeSearchResults, setGalleryAccessCodeSearchResults] = useState([]);
  const [selectedAccessCode, setSelectedAccessCode] = useState('');
  const [modalPhoto, setModalPhoto] = useState(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  const handleGalleryAccessCodeSearchChange = useCallback(async (e) => {
    const query = e.target.value;
    setGalleryAccessCodeSearchQuery(query);

    if (query.length < 2) {
      setGalleryAccessCodeSearchResults([]);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/access-codes/search-codes?query=${query}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      setGalleryAccessCodeSearchResults(response.data.results);
    } catch (err) {
      console.error('Error searching for access codes:', err);
    }
  }, []);

  const handleSelectGalleryAccessCode = useCallback((code) => {
    setSelectedAccessCode(code);
    setGalleryAccessCodeSearchQuery(code);
    setGalleryAccessCodeSearchResults([]);
    fetchViewerPhotos(code);
  }, []);

  const fetchViewerPhotos = useCallback(async (accessCode) => {
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
    } catch (err) {
      setError('Failed to fetch viewer photos. Please try again.');
      console.error('Error fetching viewer photos:', err);
    }
  }, [setError]);

  const handleDeletePhoto = useCallback(async (photoId) => {
    if (!window.confirm('Are you sure you want to delete this photo?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/photos/${photoId}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      setPhotos(prevPhotos => prevPhotos.filter(photo => photo.id !== photoId));
    } catch (err) {
      setError('Failed to delete photo. Please try again.');
      console.error('Error deleting photo:', err);
    }
  }, [setError]);

  const openModal = useCallback((photo, index) => {
    setModalPhoto(photo);
    setCurrentPhotoIndex(index);
  }, []);

  const closeModal = useCallback(() => {
    setModalPhoto(null);
    setCurrentPhotoIndex(0);
  }, []);

  const navigatePhoto = useCallback((direction) => {
    const newIndex = (currentPhotoIndex + direction + photos.length) % photos.length;
    setCurrentPhotoIndex(newIndex);
    setModalPhoto(photos[newIndex]);
  }, [currentPhotoIndex, photos]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (modalPhoto) {
        if (e.key === 'ArrowLeft') {
          navigatePhoto(-1);
        } else if (e.key === 'ArrowRight') {
          navigatePhoto(1);
        } else if (e.key === 'Escape') {
          closeModal();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalPhoto, navigatePhoto, closeModal]);

  return (
    <>
      <h2 style={styles.title}>View Access Code Gallery</h2>
      <div style={styles.searchWrapper}>
        <div style={styles.searchContainer}>
          <input
            type="text"
            placeholder="Search Access Code, Email, or Full Name"
            value={galleryAccessCodeSearchQuery}
            onChange={handleGalleryAccessCodeSearchChange}
            style={styles.input}
          />
          {galleryAccessCodeSearchResults.length > 0 && (
            <ul style={styles.searchResults}>
              {galleryAccessCodeSearchResults.map((result) => (
                <li
                  key={result.code}
                  onClick={() => handleSelectGalleryAccessCode(result.code)}
                  style={styles.searchResultItem}
                >
                  {result.code} - {result.email} - {result.full_name}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <div style={styles.photoGrid}>
        {photos.map((photo, index) => (
          <div key={photo.id} style={styles.photoContainer}>
            <img 
              src={photo.thumbnailUrl || photo.imageUrl} 
              alt={photo.filename} 
              style={styles.photo} 
              onClick={() => openModal(photo, index)}
            />
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleDeletePhoto(photo.id);
              }} 
              style={styles.deleteButton}
              aria-label="Delete photo"
            >
              ×
            </button>
            <div style={styles.photoInfo}>
              {photo.selected_for_printing === 1 && <span>✓ Selected for Print</span>}
            </div>
          </div>
        ))}
      </div>
      {modalPhoto && (
        <div style={styles.modal} onClick={closeModal}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <img src={modalPhoto.mediumUrl} alt={modalPhoto.filename} style={styles.modalImage} />
            <button 
              onClick={() => navigatePhoto(-1)} 
              style={{...styles.modalNavButton, left: '10px'}}
              aria-label="Previous photo"
            >
              ‹
            </button>
            <button 
              onClick={() => navigatePhoto(1)} 
              style={{...styles.modalNavButton, right: '10px'}}
              aria-label="Next photo"
            >
              ›
            </button>
            <button 
              onClick={closeModal} 
              style={styles.modalCloseButton}
              aria-label="Close modal"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default ViewGallery;

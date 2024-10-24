import React, { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import baseStyles from './styles';
import API_BASE_URL from '../../config/api';

const styles = {
  ...baseStyles
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
      <div style={styles.photoGrid}>
        {photos.map((photo, index) => (
          <div key={photo.id} style={styles.photoContainer}>
            <div style={styles.photoWrapper}>
              <img 
                src={photo.thumbnailUrl || photo.imageUrl} 
                alt={photo.filename} 
                style={styles.photo} 
                onClick={() => openModal(photo, index)}
              />
              {photo.selected_for_printing === 1 && (
                <div style={styles.selectedOverlay}>
                  <span style={styles.checkmark}>✓</span>
                </div>
              )}
            </div>
            <button onClick={() => handleDeletePhoto(photo.id)} style={styles.deleteButton}>Delete</button>
          </div>
        ))}
      </div>
      {modalPhoto && (
        <div style={styles.modal} onClick={closeModal}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <img src={modalPhoto.mediumUrl} alt={modalPhoto.filename} style={styles.modalImage} />
            <button onClick={() => navigatePhoto(-1)} style={styles.navButton}>Previous</button>
            <button onClick={() => navigatePhoto(1)} style={styles.navButton}>Next</button>
            <button onClick={closeModal} style={styles.closeButton}>Close</button>
          </div>
        </div>
      )}
    </>
  );
}

export default ViewGallery;

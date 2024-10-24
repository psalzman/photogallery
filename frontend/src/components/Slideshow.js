import React, { useState, useEffect } from 'react';

const Slideshow = ({ photos, startIndex, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(startIndex);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % photos.length);
      } else if (e.key === 'ArrowLeft') {
        setCurrentIndex((prevIndex) => (prevIndex - 1 + photos.length) % photos.length);
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [photos.length, onClose]);

  return (
    <div style={styles.slideshowContainer}>
      <button style={styles.closeButton} onClick={onClose}>×</button>
      <button style={{...styles.navButton, left: '10px'}} onClick={() => setCurrentIndex((prevIndex) => (prevIndex - 1 + photos.length) % photos.length)}>‹</button>
      <img src={photos[currentIndex].imageUrl} alt={photos[currentIndex].filename} style={styles.slideshowImage} />
      <button style={{...styles.navButton, right: '10px'}} onClick={() => setCurrentIndex((prevIndex) => (prevIndex + 1) % photos.length)}>›</button>
    </div>
  );
};

const styles = {
  slideshowContainer: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
  },
  slideshowImage: {
    maxWidth: '90%',
    maxHeight: '90%',
    objectFit: 'contain',
  },
  closeButton: {
    position: 'absolute',
    top: '20px',
    right: '20px',
    fontSize: '30px',
    color: 'white',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
  },
  navButton: {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: '50px',
    color: 'white',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
  },
};

export default Slideshow;

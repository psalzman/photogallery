import React, { useState, useCallback, useRef } from 'react';
import styles from './styles';
import API_BASE_URL from '../../config/api';
import QueueUpload from '../../services/QueueUpload';

function ProgressBar({ progress }) {
  const mobileStyles = {
    progressContainer: {
      ...styles.progressContainer,
      '@media (max-width: 768px)': {
        height: '16px',
      },
    },
    progressText: {
      ...styles.progressText,
      '@media (max-width: 768px)': {
        fontSize: '10px',
        lineHeight: '16px',
      },
    },
  };

  return (
    <div style={mobileStyles.progressContainer}>
      <div style={{...styles.progressBar, width: `${progress}%`}}></div>
      <span style={mobileStyles.progressText}>{progress.toFixed(0)}%</span>
    </div>
  );
}

function FileProgressItem({ filename, progress }) {
  return (
    <div style={styles.fileProgressItem}>
      <span style={styles.filename}>{filename}</span>
      <ProgressBar progress={progress} />
    </div>
  );
}

function UploadPhotos({ setError, setMessage, onPhotoUploaded }) {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectedAccessCode, setSelectedAccessCode] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileProgresses, setFileProgresses] = useState({});
  const [accessCodeSearchQuery, setAccessCodeSearchQuery] = useState('');
  const [accessCodeSearchResults, setAccessCodeSearchResults] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const uploadQueueRef = useRef(null);

  const handleFileSelect = useCallback((e) => {
    const files = Array.from(e.target.files);
    if (files.length > 100) {
      setError('Maximum 100 photos allowed per upload');
      return;
    }
    setSelectedFiles(files);
    setFileProgresses({});
  }, [setError]);

  const handlePhotoUpload = useCallback(async () => {
    if (selectedFiles.length === 0 || !selectedAccessCode) {
      setError('Please select photos (up to 100) and an access code.');
      return;
    }

    setError('');
    setMessage('');
    setUploadProgress(0);
    setIsUploading(true);

    try {
      // Initialize QueueUpload if not already done
      if (!uploadQueueRef.current) {
        uploadQueueRef.current = new QueueUpload();
      }

      const uploader = uploadQueueRef.current;

      // Set up callbacks
      uploader.setCallbacks({
        onProgress: (progress) => {
          setUploadProgress(progress);
        },
        onFileProgress: (file, progress) => {
          setFileProgresses(prev => ({
            ...prev,
            [file.name]: progress
          }));
        },
        onComplete: () => {
          setMessage('Photos uploaded successfully.');
          setSelectedFiles([]);
          setSelectedAccessCode('');
          setUploadProgress(0);
          setFileProgresses({});
          setIsUploading(false);
          if (onPhotoUploaded) {
            onPhotoUploaded();
          }
        },
        onError: (error, file) => {
          console.error('Error uploading file:', file.name, error);
          setError(`Error uploading ${file.name}: ${error.message}`);
          setIsUploading(false);
        }
      });

      // Add files to queue and start processing
      uploader.addFiles(selectedFiles, selectedAccessCode);
      await uploader.processQueue();

    } catch (err) {
      console.error('Error uploading photos:', err);
      setError('An unexpected error occurred while uploading photos. Please try again.');
      setIsUploading(false);
    }
  }, [selectedFiles, selectedAccessCode, setError, setMessage, onPhotoUploaded]);

  const handleAccessCodeSearchChange = useCallback(async (e) => {
    const query = e.target.value;
    setAccessCodeSearchQuery(query);

    if (query.length < 2) {
      setAccessCodeSearchResults([]);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/access-codes/search-codes?query=${query}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      setAccessCodeSearchResults(data.results);
    } catch (err) {
      console.error('Error searching for access codes:', err);
    }
  }, []);

  const handleSelectAccessCode = useCallback((code) => {
    setSelectedAccessCode(code);
    setAccessCodeSearchQuery(code);
    setAccessCodeSearchResults([]);
  }, []);

  const mobileStyles = {
    formWrapper: {
      padding: '0 15px',
      '@media (max-width: 768px)': {
        padding: '0 10px',
      },
    },
    searchContainer: {
      ...styles.searchContainer,
      marginBottom: '20px',
      '@media (max-width: 768px)': {
        marginBottom: '15px',
      },
    },
    input: {
      ...styles.input,
      '@media (max-width: 768px)': {
        fontSize: '16px',
        padding: '12px',
      },
    },
    button: {
      ...styles.button,
      '@media (max-width: 768px)': {
        padding: '12px',
        fontSize: '16px',
      },
    },
    fileButton: {
      ...styles.button,
      backgroundColor: '#4CAF50',
      '@media (max-width: 768px)': {
        padding: '12px',
        fontSize: '16px',
      },
    },
    selectedFilesText: {
      ...styles.selectedFilesText,
      '@media (max-width: 768px)': {
        fontSize: '12px',
        marginTop: '8px',
      },
    },
    fileProgressList: {
      marginTop: '20px',
      maxHeight: '200px',
      overflowY: 'auto',
    }
  };

  return (
    <>
      <h2 style={styles.title}>Upload Photos</h2>
      <div style={mobileStyles.formWrapper}>
        <div style={mobileStyles.searchContainer}>
          <input
            type="text"
            placeholder="Search Access Code or Email"
            value={accessCodeSearchQuery}
            onChange={handleAccessCodeSearchChange}
            style={mobileStyles.input}
            required
          />
          {accessCodeSearchResults.length > 0 && (
            <ul style={styles.searchResults}>
              {accessCodeSearchResults.map((result) => (
                <li
                  key={result.code}
                  onClick={() => handleSelectAccessCode(result.code)}
                  style={styles.searchResultItem}
                >
                  {result.code} - {result.email} ({result.full_name})
                </li>
              ))}
            </ul>
          )}
        </div>
        <p style={mobileStyles.selectedFilesText}>Selected Access Code: {selectedAccessCode}</p>
        <input
          id="photo-upload"
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          style={styles.fileInput}
          required
          disabled={isUploading}
        />
        <label htmlFor="photo-upload" style={{
          ...mobileStyles.fileButton,
          opacity: isUploading ? 0.6 : 1,
          cursor: isUploading ? 'not-allowed' : 'pointer'
        }}>
          Select Photos
        </label>
        <p style={mobileStyles.selectedFilesText}>
          {selectedFiles.length > 0 ? `${selectedFiles.length} file(s) selected` : 'No files selected'}
        </p>
        <button 
          onClick={handlePhotoUpload} 
          style={{
            ...mobileStyles.button,
            opacity: isUploading ? 0.6 : 1,
            cursor: isUploading ? 'not-allowed' : 'pointer'
          }}
          disabled={isUploading}
        >
          {isUploading ? 'Uploading...' : 'Upload Photos'}
        </button>
        
        {uploadProgress > 0 && (
          <div style={mobileStyles.fileProgressList}>
            {Object.entries(fileProgresses).map(([filename, progress]) => (
              <FileProgressItem
                key={filename}
                filename={filename}
                progress={progress}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default UploadPhotos;

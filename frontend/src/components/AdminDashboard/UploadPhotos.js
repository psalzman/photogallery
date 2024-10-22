import React, { useState, useCallback } from 'react';
import axios from 'axios';
import styles from './styles';
import API_BASE_URL from '../../config/api';

function ProgressBar({ progress }) {
  return (
    <div style={styles.progressContainer}>
      <div style={{...styles.progressBar, width: `${progress}%`}}></div>
      <span style={styles.progressText}>{progress.toFixed(0)}%</span>
    </div>
  );
}

function UploadPhotos({ setError, setMessage, onPhotoUploaded }) {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectedAccessCode, setSelectedAccessCode] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [accessCodeSearchQuery, setAccessCodeSearchQuery] = useState('');
  const [accessCodeSearchResults, setAccessCodeSearchResults] = useState([]);

  const handleFileSelect = useCallback((e) => {
    setSelectedFiles(Array.from(e.target.files));
  }, []);

  const handlePhotoUpload = useCallback(async () => {
    setError('');
    setMessage('');
    setUploadProgress(0);

    if (selectedFiles.length === 0 || !selectedAccessCode) {
      setError('Please select photos (up to 100) and an access code.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append(`photos`, file);
      });
      formData.append('accessCode', selectedAccessCode);

      const response = await axios.post(`${API_BASE_URL}/api/photos/upload`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });

      setMessage('Photos uploaded successfully.');
      setSelectedFiles([]);
      setSelectedAccessCode('');
      setUploadProgress(0);
      if (onPhotoUploaded) {
        onPhotoUploaded();
      }
    } catch (err) {
      console.error('Error uploading photos:', err);
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError('An unexpected error occurred while uploading photos. Please try again.');
      }
      setUploadProgress(0);
    }
  }, [selectedFiles, selectedAccessCode, setError, setMessage]);

  const handleAccessCodeSearchChange = useCallback(async (e) => {
    const query = e.target.value;
    setAccessCodeSearchQuery(query);

    if (query.length < 2) {
      setAccessCodeSearchResults([]);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/access-codes/search-codes?query=${query}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setAccessCodeSearchResults(response.data.results);
    } catch (err) {
      console.error('Error searching for access codes:', err);
    }
  }, []);

  const handleSelectAccessCode = useCallback((code) => {
    setSelectedAccessCode(code);
    setAccessCodeSearchQuery(code);
    setAccessCodeSearchResults([]);
  }, []);

  return (
    <>
      <h2 style={styles.title}>Upload Photos</h2>
      <div style={styles.form}>
        <div style={styles.searchContainer}>
          <input
            type="text"
            placeholder="Search Access Code or Email"
            value={accessCodeSearchQuery}
            onChange={handleAccessCodeSearchChange}
            style={styles.input}
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
        <p>Selected Access Code: {selectedAccessCode}</p>
        <input
          id="photo-upload"
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          style={styles.fileInput}
          required
        />
        <label htmlFor="photo-upload" style={styles.button}>
          Select Photos (up to 100)
        </label>
        <span style={styles.selectedFilesText}>
          {selectedFiles.length > 0 ? `${selectedFiles.length} file(s) selected` : 'No files selected'}
        </span>
        <button onClick={handlePhotoUpload} style={styles.button}>Upload Photos</button>
        {uploadProgress > 0 && <ProgressBar progress={uploadProgress} />}
      </div>
    </>
  );
}

export default UploadPhotos;

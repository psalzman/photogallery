import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import styles from './styles';
import API_BASE_URL from '../../config/api';

function PrintSelections({ setError, refreshTrigger }) {
  const [printSelections, setPrintSelections] = useState([]);
  const [downloadProgress, setDownloadProgress] = useState(null);

  const fetchPrintSelections = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/print-selections`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      setPrintSelections(response.data.printSelections);
    } catch (err) {
      setError('Failed to fetch print selections. Please try again.');
      console.error('Error fetching print selections:', err);
    }
  }, [setError]);

  useEffect(() => {
    fetchPrintSelections();
  }, [fetchPrintSelections, refreshTrigger]);

  const isS3Url = useCallback((url) => {
    try {
      // Try to create a URL object to parse the hostname
      const urlObj = new URL(url);
      console.log('URL hostname:', urlObj.hostname);
      const isS3 = urlObj.hostname.includes('s3.amazonaws.com');
      console.log('Is S3 URL (based on hostname):', isS3);
      return isS3;
    } catch (e) {
      console.error('Error parsing URL:', e);
      return false;
    }
  }, []);

  const downloadFromUrl = useCallback(async (url, filename) => {
    try {
      console.log('Starting download from URL:', url);
      console.log('Filename:', filename);
      
      // Check if it's an S3 URL
      const s3Url = isS3Url(url);
      console.log('Is S3 URL:', s3Url);

      if (s3Url) {
        console.log('Using direct download for S3 URL');
        // Create a temporary link and click it
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.target = '_blank'; // Open in new tab as fallback
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }

      console.log('Using fetch for non-S3 URL');
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        console.error('Download failed with status:', response.status);
        console.error('Response headers:', Object.fromEntries(response.headers.entries()));
        const text = await response.text();
        console.error('Response text:', text);
        throw new Error(`Failed to download file: ${response.status} ${response.statusText}`);
      }
      
      console.log('Creating blob from response...');
      const blob = await response.blob();
      console.log('Blob created:', blob.type, blob.size);

      console.log('Creating object URL...');
      const downloadUrl = window.URL.createObjectURL(blob);
      
      console.log('Creating and clicking download link...');
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log('Revoking object URL...');
      window.URL.revokeObjectURL(downloadUrl);
      
      console.log('Download complete');
    } catch (err) {
      console.error('Download error:', err);
      throw err;
    }
  }, [isS3Url]);

  const handleDownloadPhoto = useCallback(async (selectionId, filename) => {
    try {
      console.log('Starting download process for selection ID:', selectionId);
      setDownloadProgress({ text: 'Getting download URL...' });
      
      const token = localStorage.getItem('token');
      console.log('Requesting download URL from server...');
      const response = await axios.get(`${API_BASE_URL}/print-selections/download/${selectionId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      
      console.log('Received response from server:', response.data);
      setDownloadProgress({ text: 'Downloading photo...' });
      await downloadFromUrl(response.data.url, response.data.filename);
      setDownloadProgress(null);
    } catch (err) {
      console.error('Error downloading photo:', err);
      setError('Failed to download photo. Please try again.');
      setDownloadProgress(null);
    }
  }, [setError, downloadFromUrl]);

  const handleRemoveFromPrint = useCallback(async (selectionId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/print-selections/${selectionId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      fetchPrintSelections();
    } catch (err) {
      console.error('Error removing print selection:', err);
      setError('Failed to remove print selection. Please try again.');
    }
  }, [setError, fetchPrintSelections]);

  const handleDownloadAllPhotos = useCallback(async () => {
    try {
      console.log('Starting bulk download process...');
      setDownloadProgress({ text: 'Getting download URLs...' });
      
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/print-selections/download-all`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      console.log('Received URLs for bulk download:', response.data);
      setDownloadProgress({ text: 'Downloading photos...' });
      
      // Download each file sequentially
      for (let i = 0; i < response.data.files.length; i++) {
        const file = response.data.files[i];
        setDownloadProgress({ 
          text: `Downloading photo ${i + 1} of ${response.data.files.length}...` 
        });
        await downloadFromUrl(file.url, file.filename);
      }

      setDownloadProgress({ text: 'Downloads complete!' });
      setTimeout(() => {
        setDownloadProgress(null);
      }, 2000);
    } catch (err) {
      console.error('Error downloading all photos:', err);
      setError('Failed to download photos. Please try again.');
      setDownloadProgress(null);
    }
  }, [setError, downloadFromUrl]);

  return (
    <>
      <h2 style={styles.title}>Print Selections</h2>
      <button onClick={fetchPrintSelections} style={styles.button}>Refresh Print Selections</button>
      {printSelections.length === 0 ? (
        <p>No print selections available.</p>
      ) : (
        <>
          {downloadProgress && (
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              padding: '10px',
              borderRadius: '4px',
              marginTop: '10px',
              marginBottom: '10px'
            }}>
              {downloadProgress.text}
            </div>
          )}
          <div style={styles.responsiveTable}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.tableHeaderCell}>Selection ID</th>
                  <th style={styles.tableHeaderCell}>Photo Filename</th>
                  <th style={styles.tableHeaderCell}>Viewer Email</th>
                  <th style={styles.tableHeaderCell}>Viewer Full Name</th>
                  <th style={styles.tableHeaderCell}>Access Code</th>
                  <th style={styles.tableHeaderCell}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {printSelections.map(selection => (
                  <tr key={selection.selectionId}>
                    <td style={styles.tableCell} data-label="Selection ID">{selection.selectionId}</td>
                    <td style={styles.tableCell} data-label="Photo Filename">{selection.filename}</td>
                    <td style={styles.tableCell} data-label="Viewer Email">{selection.viewerEmail}</td>
                    <td style={styles.tableCell} data-label="Viewer Full Name">{selection.viewerFullName}</td>
                    <td style={styles.tableCell} data-label="Access Code">{selection.accessCode}</td>
                    <td style={styles.tableCell} data-label="Actions">
                      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                        <button 
                          onClick={() => handleDownloadPhoto(selection.selectionId, selection.filename)} 
                          style={{...styles.button, flex: 1, maxWidth: '120px'}}
                          disabled={downloadProgress !== null}
                        >
                          Download
                        </button>
                        <button 
                          onClick={() => handleRemoveFromPrint(selection.selectionId)} 
                          style={{...styles.button, flex: 1, maxWidth: '120px', backgroundColor: '#dc3545'}}
                          disabled={downloadProgress !== null}
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button 
            onClick={handleDownloadAllPhotos} 
            style={{...styles.button, marginTop: '20px'}}
            disabled={downloadProgress !== null}
          >
            Download All Selected Photos
          </button>
        </>
      )}
    </>
  );
}

export default PrintSelections;

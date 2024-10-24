import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import styles from './styles';
import API_BASE_URL from '../../config/api';

function PrintSelections({ setError, refreshTrigger }) {
  const [printSelections, setPrintSelections] = useState([]);

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

  const handleDownloadPhoto = useCallback(async (selectionId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/print-selections/download/${selectionId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `photo_${selectionId}.jpg`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Error downloading photo:', err);
      setError('Failed to download photo. Please try again.');
    }
  }, [setError]);

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
      fetchPrintSelections(); // Refresh the list after removal
    } catch (err) {
      console.error('Error removing print selection:', err);
      setError('Failed to remove print selection. Please try again.');
    }
  }, [setError, fetchPrintSelections]);

  const handleDownloadAllPhotos = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/print-selections/download-all`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'selected_photos.zip');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Error downloading all photos:', err);
      setError('Failed to download all photos. Please try again.');
    }
  }, [setError]);

  return (
    <>
      <h2 style={styles.title}>Print Selections</h2>
      <button onClick={fetchPrintSelections} style={styles.button}>Refresh Print Selections</button>
      {printSelections.length === 0 ? (
        <p>No print selections available.</p>
      ) : (
        <>
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
                  <td style={styles.tableCell}>{selection.selectionId}</td>
                  <td style={styles.tableCell}>{selection.filename}</td>
                  <td style={styles.tableCell}>{selection.viewerEmail}</td>
                  <td style={styles.tableCell}>{selection.viewerFullName}</td>
                  <td style={styles.tableCell}>{selection.accessCode}</td>
                  <td style={styles.tableCell}>
                    <button onClick={() => handleDownloadPhoto(selection.selectionId)} style={styles.downloadButton}>
                      Download
                    </button>
                    <button onClick={() => handleRemoveFromPrint(selection.selectionId)} style={styles.removeButton}>
                      Remove from Print
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={handleDownloadAllPhotos} style={{...styles.button, marginTop: '20px'}}>
            Download All Selected Photos
          </button>
        </>
      )}
    </>
  );
}

export default PrintSelections;

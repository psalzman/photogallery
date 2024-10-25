import React, { useState, useCallback } from 'react';
import axios from 'axios';
import styles from './styles';
import API_BASE_URL from '../../config/api';

function AssignAccessCode({ setError, setMessage }) {
  const [assignEmail, setAssignEmail] = useState('');
  const [assignCode, setAssignCode] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const handleAssignAccessCode = useCallback(async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!assignEmail || !assignCode) {
      setError('Email and new access code are required.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE_URL}/access-codes/assign`, {
        email: assignEmail,
        newCode: assignCode
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      setMessage('Additional access code assigned successfully.');
      setAssignEmail('');
      setAssignCode('');
      setSearchQuery('');
      setSearchResults([]);
    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError('An unexpected error occurred while assigning the access code. Please try again.');
      }
      console.error('Error assigning access code:', err);
    }
  }, [assignEmail, assignCode, setError, setMessage]);

  const handleSearchChange = useCallback(async (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/access-codes/search?query=${query}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      setSearchResults(response.data.results);
    } catch (err) {
      console.error('Error searching for email addresses:', err);
    }
  }, []);

  const handleSelectEmail = useCallback((email) => {
    setAssignEmail(email);
    setSearchQuery(email);
    setSearchResults([]);
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
    searchResults: {
      ...styles.searchResults,
      '@media (max-width: 768px)': {
        maxHeight: '150px',
      },
    },
    input: {
      ...styles.input,
      '@media (max-width: 768px)': {
        fontSize: '16px', // Prevent zoom on iOS
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
  };

  return (
    <>
      <h2 style={styles.title}>Assign Additional Access Code</h2>
      <div style={mobileStyles.formWrapper}>
        <form onSubmit={handleAssignAccessCode} style={styles.form}>
          <div style={mobileStyles.searchContainer}>
            <input
              type="text"
              placeholder="Search Viewer's Email or Full Name"
              value={searchQuery}
              onChange={handleSearchChange}
              style={mobileStyles.input}
              required
            />
            {searchResults.length > 0 && (
              <ul style={mobileStyles.searchResults}>
                {searchResults.map((result) => (
                  <li
                    key={result.email}
                    onClick={() => handleSelectEmail(result.email)}
                    style={styles.searchResultItem}
                  >
                    {result.email} - {result.full_name}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <input
            type="text"
            placeholder="New Access Code"
            value={assignCode}
            onChange={(e) => setAssignCode(e.target.value)}
            style={mobileStyles.input}
            required
          />
          <button type="submit" style={mobileStyles.button}>
            Assign Access Code
          </button>
        </form>
      </div>
    </>
  );
}

export default AssignAccessCode;

import React, { useState, useCallback } from 'react';
import axios from 'axios';
import styles from './styles';

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
      await axios.post('http://localhost:5001/api/access-codes/assign', {
        email: assignEmail,
        newCode: assignCode
      }, {
        headers: {
          Authorization: `Bearer ${token}`
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
      const response = await axios.get(`http://localhost:5001/api/access-codes/search?query=${query}`, {
        headers: {
          Authorization: `Bearer ${token}`
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

  return (
    <>
      <h2 style={styles.title}>Assign Additional Access Code</h2>
      <form onSubmit={handleAssignAccessCode} style={styles.form}>
        <div style={styles.searchContainer}>
          <input
            type="text"
            placeholder="Search Viewer's Email or Full Name"
            value={searchQuery}
            onChange={handleSearchChange}
            style={styles.input}
            required
          />
          {searchResults.length > 0 && (
            <ul style={styles.searchResults}>
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
          style={styles.input}
          required
        />
        <button type="submit" style={styles.button}>Assign Access Code</button>
      </form>
    </>
  );
}

export default AssignAccessCode;

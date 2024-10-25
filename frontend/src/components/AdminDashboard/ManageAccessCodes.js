import React, { useState, useCallback } from 'react';
import axios from 'axios';
import styles from './styles';
import API_BASE_URL from '../../config/api';

function ManageAccessCodes({ setError, setMessage, onAccessCodeCreated }) {
  const [newEmail, setNewEmail] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newRole, setNewRole] = useState('viewer');

  const handleCreateAccessCode = useCallback(async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!newEmail || !newFullName || !newCode || !newRole) {
      setError('All fields are required.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE_URL}/access-codes`, {
        email: newEmail,
        fullName: newFullName,
        code: newCode,
        role: newRole
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      setMessage('Access code created successfully.');
      setNewEmail('');
      setNewFullName('');
      setNewCode('');
      setNewRole('viewer');
      
      if (onAccessCodeCreated) {
        onAccessCodeCreated();
      }
    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError('An unexpected error occurred while creating the access code. Please try again.');
      }
      console.error('Error creating access code:', err);
    }
  }, [newEmail, newFullName, newCode, newRole, setError, setMessage, onAccessCodeCreated]);

  const mobileStyles = {
    formWrapper: {
      padding: '0 15px',
      '@media (max-width: 768px)': {
        padding: '0 10px',
      },
    },
    form: {
      ...styles.form,
      '@media (max-width: 768px)': {
        gap: '12px',
      },
    },
    input: {
      ...styles.input,
      '@media (max-width: 768px)': {
        fontSize: '16px', // Prevent zoom on iOS
        padding: '12px',
      },
    },
    select: {
      ...styles.select,
      '@media (max-width: 768px)': {
        fontSize: '16px',
        padding: '12px',
        appearance: 'none', // Remove default appearance
        backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23FFFFFF%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 12px top 50%',
        backgroundSize: '12px auto',
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
      <h2 style={styles.title}>Create Access Code</h2>
      <div style={mobileStyles.formWrapper}>
        <form onSubmit={handleCreateAccessCode} style={mobileStyles.form}>
          <input
            type="email"
            placeholder="Email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            style={mobileStyles.input}
            required
          />
          <input
            type="text"
            placeholder="Full Name"
            value={newFullName}
            onChange={(e) => setNewFullName(e.target.value)}
            style={mobileStyles.input}
            required
          />
          <input
            type="text"
            placeholder="New Access Code"
            value={newCode}
            onChange={(e) => setNewCode(e.target.value)}
            style={mobileStyles.input}
            required
          />
          <select
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            style={mobileStyles.select}
            required
          >
            <option value="viewer">Viewer</option>
            <option value="admin">Admin</option>
          </select>
          <button type="submit" style={mobileStyles.button}>Create Access Code</button>
        </form>
      </div>
    </>
  );
}

export default ManageAccessCodes;

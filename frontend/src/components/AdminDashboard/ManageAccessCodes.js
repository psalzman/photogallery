import React, { useState, useCallback } from 'react';
import axios from 'axios';
import styles from './styles';

function ManageAccessCodes({ setError, setMessage }) {
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
      await axios.post('http://localhost:5001/api/access-codes', {
        email: newEmail,
        fullName: newFullName,
        code: newCode,
        role: newRole
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setMessage('Access code created successfully.');
      setNewEmail('');
      setNewFullName('');
      setNewCode('');
      setNewRole('viewer');
    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError('An unexpected error occurred while creating the access code. Please try again.');
      }
      console.error('Error creating access code:', err);
    }
  }, [newEmail, newFullName, newCode, newRole, setError, setMessage]);

  return (
    <>
      <h2 style={styles.title}>Manage Access Codes</h2>
      <form onSubmit={handleCreateAccessCode} style={styles.form}>
        <input
          type="email"
          placeholder="Email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          style={styles.input}
          required
        />
        <input
          type="text"
          placeholder="Full Name"
          value={newFullName}
          onChange={(e) => setNewFullName(e.target.value)}
          style={styles.input}
          required
        />
        <input
          type="text"
          placeholder="New Access Code"
          value={newCode}
          onChange={(e) => setNewCode(e.target.value)}
          style={styles.input}
          required
        />
        <select
          value={newRole}
          onChange={(e) => setNewRole(e.target.value)}
          style={styles.select}
          required
        >
          <option value="viewer">Viewer</option>
          <option value="admin">Admin</option>
        </select>
        <button type="submit" style={styles.button}>Create Access Code</button>
      </form>
    </>
  );
}

export default ManageAccessCodes;

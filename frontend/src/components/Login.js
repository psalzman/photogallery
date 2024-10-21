import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Login() {
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await axios.post('http://localhost:5001/api/auth/login', { accessCode });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userRole', response.data.userRole);
      localStorage.setItem('userEmail', response.data.userEmail);

      if (response.data.userRole === 'admin') {
        navigate('/admin');
      } else {
        navigate('/gallery');
      }
    } catch (err) {
      setError('Invalid access code. Please try again.');
      console.error('Login error:', err);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Login</h1>
      {error && <p style={styles.error}>{error}</p>}
      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          type="text"
          value={accessCode}
          onChange={(e) => setAccessCode(e.target.value)}
          placeholder="Enter access code"
          style={styles.input}
          required
        />
        <button type="submit" style={styles.button}>Login</button>
      </form>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    backgroundColor: '#1e1e1e',
    color: '#ffffff',
  },
  title: {
    marginBottom: '20px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  input: {
    padding: '10px',
    marginBottom: '10px',
    width: '200px',
    backgroundColor: '#333333',
    color: '#ffffff',
    border: 'none',
    borderRadius: '4px',
  },
  button: {
    padding: '10px 20px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  error: {
    color: '#ff4d4d',
    marginBottom: '10px',
  },
};

export default Login;

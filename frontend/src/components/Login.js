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
      <div style={styles.loginBox}>
        <h1 style={styles.title}>Photo Gallery</h1>
        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="text"
            value={accessCode}
            onChange={(e) => setAccessCode(e.target.value)}
            placeholder="Enter access code"
            style={styles.input}
            required
          />
          <button type="submit" style={styles.button}>
            Enter Gallery
          </button>
        </form>
        {error && <p style={styles.error}>{error}</p>}
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    background: 'linear-gradient(135deg, #1a1a1a 0%, #2c2c2c 100%)',
  },
  loginBox: {
    background: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(10px)',
    borderRadius: '20px',
    padding: '40px',
    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    width: '300px',
    textAlign: 'center',
  },
  title: {
    color: '#ffffff',
    marginBottom: '30px',
    fontSize: '28px',
    fontWeight: '300',
    letterSpacing: '2px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
  },
  input: {
    padding: '15px',
    marginBottom: '20px',
    borderRadius: '50px',
    border: 'none',
    background: 'rgba(255, 255, 255, 0.1)',
    color: '#ffffff',
    fontSize: '16px',
    outline: 'none',
    transition: 'all 0.3s ease',
  },
  button: {
    padding: '15px',
    borderRadius: '50px',
    border: 'none',
    background: '#ffffff',
    color: '#1a1a1a',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  error: {
    color: '#ff6b6b',
    marginTop: '20px',
    fontSize: '14px',
  },
};

export default Login;

import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await axios.post('http://localhost:5001/api/auth/login', { accessCode });
      const { token, role, email: userEmail } = response.data;

      // Store the token, role, and email in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('userRole', role);
      localStorage.setItem('userEmail', userEmail);

      // Redirect based on role
      if (role === 'admin') {
        navigate('/admin');
      } else {
        // Navigate to the gallery with the email
        navigate(`/gallery/${userEmail}`);
      }
    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <form onSubmit={handleLogin} style={styles.form}>
        <h2 style={styles.title}>PhotoSelect Login</h2>
        {error && <p style={styles.error}>{error}</p>}
        <input
          type="text"
          placeholder="Enter Access Code"
          value={accessCode}
          onChange={(e) => setAccessCode(e.target.value)}
          style={styles.input}
          required
        />
        <button type="submit" style={styles.button} disabled={isLoading}>
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
}

// Basic styling with darker colors
const styles = {
  container: {
    display: 'flex',
    height: '100vh',
    backgroundColor: '#2c2c2c',
    justifyContent: 'center',
    alignItems: 'center',
  },
  form: {
    backgroundColor: '#3c3c3c',
    padding: '40px',
    borderRadius: '8px',
    boxShadow: '0 0 10px rgba(0, 0, 0, 0.3)',
    textAlign: 'center',
  },
  title: {
    color: '#ffffff',
    marginBottom: '20px',
  },
  input: {
    width: '80%',
    padding: '10px',
    marginBottom: '20px',
    border: 'none',
    borderRadius: '4px',
  },
  button: {
    width: '85%',
    padding: '10px',
    backgroundColor: '#555555',
    color: '#ffffff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    opacity: 1,
    transition: 'opacity 0.3s',
  },
  error: {
    color: '#ff4d4d',
    marginBottom: '15px',
  },
};

export default Login;

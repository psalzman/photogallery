// In production, use the full HTTPS URL to ensure secure connections
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://dressphotos.devstack.one/api'  // Force HTTPS in production
  : 'http://localhost:5001/api';  // In development, use HTTP for local testing

export default API_BASE_URL;

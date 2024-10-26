// In production, use relative path without /api prefix since Apache adds it
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'api'  // Use empty prefix in production since Apache adds /api
  : 'http://localhost:5001/api';  // In development, backend handles /api prefix

export default API_BASE_URL;

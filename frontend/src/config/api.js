const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://dressphotos.devstack.one/api'
  : 'http://localhost:5001';

export default API_BASE_URL;

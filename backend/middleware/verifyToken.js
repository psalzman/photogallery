const jwt = require('jsonwebtoken');
const config = require('../config');

function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  console.log('Auth header:', authHeader);

  if (!authHeader) {
    console.error('No Authorization header provided');
    return res.status(403).json({ error: 'No token provided' });
  }

  // Check if the header starts with 'Bearer '
  if (!authHeader.startsWith('Bearer ')) {
    console.error('Invalid Authorization header format');
    return res.status(401).json({ error: 'Invalid token format' });
  }

  const token = authHeader.split(' ')[1];
  console.log('Token:', token);

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    console.log('Decoded token:', decoded);
    req.user = decoded;
    
    // Add timestamp for debugging
    req.tokenVerifiedAt = new Date().toISOString();
    console.log('Token verified at:', req.tokenVerifiedAt);
    
    next();
  } catch (err) {
    console.error('JWT verification error:', err);
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token has expired' });
    }
    return res.status(401).json({ error: 'Failed to authenticate token' });
  }
}

module.exports = verifyToken;

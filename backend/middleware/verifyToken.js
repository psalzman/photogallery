const jwt = require('jsonwebtoken');
const config = require('../config');

function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  console.log('Auth header:', authHeader);

  if (!authHeader) {
    return res.status(403).json({ error: 'No token provided' });
  }

  // Check if the header starts with 'Bearer '
  if (!authHeader.startsWith('Bearer ')) {
    console.error('Invalid Authorization header format');
    return res.status(401).json({ error: 'Invalid token format' });
  }

  const token = authHeader.split(' ')[1];
  console.log('Token:', token);

  jwt.verify(token, config.jwt.secret, (err, decoded) => {
    if (err) {
      console.error('JWT verification error:', err);
      return res.status(401).json({ error: 'Failed to authenticate token' });
    }

    console.log('Decoded token:', decoded);
    req.user = decoded;
    next();
  });
}

module.exports = verifyToken;

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const config = require('../config');
const db = require('../database');

// Login route
router.post('/login', (req, res) => {
  const { accessCode } = req.body;
  
  if (!accessCode) {
    return res.status(400).json({ error: 'Access code is required.' });
  }

  // Check if the access code exists in the database
  const query = 'SELECT * FROM access_codes WHERE code = ?';
  db.get(query, [accessCode], (err, row) => {
    if (err) {
      console.error('Error fetching access code:', err.message);
      return res.status(500).json({ error: 'Internal server error.' });
    }

    if (row) {
      // Access code is valid, generate JWT
      const token = jwt.sign(
        { 
          email: row.email, 
          role: row.role, 
          code: row.code,
          fullName: row.full_name
        },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn }
      );

      res.json({ 
        message: 'Login successful.', 
        token, 
        role: row.role,
        email: row.email,
        fullName: row.full_name,
        accessCode: row.code
      });
    } else {
      // Access code is invalid
      res.status(401).json({ error: 'Invalid access code.' });
    }
  });
});

module.exports = router;

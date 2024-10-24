const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../database');
const config = require('../config');

router.post('/login', (req, res) => {
  const { accessCode } = req.body;
  console.log('Login attempt with access code:', accessCode);
  console.log('JWT secret:', config.jwt.secret);

  if (!accessCode) {
    return res.status(400).json({ error: 'Access code is required' });
  }

  db.get('SELECT * FROM access_codes WHERE code = ?', [accessCode], (err, user) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (!user) {
      console.log('Invalid access code attempt');
      return res.status(401).json({ error: 'Invalid access code' });
    }

    console.log('User found:', { email: user.email, role: user.role, code: user.code });

    const tokenPayload = { 
      email: user.email, 
      role: user.role, 
      code: user.code, 
      fullName: user.full_name 
    };
    console.log('Token payload:', tokenPayload);

    const token = jwt.sign(
      tokenPayload,
      config.jwt.secret,
      { expiresIn: '1h' }
    );

    console.log('Generated token:', token);

    res.json({ 
      token, 
      userRole: user.role, 
      userEmail: user.email 
    });
  });
});

module.exports = router;

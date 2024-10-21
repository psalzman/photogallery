const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../database');
const config = require('../config');

router.post('/login', (req, res) => {
  const { accessCode } = req.body;

  if (!accessCode) {
    return res.status(400).json({ error: 'Access code is required' });
  }

  db.get('SELECT * FROM access_codes WHERE code = ?', [accessCode], (err, user) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid access code' });
    }

    const token = jwt.sign(
      { email: user.email, role: user.role, code: user.code, fullName: user.full_name },
      config.jwtSecret,
      { expiresIn: '1h' }
    );

    res.json({ token, userRole: user.role, userEmail: user.email });
  });
});

module.exports = router;

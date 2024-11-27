const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { dbAsync } = require('../database');
const config = require('../config');

router.post('/login', async (req, res) => {
  const { accessCode } = req.body;
  const requestId = req.requestId;
  
  console.log(`[${requestId}] Login attempt with access code:`, accessCode);
  console.log(`[${requestId}] JWT secret:`, config.jwt.secret);

  if (!accessCode) {
    console.log(`[${requestId}] Login attempt failed: No access code provided`);
    return res.status(400).json({ error: 'Access code is required' });
  }

  try {
    console.log(`[${requestId}] Querying database for access code...`);
    const user = await dbAsync.get(
      'SELECT * FROM access_codes WHERE code = ?',
      [accessCode]
    );

    if (!user) {
      console.log(`[${requestId}] Invalid access code attempt`);
      return res.status(401).json({ error: 'Invalid access code' });
    }

    console.log(`[${requestId}] User found:`, {
      email: user.email,
      role: user.role,
      code: user.code
    });

    const tokenPayload = {
      email: user.email,
      role: user.role,
      code: user.code,
      fullName: user.full_name
    };
    console.log(`[${requestId}] Token payload:`, tokenPayload);

    const token = jwt.sign(
      tokenPayload,
      config.jwt.secret,
      { expiresIn: '24h' }
    );

    console.log(`[${requestId}] Generated token:`, token.substring(0, 20) + '...');
    console.log(`[${requestId}] Login successful for user:`, user.email);

    res.json({
      token,
      userRole: user.role,
      userEmail: user.email
    });
  } catch (error) {
    console.error(`[${requestId}] Database error:`, error);
    console.error(`[${requestId}] Stack trace:`, error.stack);
    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      requestId
    });
  }
});

module.exports = router;

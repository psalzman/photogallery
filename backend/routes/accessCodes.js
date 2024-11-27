const express = require('express');
const router = express.Router();
const { dbAsync } = require('../database');
const verifyToken = require('../middleware/verifyToken');

// Create a new access code
router.post('/', verifyToken, async (req, res) => {
  const requestId = req.requestId;
  console.log(`[${requestId}] Creating new access code`);

  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can create access codes' });
  }

  const { email, fullName, code, role } = req.body;

  if (!email || !fullName || !code || !role) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const result = await dbAsync.run(
      'INSERT INTO access_codes (email, full_name, code, role) VALUES (?, ?, ?, ?)',
      [email, fullName, code, role]
    );
    console.log(`[${requestId}] Access code created successfully`);
    res.status(201).json({ message: 'Access code created successfully', id: result.lastID });
  } catch (error) {
    console.error(`[${requestId}] Error creating access code:`, error);
    res.status(500).json({ error: 'Failed to create access code' });
  }
});

// Get all access codes (admin only)
router.get('/', verifyToken, async (req, res) => {
  const requestId = req.requestId;
  console.log(`[${requestId}] Fetching all access codes`);

  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can view access codes' });
  }

  try {
    const rows = await dbAsync.all('SELECT * FROM access_codes');
    console.log(`[${requestId}] Found ${rows.length} access codes`);
    res.json({ accessCodes: rows });
  } catch (error) {
    console.error(`[${requestId}] Error fetching access codes:`, error);
    res.status(500).json({ error: 'Failed to fetch access codes' });
  }
});

// Assign additional access code to a viewer
router.post('/assign', verifyToken, async (req, res) => {
  const requestId = req.requestId;
  console.log(`[${requestId}] Assigning new access code`);

  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can assign access codes' });
  }

  const { email, newCode } = req.body;

  if (!email || !newCode) {
    return res.status(400).json({ error: 'Email and new access code are required' });
  }

  try {
    const viewer = await dbAsync.get(
      'SELECT * FROM access_codes WHERE email = ? AND role = ?',
      [email, 'viewer']
    );

    if (!viewer) {
      console.log(`[${requestId}] Viewer not found:`, email);
      return res.status(404).json({ error: 'Viewer not found' });
    }

    console.log(`[${requestId}] Existing viewer found:`, viewer);

    await dbAsync.run(
      'INSERT INTO access_codes (email, full_name, code, role) VALUES (?, ?, ?, ?)',
      [email, viewer.full_name, newCode, 'viewer']
    );

    console.log(`[${requestId}] New access code assigned successfully`);
    res.json({ message: 'New access code assigned successfully' });
  } catch (error) {
    console.error(`[${requestId}] Error assigning access code:`, error);
    res.status(500).json({ error: 'Failed to assign new access code' });
  }
});

// Search for viewer email addresses and full names
router.get('/search', verifyToken, async (req, res) => {
  const requestId = req.requestId;
  console.log(`[${requestId}] Searching for viewers`);

  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can search for email addresses and full names' });
  }

  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ error: 'Search query is required' });
  }

  try {
    const searchQuery = `%${query}%`;
    const rows = await dbAsync.all(
      'SELECT DISTINCT email, full_name FROM access_codes WHERE role = ? AND (email LIKE ? OR full_name LIKE ?)',
      ['viewer', searchQuery, searchQuery]
    );

    console.log(`[${requestId}] Found ${rows.length} matching viewers`);
    res.json({ results: rows });
  } catch (error) {
    console.error(`[${requestId}] Error searching for viewers:`, error);
    res.status(500).json({ error: 'Failed to search for email addresses and full names' });
  }
});

// Search for access codes
router.get('/search-codes', verifyToken, async (req, res) => {
  const requestId = req.requestId;
  console.log(`[${requestId}] Searching for access codes`);

  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can search for access codes' });
  }

  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ error: 'Search query is required' });
  }

  try {
    const searchQuery = `%${query}%`;
    const rows = await dbAsync.all(
      'SELECT DISTINCT code, email, full_name FROM access_codes WHERE role = ? AND (code LIKE ? OR email LIKE ? OR full_name LIKE ?)',
      ['viewer', searchQuery, searchQuery, searchQuery, searchQuery]
    );

    console.log(`[${requestId}] Found ${rows.length} matching access codes`);
    res.json({ results: rows });
  } catch (error) {
    console.error(`[${requestId}] Error searching for access codes:`, error);
    res.status(500).json({ error: 'Failed to search for access codes' });
  }
});

module.exports = router;

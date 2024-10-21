const express = require('express');
const router = express.Router();
const db = require('../database');
const verifyToken = require('../middleware/verifyToken');

// Create a new access code
router.post('/', verifyToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can create access codes' });
  }

  const { email, fullName, code, role } = req.body;

  if (!email || !fullName || !code || !role) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  db.run('INSERT INTO access_codes (email, full_name, code, role) VALUES (?, ?, ?, ?)',
    [email, fullName, code, role],
    function(err) {
      if (err) {
        console.error('Error creating access code:', err.message);
        return res.status(500).json({ error: 'Failed to create access code' });
      }
      res.status(201).json({ message: 'Access code created successfully', id: this.lastID });
    }
  );
});

// Get all access codes (admin only)
router.get('/', verifyToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can view access codes' });
  }

  db.all('SELECT * FROM access_codes', (err, rows) => {
    if (err) {
      console.error('Error fetching access codes:', err.message);
      return res.status(500).json({ error: 'Failed to fetch access codes' });
    }
    res.json({ accessCodes: rows });
  });
});

// Assign additional access code to a viewer
router.post('/assign', verifyToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can assign access codes' });
  }

  const { email, newCode } = req.body;

  if (!email || !newCode) {
    return res.status(400).json({ error: 'Email and new access code are required' });
  }

  console.log('Assigning new access code:', { email, newCode });

  db.get('SELECT * FROM access_codes WHERE email = ? AND role = ?', [email, 'viewer'], (err, row) => {
    if (err) {
      console.error('Error fetching user:', err.message);
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (!row) {
      console.log('Viewer not found:', email);
      return res.status(404).json({ error: 'Viewer not found' });
    }

    console.log('Existing viewer found:', row);

    db.run('INSERT INTO access_codes (email, full_name, code, role) VALUES (?, ?, ?, ?)',
      [email, row.full_name, newCode, 'viewer'],
      function(err) {
        if (err) {
          console.error('Error assigning new access code:', err.message);
          return res.status(500).json({ error: 'Failed to assign new access code' });
        }
        console.log('New access code assigned successfully');
        res.json({ message: 'New access code assigned successfully' });
      }
    );
  });
});

// Search for viewer email addresses and full names
router.get('/search', verifyToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can search for email addresses and full names' });
  }

  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ error: 'Search query is required' });
  }

  const searchQuery = `%${query}%`;

  db.all('SELECT DISTINCT email, full_name FROM access_codes WHERE role = ? AND (email LIKE ? OR full_name LIKE ?)', ['viewer', searchQuery, searchQuery], (err, rows) => {
    if (err) {
      console.error('Error searching for email addresses and full names:', err.message);
      return res.status(500).json({ error: 'Failed to search for email addresses and full names' });
    }
    res.json({ results: rows });
  });
});

// Search for access codes
router.get('/search-codes', verifyToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can search for access codes' });
  }

  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ error: 'Search query is required' });
  }

  const searchQuery = `%${query}%`;

  db.all('SELECT DISTINCT code, email, full_name FROM access_codes WHERE role = ? AND (code LIKE ? OR email LIKE ? OR full_name LIKE ?)', ['viewer', searchQuery, searchQuery, searchQuery], (err, rows) => {
    if (err) {
      console.error('Error searching for access codes:', err.message);
      return res.status(500).json({ error: 'Failed to search for access codes' });
    }
    res.json({ results: rows });
  });
});

module.exports = router;

const express = require('express');
const router = express.Router();
const db = require('../database');
const verifyToken = require('../middleware/verifyToken');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

// Create a new print selection
router.post('/', verifyToken, (req, res) => {
  const { photoId } = req.body;
  const accessCode = req.user.code;

  db.run('INSERT INTO print_selections (photo_id, access_code) VALUES (?, ?)', [photoId, accessCode], function(err) {
    if (err) {
      console.error('Error inserting print selection:', err.message);
      return res.status(500).json({ error: 'Failed to create print selection' });
    }
    res.status(201).json({ message: 'Print selection created successfully', id: this.lastID });
  });
});

// Get all print selections (admin only)
router.get('/', verifyToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can view print selections' });
  }

  const query = `
    SELECT ps.id as selectionId, p.filename, ac.email as viewerEmail, ac.full_name as viewerFullName, ac.code as accessCode
    FROM print_selections ps
    JOIN photos p ON ps.photo_id = p.id
    JOIN access_codes ac ON ps.access_code = ac.code
  `;

  db.all(query, (err, rows) => {
    if (err) {
      console.error('Error fetching print selections:', err.message);
      return res.status(500).json({ error: 'Failed to fetch print selections' });
    }
    res.json({ printSelections: rows });
  });
});

// Get print selections for a specific user
router.get('/user', verifyToken, (req, res) => {
  const accessCode = req.user.code;

  const query = `
    SELECT ps.id as selectionId, p.filename
    FROM print_selections ps
    JOIN photos p ON ps.photo_id = p.id
    WHERE ps.access_code = ?
  `;

  db.all(query, [accessCode], (err, rows) => {
    if (err) {
      console.error('Error fetching user print selections:', err.message);
      return res.status(500).json({ error: 'Failed to fetch print selections' });
    }
    res.json({ printSelections: rows });
  });
});

// Delete a print selection
router.delete('/:id', verifyToken, (req, res) => {
  const selectionId = req.params.id;
  const accessCode = req.user.code;

  db.run('DELETE FROM print_selections WHERE id = ? AND access_code = ?', [selectionId, accessCode], function(err) {
    if (err) {
      console.error('Error deleting print selection:', err.message);
      return res.status(500).json({ error: 'Failed to delete print selection' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Print selection not found or not authorized to delete' });
    }
    res.json({ message: 'Print selection deleted successfully' });
  });
});

// Download a single photo
router.get('/download/:selectionId', verifyToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can download photos' });
  }

  const { selectionId } = req.params;

  const query = `
    SELECT p.filename, ac.code as accessCode
    FROM print_selections ps
    JOIN photos p ON ps.photo_id = p.id
    JOIN access_codes ac ON ps.access_code = ac.code
    WHERE ps.id = ?
  `;

  db.get(query, [selectionId], (err, row) => {
    if (err) {
      console.error('Error fetching photo information:', err.message);
      return res.status(500).json({ error: 'Failed to fetch photo information' });
    }

    if (!row) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    const filePath = path.join(__dirname, '..', 'photo-uploads', row.accessCode, row.filename);
    res.download(filePath, row.filename, (err) => {
      if (err) {
        console.error('Error downloading file:', err);
        res.status(500).json({ error: 'Failed to download file' });
      }
    });
  });
});

// Download all selected photos as a zip file
router.get('/download-all', verifyToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can download photos' });
  }

  const query = `
    SELECT p.filename, ac.code as accessCode
    FROM print_selections ps
    JOIN photos p ON ps.photo_id = p.id
    JOIN access_codes ac ON ps.access_code = ac.code
  `;

  db.all(query, (err, rows) => {
    if (err) {
      console.error('Error fetching photo information:', err.message);
      return res.status(500).json({ error: 'Failed to fetch photo information' });
    }

    const archive = archiver('zip', {
      zlib: { level: 9 } // Sets the compression level.
    });

    res.attachment('selected_photos.zip');
    archive.pipe(res);

    rows.forEach(row => {
      const filePath = path.join(__dirname, '..', 'photo-uploads', row.accessCode, row.filename);
      archive.file(filePath, { name: row.filename });
    });

    archive.finalize();
  });
});

module.exports = router;

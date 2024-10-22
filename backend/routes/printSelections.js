const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');
const db = require('../database');
const verifyToken = require('../middleware/verifyToken');

// Get all print selections
router.get('/', verifyToken, (req, res) => {
  db.all(`
    SELECT ps.id as selectionId, p.filename, p.access_code, ac.email as viewerEmail, ac.full_name as viewerFullName
    FROM print_selections ps
    JOIN photos p ON ps.photo_id = p.id
    JOIN access_codes ac ON p.access_code = ac.code
    ORDER BY ps.id DESC
  `, (err, rows) => {
    if (err) {
      console.error('Error fetching print selections:', err);
      return res.status(500).json({ error: 'Failed to fetch print selections' });
    }
    res.json({ printSelections: rows });
  });
});

// Download a single photo
router.get('/download/:id', verifyToken, (req, res) => {
  const selectionId = req.params.id;

  db.get(`
    SELECT p.filename, p.access_code
    FROM print_selections ps
    JOIN photos p ON ps.photo_id = p.id
    WHERE ps.id = ?
  `, [selectionId], (err, row) => {
    if (err) {
      console.error('Error fetching photo information:', err);
      return res.status(500).json({ error: 'Failed to fetch photo information' });
    }

    if (!row) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    const filePath = path.join(__dirname, '..', 'photo-uploads', row.access_code, row.filename);
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
  db.all(`
    SELECT p.filename, p.access_code
    FROM print_selections ps
    JOIN photos p ON ps.photo_id = p.id
  `, (err, rows) => {
    if (err) {
      console.error('Error fetching selected photos:', err);
      return res.status(500).json({ error: 'Failed to fetch selected photos' });
    }

    const archive = archiver('zip', {
      zlib: { level: 9 } // Sets the compression level.
    });

    archive.on('error', function(err) {
      res.status(500).json({error: err.message});
    });

    //on stream closed we can end the request
    archive.on('end', function() {
      console.log('Archive wrote %d bytes', archive.pointer());
    });

    //set the archive name
    res.attachment('selected_photos.zip');

    //this is the streaming magic
    archive.pipe(res);

    rows.forEach(row => {
      const filePath = path.join(__dirname, '..', 'photo-uploads', row.access_code, row.filename);
      archive.file(filePath, { name: row.filename });
    });

    archive.finalize();
  });
});

// Remove a print selection
router.delete('/:id', verifyToken, (req, res) => {
  const selectionId = req.params.id;

  db.get('SELECT photo_id FROM print_selections WHERE id = ?', [selectionId], (err, row) => {
    if (err) {
      console.error('Error fetching print selection:', err);
      return res.status(500).json({ error: 'Failed to fetch print selection information' });
    }

    if (!row) {
      return res.status(404).json({ error: 'Print selection not found' });
    }

    const photoId = row.photo_id;

    db.run('DELETE FROM print_selections WHERE id = ?', [selectionId], function(deleteErr) {
      if (deleteErr) {
        console.error('Error deleting print selection:', deleteErr);
        return res.status(500).json({ error: 'Failed to delete print selection' });
      }

      db.run('UPDATE photos SET selected_for_printing = 0 WHERE id = ?', [photoId], function(updateErr) {
        if (updateErr) {
          console.error('Error updating photo selected_for_printing status:', updateErr);
          return res.status(500).json({ error: 'Failed to update photo status' });
        }

        res.json({ message: 'Print selection removed successfully' });
      });
    });
  });
});

module.exports = router;

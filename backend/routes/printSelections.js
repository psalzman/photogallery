const express = require('express');
const router = express.Router();
const archiver = require('archiver');
const db = require('../database');
const verifyToken = require('../middleware/verifyToken');
const StorageFactory = require('../services/StorageFactory');
const storageService = StorageFactory.getStorage();
const axios = require('axios');

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
router.get('/download/:id', verifyToken, async (req, res) => {
  const selectionId = req.params.id;

  try {
    console.log(`Attempting to download photo for selection ID: ${selectionId}`);
    
    // Get photo information from database
    const row = await new Promise((resolve, reject) => {
      db.get(`
        SELECT p.filename, p.access_code, p.id as photo_id
        FROM print_selections ps
        JOIN photos p ON ps.photo_id = p.id
        WHERE ps.id = ?
      `, [selectionId], (err, row) => {
        if (err) {
          console.error('Database error:', err);
          reject(err);
        } else {
          console.log('Database result:', row);
          resolve(row);
        }
      });
    });

    if (!row) {
      console.error('Photo not found for selection ID:', selectionId);
      return res.status(404).json({ error: 'Photo not found' });
    }

    console.log(`Generating signed URL for access_code: ${row.access_code}, filename: ${row.filename}`);

    // Get signed URL from storage service
    const signedUrl = await storageService.getFileUrl(row.access_code, row.filename);
    console.log('Generated signed URL:', signedUrl);
    
    // Return the signed URL to the client
    res.json({ url: signedUrl, filename: row.filename });

  } catch (err) {
    console.error('Error in download route:', err);
    console.error('Error stack:', err.stack);
    res.status(500).json({ 
      error: 'Failed to get photo URL',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Download all selected photos as a zip file
router.get('/download-all', verifyToken, async (req, res) => {
  try {
    console.log('Fetching all print selections for download');
    
    const rows = await new Promise((resolve, reject) => {
      db.all(`
        SELECT p.filename, p.access_code
        FROM print_selections ps
        JOIN photos p ON ps.photo_id = p.id
      `, (err, rows) => {
        if (err) {
          console.error('Database error:', err);
          reject(err);
        } else {
          console.log(`Found ${rows.length} photos for download`);
          resolve(rows);
        }
      });
    });

    if (rows.length === 0) {
      return res.status(404).json({ error: 'No photos found for download' });
    }

    // Create a zip file stream
    const archive = archiver('zip', {
      zlib: { level: 5 } // Set compression level
    });

    // Set the response headers for zip download
    res.attachment('selected_photos.zip');
    res.setHeader('Content-Type', 'application/zip');

    // Pipe the archive to the response
    archive.pipe(res);

    // Add each file to the archive
    for (const row of rows) {
      try {
        console.log(`Processing file: ${row.filename}`);
        const signedUrl = await storageService.getFileUrl(row.access_code, row.filename);
        console.log(`Got signed URL for ${row.filename}`);
        
        // Download the file from S3
        const response = await axios({
          method: 'get',
          url: signedUrl,
          responseType: 'stream'
        });

        // Add the file to the zip
        archive.append(response.data, { name: row.filename });
        console.log(`Added ${row.filename} to zip`);
      } catch (err) {
        console.error(`Error processing file ${row.filename}:`, err);
        // Continue with other files even if one fails
      }
    }

    // Finalize the archive
    await archive.finalize();
    console.log('Zip archive finalized');

  } catch (err) {
    console.error('Error in download-all route:', err);
    console.error('Error stack:', err.stack);
    res.status(500).json({ 
      error: 'Failed to create zip file',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
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

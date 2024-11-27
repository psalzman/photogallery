const express = require('express');
const router = express.Router();
const archiver = require('archiver');
const { dbAsync } = require('../database');
const verifyToken = require('../middleware/verifyToken');
const StorageFactory = require('../services/StorageFactory');
const storageService = StorageFactory.getStorage();
const axios = require('axios');

// Get all print selections
router.get('/', verifyToken, async (req, res) => {
  const requestId = req.requestId;
  console.log(`[${requestId}] Fetching all print selections`);

  try {
    const rows = await dbAsync.all(`
      SELECT ps.id as selectionId, p.filename, p.access_code, ac.email as viewerEmail, ac.full_name as viewerFullName
      FROM print_selections ps
      JOIN photos p ON ps.photo_id = p.id
      JOIN access_codes ac ON p.access_code = ac.code
      ORDER BY ps.id DESC
    `);
    
    console.log(`[${requestId}] Found ${rows.length} print selections`);
    res.json({ printSelections: rows });
  } catch (error) {
    console.error(`[${requestId}] Error fetching print selections:`, error);
    res.status(500).json({ 
      error: 'Failed to fetch print selections',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      requestId
    });
  }
});

// Download a single photo
router.get('/download/:id', verifyToken, async (req, res) => {
  const selectionId = req.params.id;
  const requestId = req.requestId;

  try {
    console.log(`[${requestId}] Attempting to download photo for selection ID: ${selectionId}`);
    
    const row = await dbAsync.get(`
      SELECT p.filename, p.medium_filename, p.thumbnail_filename, p.access_code, p.id as photo_id
      FROM print_selections ps
      JOIN photos p ON ps.photo_id = p.id
      WHERE ps.id = ?
    `, [selectionId]);

    if (!row) {
      console.error(`[${requestId}] Photo not found for selection ID:`, selectionId);
      return res.status(404).json({ error: 'Photo not found' });
    }

    console.log(`[${requestId}] Database result:`, row);
    console.log(`[${requestId}] Generating signed URL for access_code: ${row.access_code}, filename: ${row.filename}`);

    const signedUrl = await storageService.getFileUrl(row.access_code, row.filename);
    console.log(`[${requestId}] Generated signed URL:`, signedUrl);
    
    res.json({ url: signedUrl, filename: row.filename });
  } catch (error) {
    console.error(`[${requestId}] Error in download route:`, error);
    console.error(`[${requestId}] Stack trace:`, error.stack);
    res.status(500).json({ 
      error: 'Failed to get photo URL',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      requestId
    });
  }
});

// Download all selected photos as a zip file
router.get('/download-all', verifyToken, async (req, res) => {
  const requestId = req.requestId;

  try {
    console.log(`[${requestId}] Fetching all print selections for download`);
    
    const rows = await dbAsync.all(`
      SELECT p.filename, p.medium_filename, p.thumbnail_filename, p.access_code
      FROM print_selections ps
      JOIN photos p ON ps.photo_id = p.id
    `);

    console.log(`[${requestId}] Found ${rows.length} photos for download`);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'No photos found for download' });
    }

    const archive = archiver('zip', {
      zlib: { level: 5 }
    });

    archive.on('error', (err) => {
      console.error(`[${requestId}] Archive error:`, err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to create zip file' });
      }
    });

    res.attachment('selected_photos.zip');
    res.setHeader('Content-Type', 'application/zip');
    archive.pipe(res);

    for (const row of rows) {
      try {
        console.log(`[${requestId}] Processing file: ${row.filename}`);
        const signedUrl = await storageService.getFileUrl(row.access_code, row.filename);
        
        const response = await axios({
          method: 'get',
          url: signedUrl,
          responseType: 'stream'
        });

        archive.append(response.data, { name: row.filename });
        console.log(`[${requestId}] Added ${row.filename} to zip`);
      } catch (error) {
        console.error(`[${requestId}] Error processing file ${row.filename}:`, error);
      }
    }

    await archive.finalize();
    console.log(`[${requestId}] Zip archive finalized`);
  } catch (error) {
    console.error(`[${requestId}] Error in download-all route:`, error);
    console.error(`[${requestId}] Stack trace:`, error.stack);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Failed to create zip file',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        requestId
      });
    }
  }
});

// Remove a print selection
router.delete('/:id', verifyToken, async (req, res) => {
  const selectionId = req.params.id;
  const requestId = req.requestId;

  try {
    console.log(`[${requestId}] Removing print selection ID: ${selectionId}`);
    
    const row = await dbAsync.get(
      'SELECT photo_id FROM print_selections WHERE id = ?',
      [selectionId]
    );

    if (!row) {
      return res.status(404).json({ error: 'Print selection not found' });
    }

    const photoId = row.photo_id;

    await dbAsync.run(
      'DELETE FROM print_selections WHERE id = ?',
      [selectionId]
    );

    await dbAsync.run(
      'UPDATE photos SET selected_for_printing = 0 WHERE id = ?',
      [photoId]
    );

    console.log(`[${requestId}] Successfully removed print selection`);
    res.json({ message: 'Print selection removed successfully' });
  } catch (error) {
    console.error(`[${requestId}] Error removing print selection:`, error);
    res.status(500).json({ 
      error: 'Failed to remove print selection',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      requestId
    });
  }
});

module.exports = router;

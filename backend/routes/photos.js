const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const sharp = require('sharp');
const exifReader = require('exif-reader');
const archiver = require('archiver');
const axios = require('axios');
const db = require('../database');
const verifyToken = require('../middleware/verifyToken');
const StorageFactory = require('../services/StorageFactory');
const config = require('../config');

const tempUploadDir = path.join(__dirname, '..', config.storage.local.tempDir);
fs.mkdir(tempUploadDir, { recursive: true }).catch(console.error);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, tempUploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });
const storageService = StorageFactory.getStorage();

// Extract detailed EXIF data
const extractExifData = async (buffer) => {
  try {
    const metadata = await sharp(buffer).metadata();
    let exifData = null;

    if (metadata.exif) {
      try {
        // Get raw EXIF data without filtering
        exifData = exifReader(metadata.exif);
        console.log('Raw EXIF data:', JSON.stringify(exifData, null, 2));
      } catch (exifError) {
        console.error('Error parsing EXIF data:', exifError);
      }
    }

    // Combine Sharp metadata with complete EXIF data
    const combinedMetadata = {
      // Sharp metadata
      format: metadata.format,
      width: metadata.width,
      height: metadata.height,
      space: metadata.space,
      channels: metadata.channels,
      depth: metadata.depth,
      density: metadata.density,
      chromaSubsampling: metadata.chromaSubsampling,
      isProgressive: metadata.isProgressive,
      hasProfile: metadata.hasProfile,
      hasAlpha: metadata.hasAlpha,
      orientation: metadata.orientation,
      // Complete EXIF data
      exif: exifData,
      // Store raw buffer for potential future parsing
      rawExif: metadata.exif ? metadata.exif.toString('base64') : null
    };

    return combinedMetadata;
  } catch (error) {
    console.error('Error extracting metadata:', error);
    return null;
  }
};

// Create thumbnail and medium-sized image
const createResizedImages = async (buffer) => {
  // Get EXIF and other metadata
  const metadata = await extractExifData(buffer);
  console.log('Combined metadata:', metadata);

  // Create sharp instance with auto-orientation enabled
  const image = sharp(buffer, { failOnError: false })
    .rotate() // This automatically rotates based on EXIF orientation
    .withMetadata(); // Preserve metadata except orientation

  // Create thumbnail
  const thumbnail = await image
    .clone()
    .resize(500, 500, { 
      fit: 'inside', 
      withoutEnlargement: true 
    })
    .toBuffer();

  // Create medium-sized image
  const medium = await image
    .clone()
    .resize(2000, null, { 
      fit: 'inside', 
      withoutEnlargement: true 
    })
    .toBuffer();

  // Process original image to correct orientation but maintain full size
  const original = await image
    .clone()
    .toBuffer();

  return { thumbnail, medium, original, metadata };
};

// Upload photos
router.post('/upload', verifyToken, (req, res) => {
  console.log('Upload route hit');
  
  upload.array('photos', 100)(req, res, async function (err) {
    if (err) {
      console.error('Error uploading files:', err);
      return res.status(500).json({ error: 'Failed to upload files', message: err.message });
    }

    const accessCode = req.body.accessCode;
    console.log('Access Code:', accessCode);

    if (!accessCode) {
      console.error('Access code is missing');
      return res.status(400).json({ error: 'Access code is required' });
    }

    const uploadedFiles = req.files;

    if (!uploadedFiles || uploadedFiles.length === 0) {
      console.error('No files uploaded');
      return res.status(400).json({ error: 'No files uploaded' });
    }

    console.log('Number of files uploaded:', uploadedFiles.length);

    const insertPromises = uploadedFiles.map(async (file) => {
      try {
        const finalFilename = `${Date.now()}-${file.originalname}`;
        const fileBuffer = await fs.readFile(file.path);
        const { thumbnail, medium, original, metadata } = await createResizedImages(fileBuffer);
        const thumbnailFilename = `thumb_${finalFilename}`;
        const mediumFilename = `medium_${finalFilename}`;

        console.log(`Processing file: ${finalFilename}`);
        console.log('Full metadata:', metadata);

        // Upload orientation-corrected original file
        await storageService.uploadBuffer(original, accessCode, finalFilename);
        console.log(`Uploaded original file: ${finalFilename}`);
        
        // Upload thumbnail
        await storageService.uploadBuffer(thumbnail, accessCode, thumbnailFilename);
        console.log(`Uploaded thumbnail: ${thumbnailFilename}`);

        // Upload medium-sized image
        await storageService.uploadBuffer(medium, accessCode, mediumFilename);
        console.log(`Uploaded medium image: ${mediumFilename}`);

        // Clean up temp file
        await fs.unlink(file.path).catch(err => {
          console.warn(`Warning: Could not delete temp file ${file.path}:`, err);
        });

        return new Promise((resolve, reject) => {
          const exifData = JSON.stringify(metadata);
          db.run(
            'INSERT INTO photos (filename, thumbnail_filename, medium_filename, access_code, exif_data) VALUES (?, ?, ?, ?, ?)',
            [finalFilename, thumbnailFilename, mediumFilename, accessCode, exifData],
            function(err) {
              if (err) {
                console.error('Error inserting photo:', err);
                reject(err);
              } else {
                resolve(this.lastID);
              }
            }
          );
        });
      } catch (error) {
        console.error(`Error processing file ${file.originalname}:`, error);
        throw error;
      }
    });

    try {
      await Promise.all(insertPromises);
      console.log('All photos inserted into database');
      res.status(201).json({ message: 'Photos uploaded successfully', count: uploadedFiles.length });
    } catch (err) {
      console.error('Error uploading photos:', err);
      res.status(500).json({ error: 'Failed to upload photos', details: err.message });
    }
  });
});

// Get all photos (for viewall role)
router.get('/all', verifyToken, (req, res) => {
  if (req.user.role !== 'viewall') {
    return res.status(403).json({ error: 'Access denied. Requires viewall role.' });
  }

  console.log('Fetching all photos');

  db.all('SELECT * FROM photos', [], async (err, rows) => {
    if (err) {
      console.error('Error fetching photos:', err);
      return res.status(500).json({ error: 'Failed to fetch photos' });
    }

    try {
      // Add URLs for original, medium, and thumbnail images
      const photosWithUrls = await Promise.all(rows.map(async (photo) => {
        const imageUrl = await storageService.getFileUrl(photo.access_code, photo.filename);
        const thumbnailUrl = await storageService.getFileUrl(photo.access_code, photo.thumbnail_filename);
        const mediumUrl = await storageService.getFileUrl(photo.access_code, photo.medium_filename);
        
        // Parse EXIF data from JSON string
        const exifData = photo.exif_data ? JSON.parse(photo.exif_data) : null;
        
        return {
          ...photo,
          imageUrl,
          thumbnailUrl,
          mediumUrl,
          exifData
        };
      }));

      console.log(`Found ${photosWithUrls.length} total photos`);
      res.json({ photos: photosWithUrls });
    } catch (error) {
      console.error('Error generating URLs:', error);
      res.status(500).json({ error: 'Failed to generate photo URLs' });
    }
  });
});

// Get photos for a specific access code
router.get('/:accessCode', verifyToken, (req, res) => {
  const accessCode = req.params.accessCode;
  console.log('Fetching photos for access code:', accessCode);

  // Allow viewall role to access any photos
  if (req.user.role !== 'viewall' && req.user.code !== accessCode) {
    return res.status(403).json({ error: 'Access denied' });
  }

  db.all('SELECT * FROM photos WHERE access_code = ?', [accessCode], async (err, rows) => {
    if (err) {
      console.error('Error fetching photos:', err);
      return res.status(500).json({ error: 'Failed to fetch photos' });
    }

    try {
      // Add URLs for original, medium, and thumbnail images
      const photosWithUrls = await Promise.all(rows.map(async (photo) => {
        const imageUrl = await storageService.getFileUrl(accessCode, photo.filename);
        const thumbnailUrl = await storageService.getFileUrl(accessCode, photo.thumbnail_filename);
        const mediumUrl = await storageService.getFileUrl(accessCode, photo.medium_filename);
        
        // Parse EXIF data from JSON string
        const exifData = photo.exif_data ? JSON.parse(photo.exif_data) : null;
        
        return {
          ...photo,
          imageUrl,
          thumbnailUrl,
          mediumUrl,
          exifData
        };
      }));

      console.log(`Found ${photosWithUrls.length} photos for access code ${accessCode}`);
      res.json({ photos: photosWithUrls });
    } catch (error) {
      console.error('Error generating URLs:', error);
      res.status(500).json({ error: 'Failed to generate photo URLs' });
    }
  });
});

// Delete a photo
router.delete('/:id', verifyToken, (req, res) => {
  const photoId = req.params.id;

  db.get('SELECT filename, thumbnail_filename, medium_filename, access_code FROM photos WHERE id = ?', [photoId], async (err, row) => {
    if (err) {
      console.error('Error fetching photo:', err);
      return res.status(500).json({ error: 'Failed to fetch photo information' });
    }

    if (!row) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    try {
      console.log(`Deleting files for photo ${photoId}`);
      // Delete original, medium, and thumbnail from storage
      await storageService.deleteFile(row.access_code, row.filename);
      await storageService.deleteFile(row.access_code, row.thumbnail_filename);
      await storageService.deleteFile(row.access_code, row.medium_filename);

      db.run('DELETE FROM photos WHERE id = ?', [photoId], function(deleteErr) {
        if (deleteErr) {
          console.error('Error deleting photo from database:', deleteErr);
          return res.status(500).json({ error: 'Failed to delete photo from database' });
        }

        console.log(`Successfully deleted photo ${photoId}`);
        res.json({ message: 'Photo deleted successfully' });
      });
    } catch (error) {
      console.error('Error deleting files:', error);
      return res.status(500).json({ error: 'Failed to delete photo files', details: error.message });
    }
  });
});

// Select photo for printing
router.post('/:id/select-print', verifyToken, (req, res) => {
  const photoId = req.params.id;
  const accessCode = req.user.code;

  console.log(`Selecting photo ${photoId} for printing by user with access code ${accessCode}`);

  db.get('SELECT * FROM photos WHERE id = ?', [photoId], (err, photo) => {
    if (err) {
      console.error('Error fetching photo:', err);
      return res.status(500).json({ error: 'Failed to fetch photo information' });
    }

    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    if (photo.access_code !== accessCode) {
      return res.status(403).json({ error: 'You do not have permission to select this photo' });
    }

    db.run('INSERT INTO print_selections (photo_id, access_code) VALUES (?, ?)', [photoId, accessCode], function(err) {
      if (err) {
        console.error('Error inserting print selection:', err);
        return res.status(500).json({ error: 'Failed to select photo for printing' });
      }

      db.run('UPDATE photos SET selected_for_printing = 1 WHERE id = ?', [photoId], function(updateErr) {
        if (updateErr) {
          console.error('Error updating photo selected_for_printing status:', updateErr);
          return res.status(500).json({ error: 'Failed to update photo status' });
        }

        res.status(201).json({ message: 'Photo selected for printing successfully', id: this.lastID });
      });
    });
  });
});

// Download all photos as zip
router.get('/:accessCode/download-all', verifyToken, async (req, res) => {
  const accessCode = req.params.accessCode;
  console.log(`Downloading all photos for access code: ${accessCode}`);

  // Allow viewall role to download any photos
  if (req.user.role !== 'viewall' && req.user.code !== accessCode) {
    return res.status(403).json({ error: 'You do not have permission to download these photos' });
  }

  try {
    // Get all photos for this access code
    const photos = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM photos WHERE access_code = ?', [accessCode], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    if (!photos || photos.length === 0) {
      return res.status(404).json({ error: 'No photos found' });
    }

    // Create a zip file
    const archive = archiver('zip', {
      zlib: { level: 5 } // Compression level
    });

    // Handle archive warnings
    archive.on('warning', function(err) {
      if (err.code === 'ENOENT') {
        console.warn('Archive warning:', err);
      } else {
        throw err;
      }
    });

    // Handle archive errors
    archive.on('error', function(err) {
      console.error('Archive error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to create zip file' });
      }
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename=photos-${accessCode}.zip`);

    // Pipe archive data to response
    archive.pipe(res);

    // Add each photo to the archive
    for (const photo of photos) {
      try {
        // Get the signed URL for the photo
        const signedUrl = await storageService.getFileUrl(accessCode, photo.filename);
        
        // Download the file using axios
        const response = await axios({
          method: 'get',
          url: signedUrl,
          responseType: 'stream'
        });

        // Add the file to the archive
        archive.append(response.data, { name: photo.filename });
      } catch (error) {
        console.error(`Error adding file ${photo.filename} to archive:`, error);
        // Continue with other files even if one fails
      }
    }

    // Finalize archive
    await archive.finalize();
    console.log(`Successfully created zip file for access code: ${accessCode}`);
  } catch (error) {
    console.error('Error creating zip:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to create zip file' });
    }
  }
});

module.exports = router;

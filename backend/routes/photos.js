const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const sharp = require('sharp');
const exifReader = require('exif-reader');
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

// ... (rest of the routes remain the same)

module.exports = router;

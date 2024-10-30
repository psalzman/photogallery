const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');  // Use regular fs for createWriteStream
const fsPromises = require('fs').promises;  // Use promises for async operations
const sharp = require('sharp');
const exifReader = require('exif-reader');
const archiver = require('archiver');
const axios = require('axios');
const db = require('../database');
const verifyToken = require('../middleware/verifyToken');
const StorageFactory = require('../services/StorageFactory');
const config = require('../config');

const tempUploadDir = path.join(__dirname, '..', config.storage.local.tempDir);
const chunksDir = path.join(tempUploadDir, 'chunks');

// Ensure temp directories exist
Promise.all([
  fsPromises.mkdir(tempUploadDir, { recursive: true }),
  fsPromises.mkdir(chunksDir, { recursive: true })
]).catch(console.error);

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

// Serve photo files
router.get('/file/:accessCode/:filename', verifyToken, async (req, res) => {
  const { accessCode, filename } = req.params;

  // Check if user has access to this photo
  if (req.user.role !== 'admin' && req.user.role !== 'viewall' && req.user.code !== accessCode) {
    return res.status(403).json({ error: 'Access denied' });
  }

  try {
    // Get the actual file path
    const filePath = storageService.getFilePath(accessCode, filename);
    
    // Set content type based on file extension
    const ext = path.extname(filename).toLowerCase();
    const contentType = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp'
    }[ext] || 'application/octet-stream';
    
    res.setHeader('Content-Type', contentType);
    
    // Stream the file
    const stream = await storageService.getFileStream(accessCode, filename);
    stream.pipe(res);
  } catch (error) {
    console.error('Error serving file:', error);
    res.status(404).json({ error: 'File not found' });
  }
});

// Extract detailed EXIF data
const extractExifData = async (buffer) => {
  try {
    const metadata = await sharp(buffer).metadata();
    let exifData = null;

    if (metadata.exif) {
      try {
        exifData = exifReader(metadata.exif);
      } catch (exifError) {
        console.error('Error parsing EXIF data:', exifError);
      }
    }

    const combinedMetadata = {
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
      exif: exifData,
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
  const metadata = await extractExifData(buffer);

  const image = sharp(buffer, { failOnError: false })
    .rotate()
    .withMetadata();

  const thumbnail = await image
    .clone()
    .resize(500, 500, { 
      fit: 'inside', 
      withoutEnlargement: true 
    })
    .toBuffer();

  const medium = await image
    .clone()
    .resize(2000, null, { 
      fit: 'inside', 
      withoutEnlargement: true 
    })
    .toBuffer();

  const original = await image
    .clone()
    .toBuffer();

  return { thumbnail, medium, original, metadata };
};

// Handle chunked upload
const chunkStorage = multer.diskStorage({
  destination: async function (req, file, cb) {
    try {
      await fsPromises.mkdir(chunksDir, { recursive: true });
      cb(null, chunksDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: function (req, file, cb) {
    // Generate a temporary unique name
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `temp-${uniqueSuffix}`);
  }
});

const chunkUpload = multer({ storage: chunkStorage });

// Upload chunk endpoint
router.post('/upload-chunk', verifyToken, async (req, res) => {
  try {
    // Handle the upload
    await new Promise((resolve, reject) => {
      chunkUpload.single('chunk')(req, res, (err) => {
        if (err) {
          console.error('Multer error:', err);
          reject(err);
        } else {
          resolve();
        }
      });
    });

    if (!req.file) {
      throw new Error('No chunk file received');
    }

    // Parse metadata
    const [chunkIndex, totalChunks, isLastChunk, fileSize] = (req.body.metadata || '').split('_');
    const filename = req.body.filename;
    const currentChunk = parseInt(chunkIndex);
    const totalChunksNum = parseInt(totalChunks);
    const isLastChunkBool = isLastChunk === 'true';
    const accessCode = req.body.accessCode;

    // Rename the temp file to the proper chunk name
    const tempPath = req.file.path;
    const finalChunkPath = path.join(chunksDir, `${filename}.part${currentChunk}`);
    await fsPromises.rename(tempPath, finalChunkPath);

    console.log('Processing chunk upload:', {
      filename,
      chunkIndex: currentChunk,
      totalChunks: totalChunksNum,
      isLastChunk: isLastChunkBool,
      fileSize: parseInt(fileSize),
      receivedFile: 'yes'
    });

    console.log(`Processing chunk ${currentChunk + 1}/${totalChunksNum} for ${filename}`);

    // If this is the last chunk, process the complete file
    if (isLastChunkBool) {
      console.log('Processing final chunk, combining all chunks...');

      // Create final file
      const finalPath = path.join(tempUploadDir, filename);
      const writeStream = fs.createWriteStream(finalPath);

      // First read all chunks into memory
      const chunkBuffers = [];
      let totalSize = 0;

      for (let i = 0; i < totalChunksNum; i++) {
        const chunkPath = path.join(chunksDir, `${filename}.part${i}`);
        try {
          console.log(`Reading chunk ${i + 1}/${totalChunksNum} from ${chunkPath}`);
          const chunkBuffer = await fsPromises.readFile(chunkPath);
          chunkBuffers.push(chunkBuffer);
          totalSize += chunkBuffer.length;
          console.log(`Chunk ${i + 1} size: ${chunkBuffer.length} bytes`);
        } catch (error) {
          console.error(`Error reading chunk ${i + 1}:`, error);
          throw error;
        }
      }

      // Write all chunks to final file
      for (let i = 0; i < chunkBuffers.length; i++) {
        await new Promise((resolve, reject) => {
          writeStream.write(chunkBuffers[i], (error) => {
            if (error) {
              console.error(`Error writing chunk ${i + 1}:`, error);
              reject(error);
            } else {
              console.log(`Successfully wrote chunk ${i + 1}`);
              resolve();
            }
          });
        });
      }

      // Close the write stream
      await new Promise((resolve, reject) => {
        writeStream.end((error) => {
          if (error) {
            console.error('Error closing write stream:', error);
            reject(error);
          } else {
            console.log('Successfully closed write stream');
            resolve();
          }
        });
      });

      // Clean up chunk files
      for (let i = 0; i < totalChunksNum; i++) {
        const chunkPath = path.join(chunksDir, `${filename}.part${i}`);
        await fsPromises.unlink(chunkPath).catch(console.error);
        console.log(`Deleted chunk file: ${chunkPath}`);
      }

      // Verify the final file size
      const stats = await fsPromises.stat(finalPath);
      console.log('Final file stats:', {
        expectedSize: parseInt(fileSize),
        actualSize: stats.size,
        totalChunkSize: totalSize
      });

      if (stats.size !== parseInt(fileSize)) {
        throw new Error(`File size mismatch after combining chunks. Expected ${fileSize}, got ${stats.size}`);
      }

      try {
        console.log('Processing complete file...');
        // Process the complete file
        const fileBuffer = await fsPromises.readFile(finalPath);
        const finalFilename = `${Date.now()}-${filename}`;
        const { thumbnail, medium, original, metadata } = await createResizedImages(fileBuffer);
        const thumbnailFilename = `thumb_${finalFilename}`;
        const mediumFilename = `medium_${finalFilename}`;

        console.log('Uploading files to storage...');
        // Upload files to storage
        await Promise.all([
          storageService.uploadBuffer(original, accessCode, finalFilename),
          storageService.uploadBuffer(thumbnail, accessCode, thumbnailFilename),
          storageService.uploadBuffer(medium, accessCode, mediumFilename)
        ]);

        // Clean up temp file
        await fsPromises.unlink(finalPath);
        console.log('Cleaned up temporary files');

        console.log('Saving to database...');
        // Save to database
        await new Promise((resolve, reject) => {
          const exifData = JSON.stringify(metadata);
          db.run(
            'INSERT INTO photos (filename, thumbnail_filename, medium_filename, access_code, exif_data) VALUES (?, ?, ?, ?, ?)',
            [finalFilename, thumbnailFilename, mediumFilename, accessCode, exifData],
            function(err) {
              if (err) {
                console.error('Database error:', err);
                reject(err);
              } else {
                console.log('Successfully saved to database');
                resolve(this.lastID);
              }
            }
          );
        });

        console.log('Upload completed successfully');
        res.json({ message: 'File upload completed' });
      } catch (error) {
        console.error('Error processing complete file:', error);
        throw error;
      }
    } else {
      // Not the last chunk, just acknowledge receipt
      console.log(`Successfully received chunk ${currentChunk + 1}/${totalChunksNum}`);
      res.json({ message: 'Chunk received' });
    }
  } catch (error) {
    console.error('Error handling chunk:', error);
    res.status(500).json({ error: 'Failed to process chunk', details: error.message });
  }
});

// Legacy upload endpoint
router.post('/upload', verifyToken, upload.array('photos', 100), async (req, res) => {
  try {
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
        const fileBuffer = await fsPromises.readFile(file.path);
        const { thumbnail, medium, original, metadata } = await createResizedImages(fileBuffer);
        const thumbnailFilename = `thumb_${finalFilename}`;
        const mediumFilename = `medium_${finalFilename}`;

        console.log(`Processing file: ${finalFilename}`);
        console.log('Full metadata:', metadata);

        // Upload files to storage
        await Promise.all([
          storageService.uploadBuffer(original, accessCode, finalFilename),
          storageService.uploadBuffer(thumbnail, accessCode, thumbnailFilename),
          storageService.uploadBuffer(medium, accessCode, mediumFilename)
        ]);

        console.log(`Uploaded all versions of: ${finalFilename}`);
        
        // Clean up temp file
        await fsPromises.unlink(file.path).catch(err => {
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

    await Promise.all(insertPromises);
    console.log('All photos inserted into database');
    res.status(201).json({ message: 'Photos uploaded successfully', count: uploadedFiles.length });
  } catch (err) {
    console.error('Error uploading photos:', err);
    res.status(500).json({ error: 'Failed to upload photos', details: err.message });
  }
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

  // Allow admin or viewall roles to access any photos
  if (req.user.role !== 'admin' && req.user.role !== 'viewall' && req.user.code !== accessCode) {
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
      await Promise.all([
        storageService.deleteFile(row.access_code, row.filename),
        storageService.deleteFile(row.access_code, row.thumbnail_filename),
        storageService.deleteFile(row.access_code, row.medium_filename)
      ]);

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
      zlib: { level: 5 }
    });

    archive.on('warning', function(err) {
      if (err.code === 'ENOENT') {
        console.warn('Archive warning:', err);
      } else {
        throw err;
      }
    });

    archive.on('error', function(err) {
      console.error('Archive error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to create zip file' });
      }
    });

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename=photos-${accessCode}.zip`);

    archive.pipe(res);

    for (const photo of photos) {
      try {
        const signedUrl = await storageService.getFileUrl(accessCode, photo.filename);
        
        const response = await axios({
          method: 'get',
          url: signedUrl,
          responseType: 'stream'
        });

        archive.append(response.data, { name: photo.filename });
      } catch (error) {
        console.error(`Error adding file ${photo.filename} to archive:`, error);
      }
    }

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

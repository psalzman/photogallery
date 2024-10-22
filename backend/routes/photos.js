const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const db = require('../database');
const verifyToken = require('../middleware/verifyToken');

const tempUploadDir = path.join(__dirname, '..', 'temp_uploads');
fs.mkdirSync(tempUploadDir, { recursive: true });

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

// Create thumbnail
const createThumbnail = async (filePath, thumbnailPath) => {
  await sharp(filePath)
    .resize(500, 500, { fit: 'inside', withoutEnlargement: true })
    .toFile(thumbnailPath);
};

// Upload photos
router.post('/upload', verifyToken, (req, res) => {
  console.log('Upload route hit');
  console.log('Request body:', req.body);
  console.log('Request query:', req.query);
  
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

    console.log('Files uploaded successfully');
    const uploadedFiles = req.files;

    if (!uploadedFiles || uploadedFiles.length === 0) {
      console.error('No files uploaded');
      return res.status(400).json({ error: 'No files uploaded' });
    }

    console.log('Number of files uploaded:', uploadedFiles.length);

    const finalUploadDir = path.join(__dirname, '..', 'photo-uploads', accessCode);
    fs.mkdirSync(finalUploadDir, { recursive: true });

    const insertPromises = uploadedFiles.map(async (file) => {
      const finalFilename = `${Date.now()}-${file.originalname}`;
      const finalFilePath = path.join(finalUploadDir, finalFilename);
      const thumbnailFilename = `thumb_${finalFilename}`;
      const thumbnailPath = path.join(finalUploadDir, thumbnailFilename);

      await fs.promises.rename(file.path, finalFilePath);
      await createThumbnail(finalFilePath, thumbnailPath);

      return new Promise((resolve, reject) => {
        db.run('INSERT INTO photos (filename, thumbnail_filename, access_code) VALUES (?, ?, ?)',
          [finalFilename, thumbnailFilename, accessCode],
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
    });

    try {
      await Promise.all(insertPromises);
      console.log('All photos inserted into database');
      res.status(201).json({ message: 'Photos uploaded successfully', count: uploadedFiles.length });
    } catch (err) {
      console.error('Error uploading photos:', err);
      res.status(500).json({ error: 'Failed to upload photos' });
    }
  });
});

// Get photos for a specific access code
router.get('/:accessCode', verifyToken, (req, res) => {
  const accessCode = req.params.accessCode;

  db.all('SELECT * FROM photos WHERE access_code = ?', [accessCode], (err, rows) => {
    if (err) {
      console.error('Error fetching photos:', err);
      return res.status(500).json({ error: 'Failed to fetch photos' });
    }
    res.json({ photos: rows });
  });
});

// Delete a photo
router.delete('/:id', verifyToken, (req, res) => {
  const photoId = req.params.id;

  db.get('SELECT filename, thumbnail_filename, access_code FROM photos WHERE id = ?', [photoId], (err, row) => {
    if (err) {
      console.error('Error fetching photo:', err);
      return res.status(500).json({ error: 'Failed to fetch photo information' });
    }

    if (!row) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    const filePath = path.join(__dirname, '..', 'photo-uploads', row.access_code, row.filename);
    const thumbnailPath = path.join(__dirname, '..', 'photo-uploads', row.access_code, row.thumbnail_filename);

    fs.unlink(filePath, (unlinkErr) => {
      if (unlinkErr) {
        console.error('Error deleting file:', unlinkErr);
        return res.status(500).json({ error: 'Failed to delete photo file' });
      }

      fs.unlink(thumbnailPath, (unlinkThumbErr) => {
        if (unlinkThumbErr) {
          console.error('Error deleting thumbnail:', unlinkThumbErr);
        }

        db.run('DELETE FROM photos WHERE id = ?', [photoId], function(deleteErr) {
          if (deleteErr) {
            console.error('Error deleting photo from database:', deleteErr);
            return res.status(500).json({ error: 'Failed to delete photo from database' });
          }

          res.json({ message: 'Photo deleted successfully' });
        });
      });
    });
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

module.exports = router;

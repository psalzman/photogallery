const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const authRoutes = require('./routes/auth');
const accessCodeRoutes = require('./routes/accessCodes');
const photoRoutes = require('./routes/photos');
const printSelectionRoutes = require('./routes/printSelections');

const app = express();
const port = 5001;

app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const accessCode = req.body.accessCode;
    const dir = `./photo-uploads/${accessCode}`;
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/access-codes', accessCodeRoutes);
app.use('/api/photos', photoRoutes);
app.use('/api/print-selections', printSelectionRoutes);

// Serve uploaded photos
app.use('/photo-uploads', express.static('photo-uploads'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

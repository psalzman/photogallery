const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const path = require('path');
const authRoutes = require('./routes/auth');
const accessCodeRoutes = require('./routes/accessCodes');
const photoRoutes = require('./routes/photos');
const printSelectionRoutes = require('./routes/printSelections');
const db = require('./database');
const setupAdminAccount = require('./setupAdminAccount');
const verifyToken = require('./middleware/verifyToken');

const app = express();
const port = 5001;

// Security middleware
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: [
    'http://localhost:3000',  // Development
    'http://localhost:8080',  // Production local
    'https://dressphotos.devstack.one',  // Production domain
    'http://dressphotos.devstack.one'    // Production domain (non-https)
  ],
  optionsSuccessStatus: 200,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
};

app.use(cors(corsOptions));

// Request logging
app.use(morgan('combined'));

// Compression middleware
app.use(compression());

// Body parsing middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/access-codes', accessCodeRoutes);
app.use('/api/photos', photoRoutes);
app.use('/api/print-selections', printSelectionRoutes);

// Serve photo uploads with authentication
app.use('/photo-uploads/:accessCode', verifyToken, (req, res, next) => {
  const accessCode = req.params.accessCode;
  // Check if user has access to these photos
  if (req.user.role !== 'admin' && req.user.role !== 'viewall' && req.user.code !== accessCode) {
    return res.status(403).json({ error: 'Access denied' });
  }
  next();
}, express.static(path.join(__dirname, 'photo-uploads')));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

// Ensure database connection is established before running setup
db.serialize(() => {
  console.log('Database setup complete');
  // Run the admin account setup
  setupAdminAccount();
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log('CORS configuration:', corsOptions);
});

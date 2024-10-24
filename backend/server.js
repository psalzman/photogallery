const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const accessCodeRoutes = require('./routes/accessCodes');
const photoRoutes = require('./routes/photos');
const printSelectionRoutes = require('./routes/printSelections');
const db = require('./database');
const setupAdminAccount = require('./setupAdminAccount');

const app = express();
const port = 5001;

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
app.use(express.json());

// Log all incoming requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  console.log('Headers:', req.headers);
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/access-codes', accessCodeRoutes);
app.use('/api/photos', photoRoutes);
app.use('/api/print-selections', printSelectionRoutes);

app.use('/photo-uploads', express.static('photo-uploads'));

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

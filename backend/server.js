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
const { db, dbAsync } = require('./database');
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
morgan.token('request-id', (req) => req.requestId);
app.use(morgan(':request-id :remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"'));

// Add request ID middleware
app.use((req, res, next) => {
  req.requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  next();
});

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
  console.error(`[${req.requestId}] Error:`, err);
  res.status(500).json({ 
    error: 'Internal server error', 
    details: process.env.NODE_ENV === 'development' ? err.message : undefined,
    requestId: req.requestId
  });
});

// Initialize database and start server
const initializeServer = async () => {
  try {
    console.log('Initializing server...');
    
    // Wait for database to be ready
    await new Promise((resolve) => {
      db.on('open', () => {
        console.log('Database connection established');
        resolve();
      });
    });

    // Run the admin account setup
    await setupAdminAccount();
    console.log('Admin account setup complete');

    // Start the server
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
      console.log('CORS configuration:', corsOptions);
    });
  } catch (error) {
    console.error('Failed to initialize server:', error);
    process.exit(1);
  }
};

// Start the server
initializeServer().catch(error => {
  console.error('Server initialization failed:', error);
  process.exit(1);
});

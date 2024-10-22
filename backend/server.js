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
    'http://localhost:3000',  // Your frontend development server
    'http://photo.app.devstack.one:8080',  // Your production domain
    'https://yourdomain.com', // Secure version of your production domain
    // Add any other domains or IP addresses you want to allow here
  ],
  optionsSuccessStatus: 200 // For legacy browser support
};

app.use(cors(corsOptions));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/access-codes', accessCodeRoutes);
app.use('/api/photos', photoRoutes);
app.use('/api/print-selections', printSelectionRoutes);

app.use('/photo-uploads', express.static('photo-uploads'));

// Ensure database connection is established before running setup
db.serialize(() => {
  console.log('Database setup complete');
  // Run the admin account setup
  setupAdminAccount();
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

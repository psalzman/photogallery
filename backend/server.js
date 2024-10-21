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

app.use(cors());
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

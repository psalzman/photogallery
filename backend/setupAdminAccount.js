const db = require('./database');

const setupAdminAccount = () => {
  const adminAccessCode = 'smie32f';
  const adminEmail = 'admin@example.com';
  const adminFullName = 'Admin User';

  // Wait for tables to be created
  setTimeout(() => {
    db.get('SELECT * FROM access_codes WHERE code = ?', [adminAccessCode], (err, row) => {
      if (err) {
        console.error('Error checking for admin account:', err);
        return;
      }

      if (!row) {
        db.run(
          'INSERT INTO access_codes (email, full_name, code, role) VALUES (?, ?, ?, ?)',
          [adminEmail, adminFullName, adminAccessCode, 'admin'],
          (err) => {
            if (err) {
              console.error('Error creating admin account:', err);
            } else {
              console.log('Admin account created successfully');
            }
          }
        );
      } else {
        console.log('Admin account already exists');
      }
    });
  }, 1000); // Wait for 1 second to ensure tables are created
};

module.exports = setupAdminAccount;

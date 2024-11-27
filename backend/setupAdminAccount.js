const { dbAsync } = require('./database');

const setupAdminAccount = async () => {
  const adminAccessCode = 'smie32f';
  const adminEmail = 'admin@example.com';
  const adminFullName = 'Admin User';

  try {
    console.log('Checking for existing admin account...');
    const existingAdmin = await dbAsync.get(
      'SELECT * FROM access_codes WHERE code = ?',
      [adminAccessCode]
    );

    if (!existingAdmin) {
      console.log('Admin account not found, creating new admin account...');
      await dbAsync.run(
        'INSERT INTO access_codes (email, full_name, code, role) VALUES (?, ?, ?, ?)',
        [adminEmail, adminFullName, adminAccessCode, 'admin']
      );
      console.log('Admin account created successfully');
    } else {
      console.log('Admin account already exists');
    }
  } catch (error) {
    console.error('Error in admin account setup:', error);
    throw error; // Let the server initialization handle the error
  }
};

module.exports = setupAdminAccount;

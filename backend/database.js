const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'photoselect.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    createTables();
  }
});

function createTables() {
  db.run(`CREATE TABLE IF NOT EXISTS access_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL
  )`, (err) => {
    if (err) {
      console.error('Error creating access_codes table:', err.message);
    } else {
      console.log('access_codes table ready.');
      insertAdminAccessCode();
    }
  });

  db.run(`CREATE TABLE IF NOT EXISTS photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    access_code TEXT NOT NULL,
    selected_for_printing INTEGER DEFAULT 0,
    FOREIGN KEY (access_code) REFERENCES access_codes(code)
  )`, (err) => {
    if (err) {
      console.error('Error creating photos table:', err.message);
    } else {
      console.log('photos table ready.');
    }
  });

  db.run(`CREATE TABLE IF NOT EXISTS print_selections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    photo_id INTEGER NOT NULL,
    access_code TEXT NOT NULL,
    FOREIGN KEY (photo_id) REFERENCES photos(id),
    FOREIGN KEY (access_code) REFERENCES access_codes(code)
  )`, (err) => {
    if (err) {
      console.error('Error creating print_selections table:', err.message);
    } else {
      console.log('print_selections table ready.');
    }
  });
}

function insertAdminAccessCode() {
  const adminCode = 'smie32f';
  const adminEmail = 'admin@example.com';
  const adminName = 'Admin User';
  const adminRole = 'admin';

  db.get('SELECT * FROM access_codes WHERE code = ?', [adminCode], (err, row) => {
    if (err) {
      console.error('Error checking for admin access code:', err.message);
    } else if (!row) {
      db.run('INSERT INTO access_codes (email, full_name, code, role) VALUES (?, ?, ?, ?)',
        [adminEmail, adminName, adminCode, adminRole],
        (err) => {
          if (err) {
            console.error('Error inserting admin access code:', err.message);
          } else {
            console.log('Admin access code inserted successfully.');
          }
        }
      );
    } else {
      console.log('Admin access code already exists.');
    }
  });
}

module.exports = db;

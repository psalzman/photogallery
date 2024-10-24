const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'photoselect.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to the SQLite database.');
    db.serialize(() => {
      db.run(`CREATE TABLE IF NOT EXISTS access_codes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE,
        full_name TEXT,
        code TEXT UNIQUE,
        role TEXT
      )`, (err) => {
        if (err) {
          console.error('Error creating access_codes table:', err);
        } else {
          console.log('access_codes table created or already exists');
        }
      });

      // Add medium_filename column if it doesn't exist
      db.run(`PRAGMA table_info(photos)`, (err, rows) => {
        if (err) {
          console.error('Error checking photos table schema:', err);
          return;
        }
        
        db.run(`CREATE TABLE IF NOT EXISTS photos (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          filename TEXT,
          thumbnail_filename TEXT,
          medium_filename TEXT,
          access_code TEXT,
          selected_for_printing INTEGER DEFAULT 0,
          FOREIGN KEY (access_code) REFERENCES access_codes (code)
        )`, (err) => {
          if (err) {
            console.error('Error creating photos table:', err);
          } else {
            console.log('photos table created or already exists');
            // Add medium_filename column if it doesn't exist
            db.run(`ALTER TABLE photos ADD COLUMN medium_filename TEXT;`, (err) => {
              if (err && !err.message.includes('duplicate column')) {
                console.error('Error adding medium_filename column:', err);
              }
            });
          }
        });
      });

      db.run(`CREATE TABLE IF NOT EXISTS print_selections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        photo_id INTEGER,
        access_code TEXT,
        FOREIGN KEY (photo_id) REFERENCES photos (id),
        FOREIGN KEY (access_code) REFERENCES access_codes (code)
      )`, (err) => {
        if (err) {
          console.error('Error creating print_selections table:', err);
        } else {
          console.log('print_selections table created or already exists');
        }
      });
    });
  }
});

module.exports = db;

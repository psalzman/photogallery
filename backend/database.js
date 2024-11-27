const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'photoselect.db');

// Enable statement logging
sqlite3.verbose();

// Create database connection with extended timeout and better error handling
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
  if (err) {
    console.error('Error opening database:', err);
    process.exit(1); // Exit if we can't open the database
  } else {
    console.log('Connected to the SQLite database at:', dbPath);
    
    // Set busy timeout to 30 seconds
    db.configure('busyTimeout', 30000);

    db.serialize(() => {
      // Enable foreign keys
      db.run('PRAGMA foreign_keys = ON');
      
      // Create tables with better error handling
      const createTables = async () => {
        try {
          await new Promise((resolve, reject) => {
            db.run(`CREATE TABLE IF NOT EXISTS access_codes (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              email TEXT UNIQUE,
              full_name TEXT,
              code TEXT UNIQUE,
              role TEXT
            )`, (err) => {
              if (err) reject(err);
              else {
                console.log('access_codes table created or already exists');
                resolve();
              }
            });
          });

          await new Promise((resolve, reject) => {
            db.run(`CREATE TABLE IF NOT EXISTS photos (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              filename TEXT,
              thumbnail_filename TEXT,
              medium_filename TEXT,
              access_code TEXT,
              selected_for_printing INTEGER DEFAULT 0,
              exif_data TEXT,
              FOREIGN KEY (access_code) REFERENCES access_codes (code)
            )`, (err) => {
              if (err) reject(err);
              else {
                console.log('photos table created or already exists');
                resolve();
              }
            });
          });

          await new Promise((resolve, reject) => {
            db.run(`CREATE TABLE IF NOT EXISTS print_selections (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              photo_id INTEGER,
              access_code TEXT,
              FOREIGN KEY (photo_id) REFERENCES photos (id),
              FOREIGN KEY (access_code) REFERENCES access_codes (code)
            )`, (err) => {
              if (err) reject(err);
              else {
                console.log('print_selections table created or already exists');
                resolve();
              }
            });
          });

          // Add indexes for better query performance
          const indexes = [
            'CREATE INDEX IF NOT EXISTS idx_photos_access_code ON photos(access_code)',
            'CREATE INDEX IF NOT EXISTS idx_print_selections_photo_id ON print_selections(photo_id)',
            'CREATE INDEX IF NOT EXISTS idx_print_selections_access_code ON print_selections(access_code)'
          ];

          for (const index of indexes) {
            await new Promise((resolve, reject) => {
              db.run(index, (err) => {
                if (err) reject(err);
                else resolve();
              });
            });
          }

          console.log('Database initialization completed successfully');
        } catch (error) {
          console.error('Error initializing database:', error);
          process.exit(1);
        }
      };

      createTables();
    });
  }
});

// Add error handler for the connection
db.on('error', (err) => {
  console.error('Database error:', err);
});

// Wrap database methods in promises for better error handling
const dbAsync = {
  all: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      db.all(sql, params, (err, rows) => {
        const duration = Date.now() - startTime;
        console.log(`Query completed in ${duration}ms:`, sql);
        if (err) {
          console.error('Database query error:', err);
          reject(err);
        } else {
          console.log(`Returned ${rows.length} rows`);
          resolve(rows);
        }
      });
    });
  },
  
  get: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      db.get(sql, params, (err, row) => {
        const duration = Date.now() - startTime;
        console.log(`Query completed in ${duration}ms:`, sql);
        if (err) {
          console.error('Database query error:', err);
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  },
  
  run: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      db.run(sql, params, function(err) {
        const duration = Date.now() - startTime;
        console.log(`Query completed in ${duration}ms:`, sql);
        if (err) {
          console.error('Database query error:', err);
          reject(err);
        } else {
          resolve(this);
        }
      });
    });
  }
};

// Export both the raw db connection and the promise-wrapped version
module.exports = {
  db,
  dbAsync
};

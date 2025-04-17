const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

// Get the database path from environment variables or use default
const dbPath = process.env.DB_PATH || './database.sqlite';

// Create a new database instance
const db = new sqlite3.Database(path.resolve(dbPath), (err) => {
  if (err) {
    console.error('Could not connect to database', err);
  } else {
    console.log('Connected to SQLite database');
    
    // Initialize tables
    db.serialize(() => {
      // Create users table if it doesn't exist
      db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        google_maps_api_key TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`, (err) => {
        if (err) {
          console.error('Error creating users table', err);
        } else {
          console.log('Users table ready');
          
          // Check if users table has the google_maps_api_key column
          db.get("SELECT COUNT(*) as count FROM pragma_table_info('users') WHERE name='google_maps_api_key'", (err, row) => {
            if (err) {
              console.error('Error checking for google_maps_api_key column:', err);
              return;
            }

            if (row.count === 0) {
              // Add the google_maps_api_key column
              db.run("ALTER TABLE users ADD COLUMN google_maps_api_key TEXT", (err) => {
                if (err) {
                  console.error('Error adding google_maps_api_key column:', err);
                } else {
                  console.log('Added google_maps_api_key column to users table');
                }
              });
            }
          });
        }
      });

      // Create trips table if it doesn't exist
      db.run(`CREATE TABLE IF NOT EXISTS trips (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        is_public INTEGER DEFAULT 0,
        share_code TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`, (err) => {
        if (err) {
          console.error('Error creating trips table', err);
        } else {
          console.log('Trips table ready');
        }
      });

      // Create places table if it doesn't exist
      db.run(`CREATE TABLE IF NOT EXISTS places (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        trip_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        latitude REAL,
        longitude REAL,
        address TEXT,
        place_id TEXT,
        image_url TEXT,
        category TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE
      )`, (err) => {
        if (err) {
          console.error('Error creating places table', err);
        } else {
          console.log('Places table ready');
          
          // Check if places table has the category column
          db.get("SELECT COUNT(*) as count FROM pragma_table_info('places') WHERE name='category'", (err, row) => {
            if (err) {
              console.error('Error checking for category column:', err);
              return;
            }

            if (row.count === 0) {
              // Add the category column
              db.run("ALTER TABLE places ADD COLUMN category TEXT", (err) => {
                if (err) {
                  console.error('Error adding category column:', err);
                } else {
                  console.log('Added category column to places table');
                }
              });
            }
          });
        }
      });

      // Create itinerary items table if it doesn't exist
      db.run(`CREATE TABLE IF NOT EXISTS itinerary_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        trip_id INTEGER NOT NULL,
        place_id INTEGER,
        title TEXT NOT NULL,
        description TEXT,
        start_time DATETIME NOT NULL,
        end_time DATETIME NOT NULL,
        day_number INTEGER NOT NULL,
        order_index INTEGER NOT NULL,
        tags TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
        FOREIGN KEY (place_id) REFERENCES places(id) ON DELETE SET NULL
      )`, (err) => {
        if (err) {
          console.error('Error creating itinerary_items table', err);
        } else {
          console.log('Itinerary items table ready');
        }
      });
      
      // Check if itinerary_items table has the tags column
      db.get("SELECT COUNT(*) as count FROM pragma_table_info('itinerary_items') WHERE name='tags'", (err, row) => {
        if (err) {
          console.error('Error checking for tags column:', err);
          return;
        }
        
        if (row.count === 0) {
          // Add the tags column
          db.run("ALTER TABLE itinerary_items ADD COLUMN tags TEXT", (err) => {
            if (err) {
              console.error('Error adding tags column:', err);
            } else {
              console.log('Added tags column to itinerary_items table');
            }
          });
        }
      });
      
      // Check if trips table has the new columns
      db.get("PRAGMA table_info(trips)", (err, rows) => {
        if (err) {
          console.error('Error checking trips table structure:', err);
          return;
        }
        
        // Check if is_public column exists
        db.get("SELECT COUNT(*) as count FROM pragma_table_info('trips') WHERE name='is_public'", (err, row) => {
          if (err) {
            console.error('Error checking for is_public column:', err);
            return;
          }
          
          if (row.count === 0) {
            // Add the is_public column
            db.run("ALTER TABLE trips ADD COLUMN is_public INTEGER DEFAULT 0", (err) => {
              if (err) {
                console.error('Error adding is_public column:', err);
              } else {
                console.log('Added is_public column to trips table');
              }
            });
          }
        });
        
        // Check if share_code column exists
        db.get("SELECT COUNT(*) as count FROM pragma_table_info('trips') WHERE name='share_code'", (err, row) => {
          if (err) {
            console.error('Error checking for share_code column:', err);
            return;
          }
          
          if (row.count === 0) {
            // Add the share_code column
            db.run("ALTER TABLE trips ADD COLUMN share_code TEXT", (err) => {
              if (err) {
                console.error('Error adding share_code column:', err);
              } else {
                console.log('Added share_code column to trips table');
                
                // Add share_code to existing trips
                db.all("SELECT id FROM trips WHERE share_code IS NULL", (err, rows) => {
                  if (err) {
                    console.error('Error selecting trips without share_code:', err);
                    return;
                  }
                  
                  rows.forEach(row => {
                    const shareCode = generateShareCode();
                    db.run("UPDATE trips SET share_code = ? WHERE id = ?", [shareCode, row.id], (err) => {
                      if (err) {
                        console.error(`Error adding share_code to trip ${row.id}:`, err);
                      }
                    });
                  });
                });
              }
            });
          }
        });
      });
    });
  }
});

// Generate a random share code
function generateShareCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < 10; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

module.exports = db;
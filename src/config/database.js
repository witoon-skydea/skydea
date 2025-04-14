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
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`, (err) => {
        if (err) {
          console.error('Error creating users table', err);
        } else {
          console.log('Users table ready');
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
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE
      )`, (err) => {
        if (err) {
          console.error('Error creating places table', err);
        } else {
          console.log('Places table ready');
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
    });
  }
});

module.exports = db;
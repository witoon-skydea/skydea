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
    });
  }
});

module.exports = db;
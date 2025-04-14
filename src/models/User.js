const db = require('../config/database');
const bcrypt = require('bcrypt');

class User {
  /**
   * Create a new user
   * @param {Object} userData - User data (username, email, password)
   * @returns {Promise} - Resolves with the created user object or rejects with error
   */
  static async create(userData) {
    const { username, email, password } = userData;
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    return new Promise((resolve, reject) => {
      // Check if username or email already exists
      db.get(
        'SELECT * FROM users WHERE username = ? OR email = ?',
        [username, email],
        (err, user) => {
          if (err) {
            return reject(err);
          }
          
          if (user) {
            if (user.username === username) {
              return reject(new Error('Username already exists'));
            }
            if (user.email === email) {
              return reject(new Error('Email already exists'));
            }
          }
          
          // Insert the new user
          db.run(
            'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
            [username, email, hashedPassword],
            function(err) {
              if (err) {
                return reject(err);
              }
              
              // Get the newly created user
              db.get(
                'SELECT id, username, email, created_at, updated_at FROM users WHERE id = ?',
                [this.lastID],
                (err, user) => {
                  if (err) {
                    return reject(err);
                  }
                  resolve(user);
                }
              );
            }
          );
        }
      );
    });
  }
  
  /**
   * Find a user by ID
   * @param {number} id - User ID
   * @returns {Promise} - Resolves with the user object or null if not found
   */
  static findById(id) {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT id, username, email, created_at, updated_at FROM users WHERE id = ?',
        [id],
        (err, user) => {
          if (err) {
            return reject(err);
          }
          resolve(user || null);
        }
      );
    });
  }
  
  /**
   * Find a user by username
   * @param {string} username - Username
   * @returns {Promise} - Resolves with the user object or null if not found
   */
  static findByUsername(username) {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM users WHERE username = ?',
        [username],
        (err, user) => {
          if (err) {
            return reject(err);
          }
          resolve(user || null);
        }
      );
    });
  }
  
  /**
   * Find a user by email
   * @param {string} email - Email
   * @returns {Promise} - Resolves with the user object or null if not found
   */
  static findByEmail(email) {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM users WHERE email = ?',
        [email],
        (err, user) => {
          if (err) {
            return reject(err);
          }
          resolve(user || null);
        }
      );
    });
  }
  
  /**
   * Validate a user's credentials
   * @param {string} username - Username or email
   * @param {string} password - Password
   * @returns {Promise} - Resolves with the user object if valid or null if invalid
   */
  static async authenticate(username, password) {
    try {
      // Check if the input is an email or username
      const isEmail = username.includes('@');
      
      // Find the user by email or username
      const user = isEmail 
        ? await this.findByEmail(username)
        : await this.findByUsername(username);
      
      if (!user) {
        return null;
      }
      
      // Compare passwords
      const isPasswordValid = await bcrypt.compare(password, user.password);
      
      if (!isPasswordValid) {
        return null;
      }
      
      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = User;
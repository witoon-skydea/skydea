const db = require('../config/database');
const crypto = require('crypto');

class ApiKey {
  /**
   * Create a new API key for a user
   * @param {Object} data - API key data
   * @returns {Promise} - Resolves with the created API key object or rejects with error
   */
  static create(data) {
    const { user_id, description = null } = data;
    const api_key = this.generateApiKey();
    
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO api_keys (user_id, api_key, description) 
         VALUES (?, ?, ?)`,
        [user_id, api_key, description],
        function(err) {
          if (err) {
            console.error('Error creating API key:', err);
            return reject(err);
          }
          
          // Get the newly created API key
          db.get(
            'SELECT * FROM api_keys WHERE id = ?',
            [this.lastID],
            (err, apiKey) => {
              if (err) {
                console.error('Error retrieving API key:', err);
                return reject(err);
              }
              resolve(apiKey);
            }
          );
        }
      );
    });
  }

  /**
   * Find an API key by its token
   * @param {string} apiKey - API key token
   * @returns {Promise} - Resolves with the API key object or null if not found
   */
  static findByKey(apiKey) {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT ak.*, u.id as user_id, u.username, u.email 
         FROM api_keys ak
         JOIN users u ON ak.user_id = u.id
         WHERE ak.api_key = ? AND ak.is_active = 1`,
        [apiKey],
        (err, apiKeyObj) => {
          if (err) {
            console.error('Error finding API key:', err);
            return reject(err);
          }
          resolve(apiKeyObj || null);
        }
      );
    });
  }

  /**
   * Get all API keys for a user
   * @param {number} userId - User ID
   * @returns {Promise} - Resolves with array of API key objects
   */
  static findByUserId(userId) {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM api_keys WHERE user_id = ? ORDER BY created_at DESC',
        [userId],
        (err, apiKeys) => {
          if (err) {
            console.error('Error finding API keys for user:', err);
            return reject(err);
          }
          resolve(apiKeys || []);
        }
      );
    });
  }

  /**
   * Deactivate an API key
   * @param {number} id - API key ID
   * @returns {Promise} - Resolves with success boolean
   */
  static deactivate(id) {
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE api_keys SET is_active = 0, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [id],
        function(err) {
          if (err) {
            console.error('Error deactivating API key:', err);
            return reject(err);
          }
          
          resolve(this.changes > 0);
        }
      );
    });
  }

  /**
   * Delete an API key
   * @param {number} id - API key ID
   * @returns {Promise} - Resolves with success boolean
   */
  static delete(id) {
    return new Promise((resolve, reject) => {
      db.run(
        'DELETE FROM api_keys WHERE id = ?',
        [id],
        function(err) {
          if (err) {
            console.error('Error deleting API key:', err);
            return reject(err);
          }
          
          resolve(this.changes > 0);
        }
      );
    });
  }

  /**
   * Generate a random API key
   * @returns {string} - Random API key
   */
  static generateApiKey() {
    return crypto.randomBytes(24).toString('hex');
  }
}

module.exports = ApiKey;
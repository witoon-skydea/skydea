const db = require('../config/database');

class Trip {
  /**
   * Create a new trip
   * @param {Object} tripData - Trip data (user_id, title, description, start_date, end_date)
   * @returns {Promise} - Resolves with the created trip object or rejects with error
   */
  static create(tripData) {
    const { user_id, title, description, start_date, end_date, is_public = 0 } = tripData;
    
    // Generate a random share code
    const shareCode = generateShareCode();
    
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO trips (user_id, title, description, start_date, end_date, is_public, share_code) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [user_id, title, description, start_date, end_date, is_public, shareCode],
        function(err) {
          if (err) {
            console.error('Error creating trip:', err);
            return reject(err);
          }
          
          // Get the newly created trip
          db.get(
            'SELECT * FROM trips WHERE id = ?',
            [this.lastID],
            (err, trip) => {
              if (err) {
                console.error('Error retrieving trip:', err);
                return reject(err);
              }
              resolve(trip);
            }
          );
        }
      );
    });
  }

  /**
   * Find a trip by ID
   * @param {number} id - Trip ID
   * @returns {Promise} - Resolves with the trip object or null if not found
   */
  static findById(id) {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM trips WHERE id = ?',
        [id],
        (err, trip) => {
          if (err) {
            return reject(err);
          }
          resolve(trip || null);
        }
      );
    });
  }

  /**
   * Get all trips for a user
   * @param {number} userId - User ID
   * @returns {Promise} - Resolves with array of trip objects
   */
  static findByUserId(userId) {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM trips WHERE user_id = ? ORDER BY start_date DESC',
        [userId],
        (err, trips) => {
          if (err) {
            return reject(err);
          }
          resolve(trips || []);
        }
      );
    });
  }

  /**
   * Update a trip
   * @param {number} id - Trip ID
   * @param {Object} tripData - Trip data to update
   * @returns {Promise} - Resolves with the updated trip object
   */
  static update(id, tripData) {
    const { title, description, start_date, end_date, is_public } = tripData;
    
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE trips 
         SET title = ?, description = ?, start_date = ?, end_date = ?, is_public = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [title, description, start_date, end_date, is_public !== undefined ? is_public : 0, id],
        function(err) {
          if (err) {
            console.error('Error updating trip:', err);
            return reject(err);
          }
          
          if (this.changes === 0) {
            return reject(new Error('Trip not found or no changes made'));
          }
          
          // Get the updated trip
          db.get(
            'SELECT * FROM trips WHERE id = ?',
            [id],
            (err, trip) => {
              if (err) {
                console.error('Error retrieving updated trip:', err);
                return reject(err);
              }
              resolve(trip);
            }
          );
        }
      );
    });
  }

  /**
   * Delete a trip
   * @param {number} id - Trip ID
   * @returns {Promise} - Resolves with success boolean
   */
  static delete(id) {
    return new Promise((resolve, reject) => {
      db.run(
        'DELETE FROM trips WHERE id = ?',
        [id],
        function(err) {
          if (err) {
            console.error('Error deleting trip:', err);
            return reject(err);
          }
          
          resolve(this.changes > 0);
        }
      );
    });
  }
  
  /**
   * Check if a trip belongs to a user
   * @param {number} tripId - Trip ID
   * @param {number} userId - User ID
   * @returns {Promise} - Resolves with boolean
   */
  static belongsToUser(tripId, userId) {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT 1 FROM trips WHERE id = ? AND user_id = ?',
        [tripId, userId],
        (err, result) => {
          if (err) {
            return reject(err);
          }
          resolve(!!result);
        }
      );
    });
  }
  
  /**
   * Find a trip by share code
   * @param {string} shareCode - Share code
   * @returns {Promise} - Resolves with the trip object or null if not found
   */
  static findByShareCode(shareCode) {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM trips WHERE share_code = ?',
        [shareCode],
        (err, trip) => {
          if (err) {
            return reject(err);
          }
          resolve(trip || null);
        }
      );
    });
  }
  
  /**
   * Update the privacy setting of a trip
   * @param {number} id - Trip ID
   * @param {boolean} isPublic - Whether the trip is public
   * @returns {Promise} - Resolves with success boolean
   */
  static updatePrivacy(id, isPublic) {
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE trips 
         SET is_public = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [isPublic ? 1 : 0, id],
        function(err) {
          if (err) {
            console.error('Error updating trip privacy:', err);
            return reject(err);
          }
          
          resolve(this.changes > 0);
        }
      );
    });
  }
  
  /**
   * Regenerate a share code for a trip
   * @param {number} id - Trip ID
   * @returns {Promise} - Resolves with the new share code
   */
  static regenerateShareCode(id) {
    const shareCode = generateShareCode();
    
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE trips 
         SET share_code = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [shareCode, id],
        function(err) {
          if (err) {
            console.error('Error regenerating share code:', err);
            return reject(err);
          }
          
          if (this.changes === 0) {
            return reject(new Error('Trip not found'));
          }
          
          resolve(shareCode);
        }
      );
    });
  }
}

/**
 * Generate a random share code
 * @returns {string} - Random share code
 */
function generateShareCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < 10; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

module.exports = Trip;
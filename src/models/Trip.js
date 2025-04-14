const db = require('../config/database');

class Trip {
  /**
   * Create a new trip
   * @param {Object} tripData - Trip data (user_id, title, description, start_date, end_date)
   * @returns {Promise} - Resolves with the created trip object or rejects with error
   */
  static create(tripData) {
    const { user_id, title, description, start_date, end_date } = tripData;
    
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO trips (user_id, title, description, start_date, end_date) 
         VALUES (?, ?, ?, ?, ?)`,
        [user_id, title, description, start_date, end_date],
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
    const { title, description, start_date, end_date } = tripData;
    
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE trips 
         SET title = ?, description = ?, start_date = ?, end_date = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [title, description, start_date, end_date, id],
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
}

module.exports = Trip;
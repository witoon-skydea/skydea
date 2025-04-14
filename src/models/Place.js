const db = require('../config/database');

class Place {
  /**
   * Create a new place
   * @param {Object} placeData - Place data
   * @returns {Promise} - Resolves with the created place object or rejects with error
   */
  static create(placeData) {
    const { 
      trip_id, 
      name, 
      description = null, 
      latitude = null, 
      longitude = null, 
      address = null, 
      place_id = null, 
      image_url = null 
    } = placeData;
    
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO places (trip_id, name, description, latitude, longitude, address, place_id, image_url) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [trip_id, name, description, latitude, longitude, address, place_id, image_url],
        function(err) {
          if (err) {
            console.error('Error creating place:', err);
            return reject(err);
          }
          
          // Get the newly created place
          db.get(
            'SELECT * FROM places WHERE id = ?',
            [this.lastID],
            (err, place) => {
              if (err) {
                console.error('Error retrieving place:', err);
                return reject(err);
              }
              resolve(place);
            }
          );
        }
      );
    });
  }

  /**
   * Find a place by ID
   * @param {number} id - Place ID
   * @returns {Promise} - Resolves with the place object or null if not found
   */
  static findById(id) {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM places WHERE id = ?',
        [id],
        (err, place) => {
          if (err) {
            return reject(err);
          }
          resolve(place || null);
        }
      );
    });
  }

  /**
   * Get all places for a trip
   * @param {number} tripId - Trip ID
   * @returns {Promise} - Resolves with array of place objects
   */
  static findByTripId(tripId) {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM places WHERE trip_id = ? ORDER BY created_at ASC',
        [tripId],
        (err, places) => {
          if (err) {
            return reject(err);
          }
          resolve(places || []);
        }
      );
    });
  }

  /**
   * Update a place
   * @param {number} id - Place ID
   * @param {Object} placeData - Place data to update
   * @returns {Promise} - Resolves with the updated place object
   */
  static update(id, placeData) {
    const { 
      name, 
      description, 
      latitude, 
      longitude, 
      address, 
      place_id, 
      image_url 
    } = placeData;
    
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE places 
         SET name = ?, description = ?, latitude = ?, longitude = ?, 
         address = ?, place_id = ?, image_url = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [name, description, latitude, longitude, address, place_id, image_url, id],
        function(err) {
          if (err) {
            console.error('Error updating place:', err);
            return reject(err);
          }
          
          if (this.changes === 0) {
            return reject(new Error('Place not found or no changes made'));
          }
          
          // Get the updated place
          db.get(
            'SELECT * FROM places WHERE id = ?',
            [id],
            (err, place) => {
              if (err) {
                console.error('Error retrieving updated place:', err);
                return reject(err);
              }
              resolve(place);
            }
          );
        }
      );
    });
  }

  /**
   * Delete a place
   * @param {number} id - Place ID
   * @returns {Promise} - Resolves with success boolean
   */
  static delete(id) {
    return new Promise((resolve, reject) => {
      db.run(
        'DELETE FROM places WHERE id = ?',
        [id],
        function(err) {
          if (err) {
            console.error('Error deleting place:', err);
            return reject(err);
          }
          
          resolve(this.changes > 0);
        }
      );
    });
  }

  /**
   * Delete all places for a trip
   * @param {number} tripId - Trip ID
   * @returns {Promise} - Resolves with success boolean
   */
  static deleteByTripId(tripId) {
    return new Promise((resolve, reject) => {
      db.run(
        'DELETE FROM places WHERE trip_id = ?',
        [tripId],
        function(err) {
          if (err) {
            console.error('Error deleting places for trip:', err);
            return reject(err);
          }
          
          resolve(true);
        }
      );
    });
  }
}

module.exports = Place;
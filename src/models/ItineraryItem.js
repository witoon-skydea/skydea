const db = require('../config/database');

class ItineraryItem {
  /**
   * Create a new itinerary item
   * @param {Object} itemData - Itinerary item data
   * @returns {Promise} - Resolves with the created item object or rejects with error
   */
  static create(itemData) {
    const { 
      trip_id, 
      place_id = null, 
      title, 
      description = null, 
      start_time, 
      end_time, 
      day_number, 
      order_index,
      tags = null
    } = itemData;
    
    // Ensure place_id is properly handled
    const parsedPlaceId = place_id !== null && place_id !== "" ? parseInt(place_id) : null;
    
    // Convert tags array to JSON string if it's an array
    const tagsStr = Array.isArray(tags) ? JSON.stringify(tags) : tags;
    
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO itinerary_items (
          trip_id, place_id, title, description, start_time, end_time, day_number, order_index, tags
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [trip_id, parsedPlaceId, title, description, start_time, end_time, day_number, order_index, tagsStr],
        function(err) {
          if (err) {
            console.error('Error creating itinerary item:', err);
            return reject(err);
          }
          
          // Get the newly created itinerary item
          db.get(
            'SELECT * FROM itinerary_items WHERE id = ?',
            [this.lastID],
            (err, item) => {
              if (err) {
                console.error('Error retrieving itinerary item:', err);
                return reject(err);
              }
              resolve(item);
            }
          );
        }
      );
    });
  }

  /**
   * Find an itinerary item by ID
   * @param {number} id - Itinerary item ID
   * @returns {Promise} - Resolves with the item object or null if not found
   */
  static findById(id) {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT i.*, p.name AS place_name, p.latitude, p.longitude, p.address 
         FROM itinerary_items i
         LEFT JOIN places p ON i.place_id = p.id
         WHERE i.id = ?`,
        [id],
        (err, item) => {
          if (err) {
            return reject(err);
          }
          resolve(item || null);
        }
      );
    });
  }

  /**
   * Get all itinerary items for a trip
   * @param {number} tripId - Trip ID
   * @returns {Promise} - Resolves with array of item objects
   */
  static findByTripId(tripId) {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT i.*, p.name AS place_name, p.latitude, p.longitude, p.address 
         FROM itinerary_items i
         LEFT JOIN places p ON i.place_id = p.id
         WHERE i.trip_id = ? 
         ORDER BY i.day_number ASC, i.order_index ASC`,
        [tripId],
        (err, items) => {
          if (err) {
            return reject(err);
          }
          resolve(items || []);
        }
      );
    });
  }

  /**
   * Get all itinerary items for a specific day of a trip
   * @param {number} tripId - Trip ID
   * @param {number} dayNumber - Day number
   * @returns {Promise} - Resolves with array of item objects
   */
  static findByTripAndDay(tripId, dayNumber) {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT i.*, p.name AS place_name, p.latitude, p.longitude, p.address 
         FROM itinerary_items i
         LEFT JOIN places p ON i.place_id = p.id
         WHERE i.trip_id = ? AND i.day_number = ? 
         ORDER BY i.order_index ASC`,
        [tripId, dayNumber],
        (err, items) => {
          if (err) {
            return reject(err);
          }
          resolve(items || []);
        }
      );
    });
  }

  /**
   * Update an itinerary item
   * @param {number} id - Itinerary item ID
   * @param {Object} itemData - Itinerary item data to update
   * @returns {Promise} - Resolves with the updated item object
   */
  static update(id, itemData) {
    const { 
      place_id,
      title, 
      description, 
      start_time, 
      end_time, 
      day_number, 
      order_index,
      tags
    } = itemData;
    
    // Ensure place_id is properly handled
    const parsedPlaceId = place_id !== null && place_id !== "" ? parseInt(place_id) : null;
    
    // Convert tags array to JSON string if it's an array
    const tagsStr = Array.isArray(tags) ? JSON.stringify(tags) : tags;
    
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE itinerary_items 
         SET place_id = ?, title = ?, description = ?, start_time = ?, end_time = ?, 
         day_number = ?, order_index = ?, tags = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [parsedPlaceId, title, description, start_time, end_time, day_number, order_index, tagsStr, id],
        function(err) {
          if (err) {
            console.error('Error updating itinerary item:', err);
            return reject(err);
          }
          
          if (this.changes === 0) {
            return reject(new Error('Itinerary item not found or no changes made'));
          }
          
          // Get the updated itinerary item
          db.get(
            `SELECT i.*, p.name AS place_name, p.latitude, p.longitude, p.address 
             FROM itinerary_items i
             LEFT JOIN places p ON i.place_id = p.id
             WHERE i.id = ?`,
            [id],
            (err, item) => {
              if (err) {
                console.error('Error retrieving updated itinerary item:', err);
                return reject(err);
              }
              resolve(item);
            }
          );
        }
      );
    });
  }

  /**
   * Update order index of multiple itinerary items (for drag-and-drop reordering)
   * @param {Array} items - Array of objects with id and order_index
   * @returns {Promise} - Resolves with success boolean
   */
  static updateOrder(items) {
    return new Promise((resolve, reject) => {
      // Create a transaction
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        let success = true;
        let completed = 0;
        
        items.forEach(item => {
          db.run(
            'UPDATE itinerary_items SET order_index = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [item.order_index, item.id],
            function(err) {
              if (err) {
                console.error('Error updating itinerary item order:', err);
                success = false;
              }
              
              completed++;
              
              if (completed === items.length) {
                if (success) {
                  db.run('COMMIT', err => {
                    if (err) {
                      console.error('Error committing transaction:', err);
                      db.run('ROLLBACK');
                      return reject(err);
                    }
                    resolve(true);
                  });
                } else {
                  db.run('ROLLBACK');
                  reject(new Error('Failed to update one or more items'));
                }
              }
            }
          );
        });
      });
    });
  }
  
  /**
   * Move an itinerary item from one day to another
   * @param {number} itemId - Itinerary item ID
   * @param {number} newDayNumber - New day number
   * @param {number} newOrderIndex - New order index in the target day
   * @returns {Promise} - Resolves with the updated item
   */
  static moveToDay(itemId, newDayNumber, newOrderIndex) {
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE itinerary_items 
         SET day_number = ?, order_index = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [newDayNumber, newOrderIndex, itemId],
        function(err) {
          if (err) {
            console.error('Error moving itinerary item to different day:', err);
            return reject(err);
          }
          
          if (this.changes === 0) {
            return reject(new Error('Itinerary item not found or no changes made'));
          }
          
          // Get the updated itinerary item
          db.get(
            `SELECT i.*, p.name AS place_name, p.latitude, p.longitude, p.address 
             FROM itinerary_items i
             LEFT JOIN places p ON i.place_id = p.id
             WHERE i.id = ?`,
            [itemId],
            (err, item) => {
              if (err) {
                console.error('Error retrieving updated itinerary item:', err);
                return reject(err);
              }
              resolve(item);
            }
          );
        }
      );
    });
  }

  /**
   * Delete an itinerary item
   * @param {number} id - Itinerary item ID
   * @returns {Promise} - Resolves with success boolean
   */
  static delete(id) {
    return new Promise((resolve, reject) => {
      db.run(
        'DELETE FROM itinerary_items WHERE id = ?',
        [id],
        function(err) {
          if (err) {
            console.error('Error deleting itinerary item:', err);
            return reject(err);
          }
          
          resolve(this.changes > 0);
        }
      );
    });
  }

  /**
   * Delete all itinerary items for a trip
   * @param {number} tripId - Trip ID
   * @returns {Promise} - Resolves with success boolean
   */
  static deleteByTripId(tripId) {
    return new Promise((resolve, reject) => {
      db.run(
        'DELETE FROM itinerary_items WHERE trip_id = ?',
        [tripId],
        function(err) {
          if (err) {
            console.error('Error deleting itinerary items for trip:', err);
            return reject(err);
          }
          
          resolve(true);
        }
      );
    });
  }
}

module.exports = ItineraryItem;
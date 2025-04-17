const User = require('../models/User');
const appConfig = require('../config/app');

/**
 * Show the user profile page
 */
exports.showProfile = (req, res) => {
  res.render('profile', {
    title: 'My Profile - Skydea',
    basePath: appConfig.appBasePath,
    user: req.session.user,
    error: req.session.error,
    success: req.session.success
  });
  
  // Clear session messages
  delete req.session.error;
  delete req.session.success;
};

/**
 * Update Google Maps API key
 */
exports.updateApiKey = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { googleMapsApiKey } = req.body;
    
    // Update user with new API key
    const updatedUser = await updateUserApiKey(userId, googleMapsApiKey);
    
    // Update session with new user data
    req.session.user = updatedUser;
    
    // Set success message
    req.session.success = 'Google Maps API Key updated successfully!';
    
    res.redirect('/profile');
  } catch (error) {
    console.error('Error updating API key:', error);
    req.session.error = 'An error occurred while updating your API key';
    res.redirect('/profile');
  }
};

/**
 * Helper function to update user's Google Maps API key
 */
async function updateUserApiKey(userId, apiKey) {
  return new Promise((resolve, reject) => {
    const query = 'UPDATE users SET google_maps_api_key = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    const params = [apiKey || null, userId];
    
    require('../config/database').run(query, params, function(err) {
      if (err) {
        console.error('Database error when updating API key:', err);
        return reject(err);
      }
      
      if (this.changes === 0) {
        return reject(new Error('User not found'));
      }
      
      // Get updated user data
      require('../config/database').get(
        'SELECT id, username, email, google_maps_api_key, created_at, updated_at FROM users WHERE id = ?',
        [userId],
        (err, user) => {
          if (err) {
            console.error('Error retrieving updated user:', err);
            return reject(err);
          }
          
          if (!user) {
            return reject(new Error('User not found after update'));
          }
          
          resolve(user);
        }
      );
    });
  });
}
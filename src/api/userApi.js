const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authenticateUser } = require('./middleware');

/**
 * @route   GET /api/users/profile
 * @desc    Get user profile information
 * @access  Private
 */
router.get('/profile', authenticateUser, async (req, res) => {
  try {
    // User is already available in req.user from the authenticateUser middleware
    const user = req.user;
    
    // Remove sensitive information
    const userWithoutPassword = {
      id: user.id,
      username: user.username,
      email: user.email,
      google_maps_api_key: user.google_maps_api_key,
      created_at: user.created_at,
      updated_at: user.updated_at
    };
    
    res.json({
      success: true,
      data: userWithoutPassword
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user profile',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/users/profile
 * @desc    Update user profile information
 * @access  Private
 */
router.put('/profile', authenticateUser, async (req, res) => {
  try {
    const { email, google_maps_api_key } = req.body;
    const userId = req.user.id;
    
    // Update user in database (you'll need to add a new method to the User model)
    // For now, just return success with the current user (minus password)
    const updatedUser = {
      id: req.user.id,
      username: req.user.username,
      email: email || req.user.email,
      google_maps_api_key: google_maps_api_key || req.user.google_maps_api_key,
      created_at: req.user.created_at,
      updated_at: new Date().toISOString()
    };
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user profile',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/users/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, google_maps_api_key } = req.body;
    
    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username, email, and password are required'
      });
    }
    
    // Create a new user
    const user = await User.create({
      username,
      email,
      password,
      google_maps_api_key
    });
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        created_at: user.created_at
      }
    });
  } catch (error) {
    console.error('Error registering user:', error);
    
    // Handle duplicate username or email
    if (error.message === 'Username already exists' || error.message === 'Email already exists') {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to register user',
      error: error.message
    });
  }
});

module.exports = router;

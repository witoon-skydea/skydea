const express = require('express');
const router = express.Router();
const Place = require('../models/Place');
const Trip = require('../models/Trip');
const { authenticateUser } = require('./middleware');

/**
 * Middleware to validate if a trip belongs to the current user
 */
const validateTripAccess = async (req, res, next) => {
  try {
    const tripId = req.body.trip_id || req.query.trip_id || req.params.tripId;
    
    if (!tripId) {
      return res.status(400).json({
        success: false,
        message: 'Trip ID is required'
      });
    }
    
    // Check if trip exists and belongs to user
    const belongsToUser = await Trip.belongsToUser(tripId, req.user.id);
    
    if (!belongsToUser) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You do not have permission to access this trip'
      });
    }
    
    next();
  } catch (error) {
    console.error('Error validating trip access:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * @route   GET /api/places/trip/:tripId
 * @desc    Get all places for a trip
 * @access  Private
 */
router.get('/trip/:tripId', authenticateUser, validateTripAccess, async (req, res) => {
  try {
    const places = await Place.findByTripId(req.params.tripId);
    
    res.json({
      success: true,
      count: places.length,
      data: places
    });
  } catch (error) {
    console.error('Error fetching places:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch places',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/places/:id
 * @desc    Get a single place by ID
 * @access  Private
 */
router.get('/:id', authenticateUser, async (req, res) => {
  try {
    const place = await Place.findById(req.params.id);
    
    if (!place) {
      return res.status(404).json({
        success: false,
        message: 'Place not found'
      });
    }
    
    // Check if the place's trip belongs to the user
    const tripBelongsToUser = await Trip.belongsToUser(place.trip_id, req.user.id);
    
    if (!tripBelongsToUser) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You do not have permission to access this place'
      });
    }
    
    res.json({
      success: true,
      data: place
    });
  } catch (error) {
    console.error('Error fetching place:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch place',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/places
 * @desc    Create a new place
 * @access  Private
 */
router.post('/', authenticateUser, validateTripAccess, async (req, res) => {
  try {
    const { 
      trip_id, 
      name, 
      description, 
      latitude, 
      longitude, 
      address, 
      place_id, 
      image_url,
      category 
    } = req.body;
    
    // Validate required fields
    if (!trip_id || !name) {
      return res.status(400).json({
        success: false,
        message: 'Trip ID and name are required'
      });
    }
    
    // Create a new place
    const place = await Place.create({
      trip_id,
      name,
      description,
      latitude,
      longitude,
      address,
      place_id,
      image_url,
      category
    });
    
    res.status(201).json({
      success: true,
      message: 'Place created successfully',
      data: place
    });
  } catch (error) {
    console.error('Error creating place:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create place',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/places/:id
 * @desc    Update a place
 * @access  Private
 */
router.put('/:id', authenticateUser, async (req, res) => {
  try {
    // Get the place to check ownership
    const place = await Place.findById(req.params.id);
    
    if (!place) {
      return res.status(404).json({
        success: false,
        message: 'Place not found'
      });
    }
    
    // Check if the place's trip belongs to the user
    const tripBelongsToUser = await Trip.belongsToUser(place.trip_id, req.user.id);
    
    if (!tripBelongsToUser) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You do not have permission to modify this place'
      });
    }
    
    const { 
      name, 
      description, 
      latitude, 
      longitude, 
      address, 
      place_id, 
      image_url,
      category 
    } = req.body;
    
    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Name is required'
      });
    }
    
    // Update the place
    const updatedPlace = await Place.update(req.params.id, {
      name,
      description,
      latitude,
      longitude,
      address,
      place_id,
      image_url,
      category
    });
    
    res.json({
      success: true,
      message: 'Place updated successfully',
      data: updatedPlace
    });
  } catch (error) {
    console.error('Error updating place:', error);
    
    if (error.message === 'Place not found or no changes made') {
      return res.status(404).json({
        success: false,
        message: 'Place not found or no changes made'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update place',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/places/:id
 * @desc    Delete a place
 * @access  Private
 */
router.delete('/:id', authenticateUser, async (req, res) => {
  try {
    // Get the place to check ownership
    const place = await Place.findById(req.params.id);
    
    if (!place) {
      return res.status(404).json({
        success: false,
        message: 'Place not found'
      });
    }
    
    // Check if the place's trip belongs to the user
    const tripBelongsToUser = await Trip.belongsToUser(place.trip_id, req.user.id);
    
    if (!tripBelongsToUser) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You do not have permission to delete this place'
      });
    }
    
    // Delete the place
    const success = await Place.delete(req.params.id);
    
    res.json({
      success: true,
      message: 'Place deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting place:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete place',
      error: error.message
    });
  }
});

module.exports = router;

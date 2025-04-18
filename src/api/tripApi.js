const express = require('express');
const router = express.Router();
const Trip = require('../models/Trip');
const { authenticateUser, validateTripOwnership } = require('./middleware');

/**
 * @route   GET /api/trips
 * @desc    Get all trips for the authenticated user
 * @access  Private
 */
router.get('/', authenticateUser, async (req, res) => {
  try {
    const trips = await Trip.findByUserId(req.user.id);
    
    res.json({
      success: true,
      count: trips.length,
      data: trips
    });
  } catch (error) {
    console.error('Error fetching trips:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trips',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/trips/:id
 * @desc    Get a single trip by ID
 * @access  Private or Shared with code
 */
router.get('/:id', authenticateUser, validateTripOwnership, async (req, res) => {
  try {
    const tripId = req.params.id;
    const trip = await Trip.findById(tripId);
    
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }
    
    // Check if this is a shared view
    const isShared = req.query.share && req.query.share === trip.share_code;
    const isOwner = req.user && req.user.id && (req.user.id === trip.user_id);
    
    // Add places and itinerary items to the response
    const Place = require('../models/Place');
    const ItineraryItem = require('../models/ItineraryItem');
    
    const places = await Place.findByTripId(tripId);
    const itineraryItems = await ItineraryItem.findByTripId(tripId);
    
    // Add isOwner flag to the trip data
    trip.isOwner = isOwner;
    
    res.json({
      success: true,
      trip: trip,
      places: places,
      itineraryItems: itineraryItems
    });
  } catch (error) {
    console.error('Error fetching trip:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trip',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/trips
 * @desc    Create a new trip
 * @access  Private
 */
router.post('/', authenticateUser, async (req, res) => {
  try {
    const { title, description, start_date, end_date, is_public } = req.body;
    
    // Validate required fields
    if (!title || !start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: 'Title, start date, and end date are required'
      });
    }
    
    // Create a new trip
    const trip = await Trip.create({
      user_id: req.user.id,
      title,
      description,
      start_date,
      end_date,
      is_public: is_public ? 1 : 0
    });
    
    res.status(201).json({
      success: true,
      message: 'Trip created successfully',
      data: trip
    });
  } catch (error) {
    console.error('Error creating trip:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create trip',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/trips/:id
 * @desc    Update a trip
 * @access  Private
 */
router.put('/:id', authenticateUser, validateTripOwnership, async (req, res) => {
  try {
    const { title, description, start_date, end_date, is_public } = req.body;
    
    // Validate required fields
    if (!title || !start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: 'Title, start date, and end date are required'
      });
    }
    
    // Update the trip
    const trip = await Trip.update(req.params.id, {
      title,
      description,
      start_date,
      end_date,
      is_public: is_public ? 1 : 0
    });
    
    res.json({
      success: true,
      message: 'Trip updated successfully',
      data: trip
    });
  } catch (error) {
    console.error('Error updating trip:', error);
    
    if (error.message === 'Trip not found or no changes made') {
      return res.status(404).json({
        success: false,
        message: 'Trip not found or no changes made'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update trip',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/trips/:id
 * @desc    Delete a trip
 * @access  Private
 */
router.delete('/:id', authenticateUser, validateTripOwnership, async (req, res) => {
  try {
    // Delete the trip
    const success = await Trip.delete(req.params.id);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Trip deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting trip:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete trip',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/trips/share/:shareCode
 * @desc    Get a trip by share code (public access)
 * @access  Public
 */
router.get('/share/:shareCode', async (req, res) => {
  try {
    const trip = await Trip.findByShareCode(req.params.shareCode);
    
    if (!trip || !trip.is_public) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found or not public'
      });
    }
    
    res.json({
      success: true,
      data: trip
    });
  } catch (error) {
    console.error('Error fetching shared trip:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch shared trip',
      error: error.message
    });
  }
});

module.exports = router;

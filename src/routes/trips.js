const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middlewares/auth');
const { validateTripData } = require('../middlewares/validation');
const { AppError } = require('../middlewares/errorHandler');
const appConfig = require('../config/app');
const Trip = require('../models/Trip');
const Place = require('../models/Place');
const ItineraryItem = require('../models/ItineraryItem');

// Middleware to check trip ownership
const checkTripOwnership = async (req, res, next) => {
  try {
    const tripId = parseInt(req.params.id);
    const userId = req.session.user.id;
    
    const belongs = await Trip.belongsToUser(tripId, userId);
    if (!belongs) {
      return res.status(403).json({ error: 'You do not have permission to access this trip' });
    }
    
    next();
  } catch (error) {
    console.error('Error checking trip ownership:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all trips for the logged-in user
router.get('/', isAuthenticated, async (req, res, next) => {
  try {
    const trips = await Trip.findByUserId(req.session.user.id);
    res.json(trips);
  } catch (error) {
    next(new AppError(error.message || 'Failed to fetch trips', 500));
  }
});

// Create a new trip
router.post('/', isAuthenticated, validateTripData, async (req, res, next) => {
  try {
    const { title, description, start_date, end_date } = req.body;
    
    const tripData = {
      user_id: req.session.user.id,
      title,
      description: description || null,
      start_date,
      end_date
    };
    
    const trip = await Trip.create(tripData);
    res.status(201).json(trip);
  } catch (error) {
    next(new AppError(error.message || 'Failed to create trip', 500));
  }
});

// Get a specific trip
router.get('/:id', isAuthenticated, checkTripOwnership, async (req, res, next) => {
  try {
    const tripId = parseInt(req.params.id);
    const trip = await Trip.findById(tripId);
    
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }
    
    // Get places for this trip
    const places = await Place.findByTripId(tripId);
    
    // Get itinerary items for this trip
    const itineraryItems = await ItineraryItem.findByTripId(tripId);
    
    res.json({
      trip,
      places,
      itineraryItems
    });
  } catch (error) {
    next(new AppError(error.message || 'Failed to fetch trip details', 500));
  }
});

// Update a trip
router.put('/:id', isAuthenticated, checkTripOwnership, validateTripData, async (req, res, next) => {
  try {
    const tripId = parseInt(req.params.id);
    const { title, description, start_date, end_date } = req.body;
    
    const tripData = {
      title,
      description: description || null,
      start_date,
      end_date
    };
    
    const trip = await Trip.update(tripId, tripData);
    res.json(trip);
  } catch (error) {
    if (error.message === 'Trip not found or no changes made') {
      return next(new AppError('Trip not found', 404));
    }
    
    next(new AppError(error.message || 'Failed to update trip', 500));
  }
});

// Delete a trip
router.delete('/:id', isAuthenticated, checkTripOwnership, async (req, res, next) => {
  try {
    const tripId = parseInt(req.params.id);
    
    // Delete all itinerary items associated with this trip
    await ItineraryItem.deleteByTripId(tripId);
    
    // Delete all places associated with this trip
    await Place.deleteByTripId(tripId);
    
    // Delete the trip
    const result = await Trip.delete(tripId);
    
    if (!result) {
      return res.status(404).json({ error: 'Trip not found' });
    }
    
    res.json({ success: true, message: 'Trip deleted successfully' });
  } catch (error) {
    next(new AppError(error.message || 'Failed to delete trip', 500));
  }
});

// Render trip planner page
router.get('/:id/planner', isAuthenticated, checkTripOwnership, async (req, res, next) => {
  try {
    const tripId = parseInt(req.params.id);
    const trip = await Trip.findById(tripId);
    
    if (!trip) {
      return res.status(404).render('error', {
        title: 'Trip Not Found',
        message: 'The requested trip could not be found',
        error: {},
        basePath: appConfig.appBasePath
      });
    }
    
    res.render('trips/planner', {
      title: `${trip.title} - Trip Planner`,
      trip,
      basePath: appConfig.appBasePath,
      googleMapsApiKey: appConfig.googleMaps.apiKey
    });
  } catch (error) {
    next(new AppError('Failed to load trip planner', 500));
  }
});

// Export the router
module.exports = router;
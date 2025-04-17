const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middlewares/auth');
const { validateTripData } = require('../middlewares/validation');
const { AppError } = require('../middlewares/errorHandler');
const appConfig = require('../config/app');
const Trip = require('../models/Trip');
const Place = require('../models/Place');
const ItineraryItem = require('../models/ItineraryItem');
const pdfController = require('../controllers/pdfController');

// Middleware to check trip ownership
const checkTripOwnership = async (req, res, next) => {
  try {
    const tripId = parseInt(req.params.id);
    const userId = req.session?.user?.id || null;
    
    // First, get the trip to check its privacy status
    const trip = await Trip.findById(tripId);
    
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }
    
    // Store the trip for later use in the route
    res.locals.trip = trip;
    
    // If the user is the owner, allow access
    if (userId && await Trip.belongsToUser(tripId, userId)) {
      res.locals.isOwner = true;
      return next();
    }
    
    // If the trip is public, allow access but mark as non-owner
    if (trip.is_public === 1) {
      res.locals.isOwner = false;
      return next();
    }
    
    // If the trip has a share code in the query, check it
    const shareCode = req.query.share;
    if (shareCode && trip.share_code === shareCode) {
      res.locals.isOwner = false;
      return next();
    }
    
    // If none of the above conditions are met, deny access
    return res.status(403).json({ error: 'You do not have permission to access this trip' });
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
    const { title, description, start_date, end_date, is_public } = req.body;
    
    const tripData = {
      user_id: req.session.user.id,
      title,
      description: description || null,
      start_date,
      end_date,
      is_public: is_public ? 1 : 0
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
    // Trip is already available in res.locals.trip from middleware
    const trip = res.locals.trip;
    const isOwner = res.locals.isOwner;
    const tripId = parseInt(req.params.id);
    
    // Add isOwner flag to the response
    trip.isOwner = isOwner;
    
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
    // Only allow updates if the user is the owner
    if (!res.locals.isOwner) {
      return res.status(403).json({ error: 'You do not have permission to update this trip' });
    }
    
    const tripId = parseInt(req.params.id);
    const { title, description, start_date, end_date, is_public } = req.body;
    
    const tripData = {
      title,
      description: description || null,
      start_date,
      end_date,
      is_public: is_public !== undefined ? (is_public ? 1 : 0) : res.locals.trip.is_public
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
router.get('/:id/planner', checkTripOwnership, async (req, res, next) => {
  try {
    // Trip is already available in res.locals.trip from middleware
    const trip = res.locals.trip;
    const isOwner = res.locals.isOwner;
    
    res.render('trips/planner', {
      title: `${trip.title} - Trip Planner`,
      trip,
      isOwner,
      basePath: appConfig.appBasePath,
      googleMapsApiKey: appConfig.googleMaps.apiKey,
      shareCode: trip.share_code,
      isPublic: trip.is_public === 1
    });
  } catch (error) {
    next(new AppError('Failed to load trip planner', 500));
  }
});

// Update trip privacy
router.put('/:id/privacy', isAuthenticated, checkTripOwnership, async (req, res, next) => {
  try {
    // Only allow updates if the user is the owner
    if (!res.locals.isOwner) {
      return res.status(403).json({ error: 'You do not have permission to update this trip' });
    }
    
    const tripId = parseInt(req.params.id);
    const { is_public } = req.body;
    
    if (is_public === undefined) {
      return res.status(400).json({ error: 'is_public field is required' });
    }
    
    const success = await Trip.updatePrivacy(tripId, is_public);
    
    if (!success) {
      return res.status(404).json({ error: 'Trip not found' });
    }
    
    res.json({ success: true, is_public });
  } catch (error) {
    console.error('Error updating trip privacy:', error);
    next(new AppError(error.message || 'Failed to update trip privacy', 500));
  }
});

// Regenerate share code
router.post('/:id/share-code', isAuthenticated, checkTripOwnership, async (req, res, next) => {
  try {
    // Only allow updates if the user is the owner
    if (!res.locals.isOwner) {
      return res.status(403).json({ error: 'You do not have permission to update this trip' });
    }
    
    const tripId = parseInt(req.params.id);
    
    const shareCode = await Trip.regenerateShareCode(tripId);
    
    res.json({ success: true, share_code: shareCode });
  } catch (error) {
    console.error('Error regenerating share code:', error);
    next(new AppError(error.message || 'Failed to regenerate share code', 500));
  }
});

// Get share link
router.get('/:id/share', isAuthenticated, checkTripOwnership, async (req, res, next) => {
  try {
    // Only allow if the user is the owner
    if (!res.locals.isOwner) {
      return res.status(403).json({ error: 'You do not have permission to share this trip' });
    }
    
    const tripId = parseInt(req.params.id);
    const trip = res.locals.trip;
    
    // Construct the share URL
    const shareUrl = `${req.protocol}://${req.get('host')}${appConfig.appBasePath}trips/${tripId}/planner?share=${trip.share_code}`;
    
    res.json({ 
      success: true, 
      share_url: shareUrl,
      share_code: trip.share_code,
      is_public: trip.is_public === 1
    });
  } catch (error) {
    console.error('Error getting share link:', error);
    next(new AppError(error.message || 'Failed to get share link', 500));
  }
});

// PDF preview page
router.get('/:id/pdf-preview', checkTripOwnership, async (req, res, next) => {
  try {
    // Trip is already available in res.locals.trip from middleware
    const trip = res.locals.trip;
    const isOwner = res.locals.isOwner;
    
    res.render('trips/pdf-preview', {
      title: `${trip.title} - Export PDF`,
      trip,
      isOwner,
      basePath: appConfig.appBasePath
    });
  } catch (error) {
    next(new AppError('Failed to load PDF preview', 500));
  }
});

// Export trip to PDF
router.get('/:id/export-pdf', checkTripOwnership, pdfController.exportTripToPdf);

// Export the router
module.exports = router;
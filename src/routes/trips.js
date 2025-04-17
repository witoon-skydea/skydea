const express = require('express');
const router = express.Router();
const { isAuthenticated, isAuthenticatedOrShared } = require('../middlewares/auth');
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
    // Add debugging logs
    console.log('Checking trip ownership for trip ID:', req.params.id);
    console.log('User session:', req.session?.user ? 'Present' : 'Not present');
    
    const tripId = parseInt(req.params.id);
    const userId = req.session?.user?.id || null;
    
    // First, get the trip to check its privacy status
    const trip = await Trip.findById(tripId);
    
    if (!trip) {
      console.error(`Trip with ID ${tripId} not found`);
      // For web routes, render the error page
      if (!req.isApiRequest && !req.path.includes('/api/')) {
        return res.status(404).render('error', {
          title: 'Trip Not Found',
          message: 'The trip you are looking for does not exist',
          error: {},
          basePath: appConfig.appBasePath
        });
      }
      return res.status(404).json({ error: 'Trip not found' });
    }
    
    console.log(`Trip with ID ${tripId} found:`, {
      is_public: trip.is_public,
      user_id: trip.user_id,
      title: trip.title
    });
    
    // Store the trip for later use in the route
    res.locals.trip = trip;
    
    // If the user is the owner, allow access
    if (userId && await Trip.belongsToUser(tripId, userId)) {
      console.log(`User ${userId} is the owner of trip ${tripId}`);
      res.locals.isOwner = true;
      return next();
    }
    
    // If the trip is public, allow access but mark as non-owner
    if (trip.is_public === 1) {
      console.log(`Trip ${tripId} is public, allowing access`);
      res.locals.isOwner = false;
      return next();
    }
    
    // If the trip has a share code in the query, check it
    const shareCode = req.query.share;
    if (shareCode && trip.share_code === shareCode) {
      console.log(`Access granted to trip ${tripId} via share code`);
      res.locals.isOwner = false;
      return next();
    }
    
    // DEBUG: For development only - allow access to any trip
    if (appConfig.nodeEnv === 'development') {
      console.log('DEBUG MODE: Allowing access to trip without authentication in development mode');
      res.locals.isOwner = false;
      return next();
    }
    
    // If none of the above conditions are met, deny access
    console.log(`Access denied to trip ${tripId}`);
    
    // For web routes, render a proper error page
    if (!req.isApiRequest && !req.path.includes('/api/')) {
      return res.status(403).render('error', {
        title: 'Access Denied',
        message: 'You do not have permission to access this trip',
        error: {},
        basePath: appConfig.appBasePath
      });
    }
    
    return res.status(403).json({ error: 'You do not have permission to access this trip' });
  } catch (error) {
    console.error('Error checking trip ownership:', error);
    
    // For web routes, render a proper error page
    if (!req.isApiRequest && !req.path.includes('/api/')) {
      return res.status(500).render('error', {
        title: 'Server Error',
        message: 'An error occurred while processing your request',
        error: {},
        basePath: appConfig.appBasePath
      });
    }
    
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
router.get('/:id', checkTripOwnership, async (req, res, next) => {
  try {
    console.log(`Fetching trip details for ID ${req.params.id}`);
    
    // Trip is already available in res.locals.trip from middleware
    const trip = res.locals.trip;
    const isOwner = res.locals.isOwner;
    const tripId = parseInt(req.params.id);
    
    // Add isOwner flag to the response
    trip.isOwner = isOwner;
    
    // Get places for this trip
    console.log(`Fetching places for trip ID ${tripId}`);
    const places = await Place.findByTripId(tripId);
    console.log(`Found ${places.length} places for trip ID ${tripId}`);
    
    // Get itinerary items for this trip
    console.log(`Fetching itinerary items for trip ID ${tripId}`);
    const itineraryItems = await ItineraryItem.findByTripId(tripId);
    console.log(`Found ${itineraryItems.length} itinerary items for trip ID ${tripId}`);
    
    const response = {
      trip,
      places,
      itineraryItems
    };
    
    console.log(`Successfully prepared trip data for ID ${tripId}`);
    res.json(response);
  } catch (error) {
    console.error(`Error fetching trip details for ID ${req.params.id}:`, error);
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
    console.log(`Rendering trip planner page for trip ID ${req.params.id}`);
    
    // Trip is already available in res.locals.trip from middleware
    const trip = res.locals.trip;
    const isOwner = res.locals.isOwner;
    
    // Get user-specific Google Maps API Key if user is authenticated
    let googleMapsApiKey = appConfig.googleMaps.apiKey;
    let isUsingCustomApiKey = false;
    
    if (req.session?.user?.google_maps_api_key) {
      googleMapsApiKey = req.session.user.google_maps_api_key;
      isUsingCustomApiKey = true;
    }
    
    // For development mode, set authentication to true if not set
    const isAuthenticated = appConfig.nodeEnv === 'development' 
      ? (req.session?.isAuthenticated || true)
      : (req.session?.isAuthenticated || false);
    
    console.log('Rendering with params:', {
      tripId: trip.id,
      tripTitle: trip.title,
      isOwner,
      isAuthenticated,
      basePath: appConfig.appBasePath
    });
    
    res.render('trips/planner', {
      title: `${trip.title} - Trip Planner`,
      trip,
      isOwner,
      isAuthenticated,
      basePath: appConfig.appBasePath,
      googleMapsApiKey: googleMapsApiKey,
      isUsingCustomApiKey: isUsingCustomApiKey,
      shareCode: trip.share_code,
      isPublic: trip.is_public === 1,
      layout: 'layouts/main',
      debugMode: appConfig.nodeEnv === 'development'
    });
  } catch (error) {
    console.error('Error rendering trip planner:', error);
    next(new AppError('Failed to load trip planner: ' + error.message, 500));
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
      basePath: appConfig.appBasePath,
      layout: 'layouts/main'
    });
  } catch (error) {
    next(new AppError('Failed to load PDF preview', 500));
  }
});

// Export trip to PDF
router.get('/:id/export-pdf', checkTripOwnership, pdfController.exportTripToPdf);

// Export the router
module.exports = router;
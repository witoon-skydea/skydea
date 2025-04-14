const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middlewares/auth');
const { validatePlaceData } = require('../middlewares/validation');
const { AppError } = require('../middlewares/errorHandler');
const Trip = require('../models/Trip');
const Place = require('../models/Place');
const https = require('https');

// Middleware to check trip ownership
const checkTripOwnership = async (req, res, next) => {
  try {
    // Get trip_id from the request body or params
    const tripId = parseInt(req.body.trip_id || req.params.tripId);
    const userId = req.session.user.id;
    
    const belongs = await Trip.belongsToUser(tripId, userId);
    if (!belongs) {
      return next(new AppError('You do not have permission to access this trip', 403));
    }
    
    next();
  } catch (error) {
    console.error('Error checking trip ownership:', error);
    next(new AppError('Internal server error', 500));
  }
};

// Middleware to check place ownership (via trip)
const checkPlaceOwnership = async (req, res, next) => {
  try {
    const placeId = parseInt(req.params.id);
    const userId = req.session.user.id;
    
    // Get the place to find the associated trip ID
    const place = await Place.findById(placeId);
    
    if (!place) {
      return next(new AppError('Place not found', 404));
    }
    
    // Check if the trip belongs to the user
    const belongs = await Trip.belongsToUser(place.trip_id, userId);
    if (!belongs) {
      return next(new AppError('You do not have permission to access this place', 403));
    }
    
    // Store the place in response locals for later use
    res.locals.place = place;
    next();
  } catch (error) {
    console.error('Error checking place ownership:', error);
    next(new AppError('Internal server error', 500));
  }
};

// Get all places for a trip
router.get('/trip/:tripId', isAuthenticated, checkTripOwnership, async (req, res, next) => {
  try {
    const tripId = parseInt(req.params.tripId);
    const places = await Place.findByTripId(tripId);
    res.json(places);
  } catch (error) {
    console.error('Error fetching places:', error);
    next(new AppError('Failed to fetch places', 500));
  }
});

// Search Google Places API proxy
router.get('/search', isAuthenticated, async (req, res, next) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    // This would be your actual Google Maps API Key
    const apiKey = process.env.GOOGLE_MAPS_API_KEY || 'YOUR_GOOGLE_MAPS_API_KEY';
    const encodedQuery = encodeURIComponent(query);
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodedQuery}&key=${apiKey}`;

    https.get(url, (response) => {
      let data = '';
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        try {
          const parsedData = JSON.parse(data);
          res.json(parsedData);
        } catch (error) {
          console.error('Error parsing Google Places API response:', error);
          res.status(500).json({ error: 'Failed to parse Google Places API response' });
        }
      });
    }).on('error', (error) => {
      console.error('Error calling Google Places API:', error);
      res.status(500).json({ error: 'Failed to call Google Places API' });
    });
  } catch (error) {
    console.error('Error in Google Places search:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get place details from Google Places API proxy
router.get('/details', isAuthenticated, async (req, res, next) => {
  try {
    const { placeId } = req.query;
    if (!placeId) {
      return res.status(400).json({ error: 'placeId parameter is required' });
    }

    // This would be your actual Google Maps API Key
    const apiKey = process.env.GOOGLE_MAPS_API_KEY || 'YOUR_GOOGLE_MAPS_API_KEY';
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,geometry,photos,rating,url&key=${apiKey}`;

    https.get(url, (response) => {
      let data = '';
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        try {
          const parsedData = JSON.parse(data);
          res.json(parsedData);
        } catch (error) {
          console.error('Error parsing Google Place Details API response:', error);
          res.status(500).json({ error: 'Failed to parse Google Place Details API response' });
        }
      });
    }).on('error', (error) => {
      console.error('Error calling Google Place Details API:', error);
      res.status(500).json({ error: 'Failed to call Google Place Details API' });
    });
  } catch (error) {
    console.error('Error in Google Place Details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new place
router.post('/', isAuthenticated, checkTripOwnership, validatePlaceData, async (req, res, next) => {
  try {
    const { 
      trip_id, 
      name, 
      description, 
      latitude, 
      longitude, 
      address, 
      place_id, 
      image_url 
    } = req.body;
    
    if (!trip_id) {
      throw new AppError('Trip ID is required', 400);
    }
    
    const placeData = {
      trip_id: parseInt(trip_id),
      name,
      description,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      address,
      place_id,
      image_url
    };
    
    const place = await Place.create(placeData);
    res.status(201).json(place);
  } catch (error) {
    console.error('Error creating place:', error);
    res.status(500).json({ error: 'Failed to create place' });
  }
});

// Get a specific place
router.get('/:id', isAuthenticated, checkPlaceOwnership, async (req, res, next) => {
  // The place is already retrieved in the middleware
  res.json(res.locals.place);
});

// Update a place
router.put('/:id', isAuthenticated, checkPlaceOwnership, validatePlaceData, async (req, res, next) => {
  try {
    const placeId = parseInt(req.params.id);
    const { 
      name, 
      description, 
      latitude, 
      longitude, 
      address, 
      place_id, 
      image_url 
    } = req.body;
    
    const placeData = {
      name,
      description,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      address,
      place_id,
      image_url
    };
    
    const place = await Place.update(placeId, placeData);
    res.json(place);
  } catch (error) {
    console.error('Error updating place:', error);
    
    if (error.message === 'Place not found or no changes made') {
      return res.status(404).json({ error: 'Place not found' });
    }
    
    res.status(500).json({ error: 'Failed to update place' });
  }
});

// Delete a place
router.delete('/:id', isAuthenticated, checkPlaceOwnership, async (req, res, next) => {
  try {
    const placeId = parseInt(req.params.id);
    const result = await Place.delete(placeId);
    
    if (!result) {
      return next(new AppError('Place not found', 404));
    }
    
    res.json({ success: true, message: 'Place deleted successfully' });
  } catch (error) {
    console.error('Error deleting place:', error);
    next(new AppError('Failed to delete place', 500));
  }
});

// Export the router
module.exports = router;
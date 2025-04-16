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
    
    if (!tripId || isNaN(tripId)) {
      console.error('Invalid trip ID:', req.body.trip_id || req.params.tripId);
      return next(new AppError('Invalid trip ID', 400));
    }
    
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
    
    // Request more fields, especially 'photos' to get photo references and types for categories
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,geometry,photos,rating,url,icon,types&key=${apiKey}`;
    
    console.log('Fetching place details from Google API:', url);

    https.get(url, (response) => {
      let data = '';
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        try {
          const parsedData = JSON.parse(data);
          
          // Process the photo reference if available and add a direct photo URL
          if (parsedData.result && parsedData.result.photos && parsedData.result.photos.length > 0) {
            const photoReference = parsedData.result.photos[0].photo_reference;
            if (photoReference) {
              // Add a direct URL to the photo using the Places Photo API
              parsedData.result.photo_url = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photoReference}&key=${apiKey}`;
              console.log('Added photo URL to place data:', parsedData.result.photo_url);
            }
          }
          
          // Process types to derive a category
          if (parsedData.result && parsedData.result.types && parsedData.result.types.length > 0) {
            // Map Google place types to our custom categories
            const typeToCategory = {
              'lodging': 'hotel',
              'hotel': 'hotel',
              'restaurant': 'restaurant',
              'food': 'restaurant',
              'cafe': 'restaurant',
              'bar': 'restaurant',
              'shopping_mall': 'shopping',
              'store': 'shopping',
              'museum': 'sight seeing',
              'tourist_attraction': 'sight seeing',
              'park': 'sight seeing',
              'airport': 'transportation',
              'subway_station': 'transportation',
              'train_station': 'transportation',
              'bus_station': 'transportation'
            };
            
            // Find the first matching category
            parsedData.result.category = 'other'; // Default category
            for (const type of parsedData.result.types) {
              if (typeToCategory[type]) {
                parsedData.result.category = typeToCategory[type];
                break;
              }
            }
            
            console.log('Derived category from place types:', parsedData.result.category);
          }
          
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

// Added: Get place photo as proxy to avoid CORS issues
router.get('/photo', isAuthenticated, async (req, res, next) => {
  try {
    const { photoreference, maxwidth = 400 } = req.query;
    if (!photoreference) {
      return res.status(400).json({ error: 'photoreference parameter is required' });
    }

    // This would be your actual Google Maps API Key
    const apiKey = process.env.GOOGLE_MAPS_API_KEY || 'YOUR_GOOGLE_MAPS_API_KEY';
    const url = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxwidth}&photoreference=${photoreference}&key=${apiKey}`;
    
    // Pipe the photo directly to the response
    https.get(url, (response) => {
      // If Google redirects us, follow the redirect
      if (response.statusCode === 302 || response.statusCode === 301) {
        const redirectUrl = response.headers.location;
        if (redirectUrl) {
          https.get(redirectUrl, (photoResponse) => {
            res.set('Content-Type', photoResponse.headers['content-type']);
            photoResponse.pipe(res);
          }).on('error', (error) => {
            console.error('Error following photo redirect:', error);
            res.status(500).json({ error: 'Failed to get photo from redirect' });
          });
          return;
        }
      }
      
      // If no redirect, pipe directly
      res.set('Content-Type', response.headers['content-type']);
      response.pipe(res);
    }).on('error', (error) => {
      console.error('Error calling Google Place Photos API:', error);
      res.status(500).json({ error: 'Failed to call Google Place Photos API' });
    });
  } catch (error) {
    console.error('Error in Google Place Photos:', error);
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
      image_url,
      category
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
      image_url,
      category
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
      image_url,
      category
    } = req.body;
    
    const placeData = {
      name,
      description,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      address,
      place_id,
      image_url,
      category
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
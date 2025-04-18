const express = require('express');
const router = express.Router();
const userApi = require('./userApi');
const tripApi = require('./tripApi');
const placeApi = require('./placeApi');
const itineraryApi = require('./itineraryApi');
const { apiErrorHandler } = require('./middleware');

// Mount API routes
router.use('/users', userApi);
router.use('/trips', tripApi);
router.use('/places', placeApi);
router.use('/itinerary', itineraryApi);

// API documentation endpoint
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to the Skydea API',
    version: '1.0.0',
    endpoints: {
      users: {
        'GET /api/users/profile': 'Get user profile information',
        'PUT /api/users/profile': 'Update user profile information',
        'POST /api/users/register': 'Register a new user'
      },
      trips: {
        'GET /api/trips': 'Get all trips for the authenticated user',
        'GET /api/trips/:id': 'Get a single trip by ID',
        'POST /api/trips': 'Create a new trip',
        'PUT /api/trips/:id': 'Update a trip',
        'DELETE /api/trips/:id': 'Delete a trip',
        'GET /api/trips/share/:shareCode': 'Get a trip by share code (public access)'
      },
      places: {
        'GET /api/places/trip/:tripId': 'Get all places for a trip',
        'GET /api/places/:id': 'Get a single place by ID',
        'POST /api/places': 'Create a new place',
        'PUT /api/places/:id': 'Update a place',
        'DELETE /api/places/:id': 'Delete a place'
      },
      itinerary: {
        'GET /api/itinerary/trip/:tripId': 'Get all itinerary items for a trip',
        'GET /api/itinerary/trip/:tripId/day/:dayNumber': 'Get all itinerary items for a specific day of a trip',
        'GET /api/itinerary/:id': 'Get a single itinerary item by ID',
        'POST /api/itinerary': 'Create a new itinerary item',
        'PUT /api/itinerary/:id': 'Update an itinerary item',
        'PUT /api/itinerary/order': 'Update order of multiple itinerary items',
        'PUT /api/itinerary/:id/move/:dayNumber': 'Move an itinerary item to a different day',
        'DELETE /api/itinerary/:id': 'Delete an itinerary item'
      }
    },
    authentication: {
      method: 'Username in request body, query parameters, or x-username header',
      example: {
        query: '?username=yourUsername',
        body: '{ "username": "yourUsername", ... }',
        header: 'x-username: yourUsername'
      }
    }
  });
});

// API error handler
router.use(apiErrorHandler);

module.exports = router;

const express = require('express');
const router = express.Router();
const ApiController = require('../controllers/apiController');
const { authenticateApiKey, injectApiUserToBody } = require('../middlewares/apiAuth');
const { validateTripData, validatePlaceData, validateItineraryItemData } = require('../middlewares/validation');

// All routes in this file require API key authentication
router.use(authenticateApiKey);

// Apply the user ID injection middleware to all routes
router.use(injectApiUserToBody);

/**
 * Trip Routes
 */

/**
 * @route GET /api/external/trips
 * @description Get all trips for a user
 * @access Private (API key required)
 */
router.get('/trips', ApiController.getAllTrips);

/**
 * @route GET /api/external/trips/:id
 * @description Get a specific trip by ID
 * @access Private (API key required)
 */
router.get('/trips/:id', ApiController.getTripById);

/**
 * @route POST /api/external/trips
 * @description Create a new trip
 * @access Private (API key required)
 */
router.post('/trips', validateTripData, ApiController.createTrip);

/**
 * @route PUT /api/external/trips/:id
 * @description Update an existing trip
 * @access Private (API key required)
 */
router.put('/trips/:id', validateTripData, ApiController.updateTrip);

/**
 * @route DELETE /api/external/trips/:id
 * @description Delete a trip
 * @access Private (API key required)
 */
router.delete('/trips/:id', ApiController.deleteTrip);

/**
 * Place Routes
 */

/**
 * @route GET /api/external/trips/:tripId/places
 * @description Get all places for a specific trip
 * @access Private (API key required)
 */
router.get('/trips/:tripId/places', ApiController.getPlacesByTripId);

/**
 * @route POST /api/external/places
 * @description Create a new place
 * @access Private (API key required)
 */
router.post('/places', validatePlaceData, ApiController.createPlace);

/**
 * @route PUT /api/external/places/:id
 * @description Update an existing place
 * @access Private (API key required)
 */
router.put('/places/:id', validatePlaceData, ApiController.updatePlace);

/**
 * @route DELETE /api/external/places/:id
 * @description Delete a place
 * @access Private (API key required)
 */
router.delete('/places/:id', ApiController.deletePlace);

/**
 * Activity Routes
 */

/**
 * @route GET /api/external/trips/:tripId/activities
 * @description Get all activities for a specific trip
 * @access Private (API key required)
 */
router.get('/trips/:tripId/activities', ApiController.getActivitiesByTripId);

/**
 * @route POST /api/external/activities
 * @description Create a new activity (itinerary item)
 * @access Private (API key required)
 */
router.post('/activities', validateItineraryItemData, ApiController.createActivity);

/**
 * @route PUT /api/external/activities/:id
 * @description Update an existing activity
 * @access Private (API key required)
 */
router.put('/activities/:id', validateItineraryItemData, ApiController.updateActivity);

/**
 * @route DELETE /api/external/activities/:id
 * @description Delete an activity
 * @access Private (API key required)
 */
router.delete('/activities/:id', ApiController.deleteActivity);

module.exports = router;
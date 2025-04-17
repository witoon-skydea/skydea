const Trip = require('../models/Trip');
const Place = require('../models/Place');
const ItineraryItem = require('../models/ItineraryItem');
const User = require('../models/User');
const { AppError } = require('../middlewares/errorHandler');

/**
 * Controller for external API access
 */
class ApiController {
  /**
   * Get all trips for a user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async getAllTrips(req, res, next) {
    try {
      const userId = req.body.user_id || req.apiUser.id;
      
      // Check if user exists
      const userExists = await User.findById(userId);
      if (!userExists) {
        return res.status(404).json({ 
          success: false, 
          error: `User with ID ${userId} not found` 
        });
      }
      
      const trips = await Trip.findByUserId(userId);
      
      res.status(200).json({
        success: true,
        message: 'Trips retrieved successfully',
        data: trips
      });
    } catch (error) {
      console.error('Error in getAllTrips API:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to retrieve trips: ' + error.message 
      });
    }
  }
  
  /**
   * Get a trip by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async getTripById(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.body.user_id || req.apiUser.id;
      
      // Check if user exists
      const userExists = await User.findById(userId);
      if (!userExists) {
        return res.status(404).json({ 
          success: false, 
          error: `User with ID ${userId} not found` 
        });
      }
      
      // Get the trip
      const trip = await Trip.findById(id);
      if (!trip) {
        return res.status(404).json({ 
          success: false, 
          error: `Trip with ID ${id} not found` 
        });
      }
      
      // Check if the trip belongs to the user
      if (trip.user_id !== parseInt(userId)) {
        return res.status(403).json({ 
          success: false, 
          error: 'You do not have permission to access this trip' 
        });
      }
      
      // Get places for this trip
      const places = await Place.findByTripId(id);
      
      // Get itinerary items for this trip
      const itineraryItems = await ItineraryItem.findByTripId(id);
      
      res.status(200).json({
        success: true,
        message: 'Trip retrieved successfully',
        data: {
          trip,
          places,
          itineraryItems
        }
      });
    } catch (error) {
      console.error('Error in getTripById API:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to retrieve trip: ' + error.message 
      });
    }
  }
  
  /**
   * Get all places for a trip
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async getPlacesByTripId(req, res, next) {
    try {
      const { tripId } = req.params;
      const userId = req.body.user_id || req.apiUser.id;
      
      // Check if trip exists
      const trip = await Trip.findById(tripId);
      if (!trip) {
        return res.status(404).json({ 
          success: false, 
          error: `Trip with ID ${tripId} not found` 
        });
      }
      
      // Check if the trip belongs to the user
      if (trip.user_id !== parseInt(userId)) {
        return res.status(403).json({ 
          success: false, 
          error: 'You do not have permission to access this trip' 
        });
      }
      
      const places = await Place.findByTripId(tripId);
      
      res.status(200).json({
        success: true,
        message: 'Places retrieved successfully',
        data: places
      });
    } catch (error) {
      console.error('Error in getPlacesByTripId API:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to retrieve places: ' + error.message 
      });
    }
  }
  
  /**
   * Get all activities for a trip
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async getActivitiesByTripId(req, res, next) {
    try {
      const { tripId } = req.params;
      const userId = req.body.user_id || req.apiUser.id;
      
      // Check if trip exists
      const trip = await Trip.findById(tripId);
      if (!trip) {
        return res.status(404).json({ 
          success: false, 
          error: `Trip with ID ${tripId} not found` 
        });
      }
      
      // Check if the trip belongs to the user
      if (trip.user_id !== parseInt(userId)) {
        return res.status(403).json({ 
          success: false, 
          error: 'You do not have permission to access this trip' 
        });
      }
      
      const activities = await ItineraryItem.findByTripId(tripId);
      
      res.status(200).json({
        success: true,
        message: 'Activities retrieved successfully',
        data: activities
      });
    } catch (error) {
      console.error('Error in getActivitiesByTripId API:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to retrieve activities: ' + error.message 
      });
    }
  }
  /**
   * Create a new trip
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async createTrip(req, res, next) {
    try {
      const { title, description, start_date, end_date, is_public, user_id } = req.body;
      
      if (!title || !start_date || !end_date || !user_id) {
        return res.status(400).json({ 
          success: false, 
          error: 'Missing required fields: title, start_date, end_date, and user_id are required' 
        });
      }
      
      // Validate dates
      const startDate = new Date(start_date);
      const endDate = new Date(end_date);
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid date format. Use ISO format (YYYY-MM-DD)' 
        });
      }
      
      if (endDate < startDate) {
        return res.status(400).json({ 
          success: false, 
          error: 'End date must be on or after start date' 
        });
      }
      
      // Check if user exists
      const userExists = await User.findById(user_id);
      if (!userExists) {
        return res.status(404).json({ 
          success: false, 
          error: `User with ID ${user_id} not found` 
        });
      }
      
      const tripData = {
        user_id: parseInt(user_id),
        title,
        description: description || null,
        start_date,
        end_date,
        is_public: is_public ? 1 : 0
      };
      
      const trip = await Trip.create(tripData);
      
      res.status(201).json({
        success: true,
        message: 'Trip created successfully',
        data: trip
      });
    } catch (error) {
      console.error('Error in createTrip API:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to create trip: ' + error.message 
      });
    }
  }
  
  /**
   * Create a new place
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async createPlace(req, res, next) {
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
        category,
        user_id
      } = req.body;
      
      if (!trip_id || !name || !user_id) {
        return res.status(400).json({ 
          success: false, 
          error: 'Missing required fields: trip_id, name, and user_id are required' 
        });
      }
      
      // Check if category exists
      if (!category) {
        return res.status(400).json({ 
          success: false, 
          error: 'Category is required' 
        });
      }
      
      // Check if user exists
      const userExists = await User.findById(user_id);
      if (!userExists) {
        return res.status(404).json({ 
          success: false, 
          error: `User with ID ${user_id} not found` 
        });
      }
      
      // Check if trip exists and belongs to user
      const trip = await Trip.findById(trip_id);
      if (!trip) {
        return res.status(404).json({ 
          success: false, 
          error: `Trip with ID ${trip_id} not found` 
        });
      }
      
      if (trip.user_id !== parseInt(user_id)) {
        return res.status(403).json({ 
          success: false, 
          error: 'You do not have permission to add places to this trip' 
        });
      }
      
      const placeData = {
        trip_id: parseInt(trip_id),
        name,
        description: description || null,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        address: address || null,
        place_id: place_id || null,
        image_url: image_url || null,
        category
      };
      
      const place = await Place.create(placeData);
      
      res.status(201).json({
        success: true,
        message: 'Place created successfully',
        data: place
      });
    } catch (error) {
      console.error('Error in createPlace API:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to create place: ' + error.message 
      });
    }
  }
  
  /**
   * Create a new activity (itinerary item)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async createActivity(req, res, next) {
    try {
      const { 
        trip_id, 
        place_id, 
        title, 
        description, 
        start_time, 
        end_time, 
        day_number, 
        order_index,
        tags,
        user_id
      } = req.body;
      
      if (!trip_id || !title || !start_time || !end_time || !day_number || !user_id) {
        return res.status(400).json({ 
          success: false, 
          error: 'Missing required fields: trip_id, title, start_time, end_time, day_number, and user_id are required' 
        });
      }
      
      // Check if user exists
      const userExists = await User.findById(user_id);
      if (!userExists) {
        return res.status(404).json({ 
          success: false, 
          error: `User with ID ${user_id} not found` 
        });
      }
      
      // Check if trip exists and belongs to user
      const trip = await Trip.findById(trip_id);
      if (!trip) {
        return res.status(404).json({ 
          success: false, 
          error: `Trip with ID ${trip_id} not found` 
        });
      }
      
      if (trip.user_id !== parseInt(user_id)) {
        return res.status(403).json({ 
          success: false, 
          error: 'You do not have permission to add activities to this trip' 
        });
      }
      
      // Validate day number is a positive integer
      const dayNum = parseInt(day_number);
      if (isNaN(dayNum) || dayNum <= 0) {
        return res.status(400).json({ 
          success: false, 
          error: 'Day number must be a positive integer' 
        });
      }
      
      // Determine order_index if not provided - place at the end of the day's activities
      let orderIdx = order_index ? parseInt(order_index) : null;
      if (!orderIdx) {
        try {
          // Get current activities for this day
          const dayActivities = await ItineraryItem.findByTripAndDay(trip_id, dayNum);
          orderIdx = dayActivities.length > 0 ? 
            Math.max(...dayActivities.map(item => item.order_index)) + 1 : 1;
        } catch (err) {
          console.error('Error getting day activities:', err);
          orderIdx = 1; // Default to 1 if there's an error
        }
      }
      
      // Validate start_time is before end_time
      if (start_time >= end_time) {
        return res.status(400).json({ 
          success: false, 
          error: 'Start time must be before end time' 
        });
      }
      
      // Check if place exists and belongs to trip if place_id is provided
      if (place_id) {
        const place = await Place.findById(place_id);
        if (!place) {
          return res.status(404).json({ 
            success: false, 
            error: `Place with ID ${place_id} not found` 
          });
        }
        
        if (place.trip_id !== parseInt(trip_id)) {
          return res.status(400).json({ 
            success: false, 
            error: 'Place does not belong to this trip' 
          });
        }
      }
      
      const itemData = {
        trip_id: parseInt(trip_id),
        place_id: place_id ? parseInt(place_id) : null,
        title,
        description: description || null,
        start_time,
        end_time,
        day_number: dayNum,
        order_index: orderIdx,
        tags: tags || null
      };
      
      const activity = await ItineraryItem.create(itemData);
      
      res.status(201).json({
        success: true,
        message: 'Activity created successfully',
        data: activity
      });
    } catch (error) {
      console.error('Error in createActivity API:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to create activity: ' + error.message 
      });
    }
  }
  /**
   * Update a trip
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async updateTrip(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.body.user_id || req.apiUser.id;
      const { title, description, start_date, end_date, is_public } = req.body;
      
      // Check if trip exists
      const trip = await Trip.findById(id);
      if (!trip) {
        return res.status(404).json({ 
          success: false, 
          error: `Trip with ID ${id} not found` 
        });
      }
      
      // Check if the trip belongs to the user
      if (trip.user_id !== parseInt(userId)) {
        return res.status(403).json({ 
          success: false, 
          error: 'You do not have permission to update this trip' 
        });
      }
      
      const tripData = {
        title,
        description: description || null,
        start_date,
        end_date,
        is_public: is_public !== undefined ? (is_public ? 1 : 0) : trip.is_public
      };
      
      const updatedTrip = await Trip.update(id, tripData);
      
      res.status(200).json({
        success: true,
        message: 'Trip updated successfully',
        data: updatedTrip
      });
    } catch (error) {
      console.error('Error in updateTrip API:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to update trip: ' + error.message 
      });
    }
  }
  
  /**
   * Update a place
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async updatePlace(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.body.user_id || req.apiUser.id;
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
      
      // Check if place exists
      const place = await Place.findById(id);
      if (!place) {
        return res.status(404).json({ 
          success: false, 
          error: `Place with ID ${id} not found` 
        });
      }
      
      // Check if the place's trip belongs to the user
      const trip = await Trip.findById(place.trip_id);
      if (trip.user_id !== parseInt(userId)) {
        return res.status(403).json({ 
          success: false, 
          error: 'You do not have permission to update this place' 
        });
      }
      
      const placeData = {
        name,
        description: description || null,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        address: address || null,
        place_id: place_id || null,
        image_url: image_url || null,
        category
      };
      
      const updatedPlace = await Place.update(id, placeData);
      
      res.status(200).json({
        success: true,
        message: 'Place updated successfully',
        data: updatedPlace
      });
    } catch (error) {
      console.error('Error in updatePlace API:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to update place: ' + error.message 
      });
    }
  }
  
  /**
   * Update an activity
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async updateActivity(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.body.user_id || req.apiUser.id;
      const { 
        place_id, 
        title, 
        description, 
        start_time, 
        end_time, 
        day_number, 
        order_index,
        tags
      } = req.body;
      
      // Check if activity exists
      const activity = await ItineraryItem.findById(id);
      if (!activity) {
        return res.status(404).json({ 
          success: false, 
          error: `Activity with ID ${id} not found` 
        });
      }
      
      // Check if the activity's trip belongs to the user
      const trip = await Trip.findById(activity.trip_id);
      if (trip.user_id !== parseInt(userId)) {
        return res.status(403).json({ 
          success: false, 
          error: 'You do not have permission to update this activity' 
        });
      }
      
      const itemData = {
        place_id: place_id ? parseInt(place_id) : null,
        title,
        description: description || null,
        start_time,
        end_time,
        day_number: parseInt(day_number),
        order_index: parseInt(order_index),
        tags
      };
      
      const updatedActivity = await ItineraryItem.update(id, itemData);
      
      res.status(200).json({
        success: true,
        message: 'Activity updated successfully',
        data: updatedActivity
      });
    } catch (error) {
      console.error('Error in updateActivity API:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to update activity: ' + error.message 
      });
    }
  }
  
  /**
   * Delete a trip
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async deleteTrip(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.body.user_id || req.apiUser.id;
      
      // Check if trip exists
      const trip = await Trip.findById(id);
      if (!trip) {
        return res.status(404).json({ 
          success: false, 
          error: `Trip with ID ${id} not found` 
        });
      }
      
      // Check if the trip belongs to the user
      if (trip.user_id !== parseInt(userId)) {
        return res.status(403).json({ 
          success: false, 
          error: 'You do not have permission to delete this trip' 
        });
      }
      
      // Delete all itinerary items associated with this trip
      await ItineraryItem.deleteByTripId(id);
      
      // Delete all places associated with this trip
      await Place.deleteByTripId(id);
      
      // Delete the trip
      const result = await Trip.delete(id);
      
      res.status(200).json({
        success: true,
        message: 'Trip deleted successfully'
      });
    } catch (error) {
      console.error('Error in deleteTrip API:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to delete trip: ' + error.message 
      });
    }
  }
  
  /**
   * Delete a place
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async deletePlace(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.body.user_id || req.apiUser.id;
      
      // Check if place exists
      const place = await Place.findById(id);
      if (!place) {
        return res.status(404).json({ 
          success: false, 
          error: `Place with ID ${id} not found` 
        });
      }
      
      // Check if the place's trip belongs to the user
      const trip = await Trip.findById(place.trip_id);
      if (trip.user_id !== parseInt(userId)) {
        return res.status(403).json({ 
          success: false, 
          error: 'You do not have permission to delete this place' 
        });
      }
      
      // Delete the place
      const result = await Place.delete(id);
      
      res.status(200).json({
        success: true,
        message: 'Place deleted successfully'
      });
    } catch (error) {
      console.error('Error in deletePlace API:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to delete place: ' + error.message 
      });
    }
  }
  
  /**
   * Delete an activity
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async deleteActivity(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.body.user_id || req.apiUser.id;
      
      // Check if activity exists
      const activity = await ItineraryItem.findById(id);
      if (!activity) {
        return res.status(404).json({ 
          success: false, 
          error: `Activity with ID ${id} not found` 
        });
      }
      
      // Check if the activity's trip belongs to the user
      const trip = await Trip.findById(activity.trip_id);
      if (trip.user_id !== parseInt(userId)) {
        return res.status(403).json({ 
          success: false, 
          error: 'You do not have permission to delete this activity' 
        });
      }
      
      // Delete the activity
      const result = await ItineraryItem.delete(id);
      
      res.status(200).json({
        success: true,
        message: 'Activity deleted successfully'
      });
    } catch (error) {
      console.error('Error in deleteActivity API:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to delete activity: ' + error.message 
      });
    }
  }
}

module.exports = ApiController;
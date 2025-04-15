const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middlewares/auth');
const { validateItineraryItemData } = require('../middlewares/validation');
const { AppError } = require('../middlewares/errorHandler');
const Trip = require('../models/Trip');
const ItineraryItem = require('../models/ItineraryItem');

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

// Middleware to check itinerary item ownership (via trip)
const checkItemOwnership = async (req, res, next) => {
  try {
    const itemId = parseInt(req.params.id);
    const userId = req.session.user.id;
    
    // Get the item to find the associated trip ID
    const item = await ItineraryItem.findById(itemId);
    
    if (!item) {
      return next(new AppError('Itinerary item not found', 404));
    }
    
    // Check if the trip belongs to the user
    const belongs = await Trip.belongsToUser(item.trip_id, userId);
    if (!belongs) {
      return next(new AppError('You do not have permission to access this itinerary item', 403));
    }
    
    // Store the item in response locals for later use
    res.locals.item = item;
    next();
  } catch (error) {
    console.error('Error checking itinerary item ownership:', error);
    next(new AppError('Internal server error', 500));
  }
};

// Get all itinerary items for a trip
router.get('/trip/:tripId', isAuthenticated, checkTripOwnership, async (req, res, next) => {
  try {
    const tripId = parseInt(req.params.tripId);
    const items = await ItineraryItem.findByTripId(tripId);
    res.json(items);
  } catch (error) {
    console.error('Error fetching itinerary items:', error);
    next(new AppError('Failed to fetch itinerary items', 500));
  }
});

// Get all itinerary items for a specific day of a trip
router.get('/trip/:tripId/day/:dayNumber', isAuthenticated, checkTripOwnership, async (req, res, next) => {
  try {
    const tripId = parseInt(req.params.tripId);
    const dayNumber = parseInt(req.params.dayNumber);
    const items = await ItineraryItem.findByTripAndDay(tripId, dayNumber);
    res.json(items);
  } catch (error) {
    console.error('Error fetching day itinerary items:', error);
    next(new AppError('Failed to fetch day itinerary items', 500));
  }
});

// Create a new itinerary item
router.post('/', isAuthenticated, checkTripOwnership, validateItineraryItemData, async (req, res, next) => {
  try {
    const { 
      trip_id, 
      place_id, 
      title, 
      description, 
      start_time, 
      end_time, 
      day_number, 
      order_index 
    } = req.body;
    
    if (!trip_id) {
      throw new AppError('Trip ID is required', 400);
    }
    
    const itemData = {
      trip_id: parseInt(trip_id),
      place_id: place_id && place_id !== "" ? parseInt(place_id) : null,
      title,
      description,
      start_time,
      end_time,
      day_number: parseInt(day_number),
      order_index: parseInt(order_index)
    };
    
    const item = await ItineraryItem.create(itemData);
    res.status(201).json(item);
  } catch (error) {
    console.error('Error creating itinerary item:', error);
    res.status(500).json({ error: 'Failed to create itinerary item' });
  }
});

// Get a specific itinerary item
router.get('/:id', isAuthenticated, checkItemOwnership, async (req, res, next) => {
  // The item is already retrieved in the middleware
  res.json(res.locals.item);
});

// Update an itinerary item
router.put('/:id', isAuthenticated, checkItemOwnership, validateItineraryItemData, async (req, res, next) => {
  try {
    const itemId = parseInt(req.params.id);
    const { 
      place_id, 
      title, 
      description, 
      start_time, 
      end_time, 
      day_number, 
      order_index 
    } = req.body;
    
    const itemData = {
      place_id: place_id ? parseInt(place_id) : null,
      title,
      description,
      start_time,
      end_time,
      day_number: parseInt(day_number),
      order_index: parseInt(order_index)
    };
    
    const item = await ItineraryItem.update(itemId, itemData);
    res.json(item);
  } catch (error) {
    console.error('Error updating itinerary item:', error);
    
    if (error.message === 'Itinerary item not found or no changes made') {
      return res.status(404).json({ error: 'Itinerary item not found' });
    }
    
    res.status(500).json({ error: 'Failed to update itinerary item' });
  }
});

// Update order of multiple itinerary items (for drag-and-drop reordering)
router.put('/reorder/batch', isAuthenticated, async (req, res, next) => {
  try {
    const { items, trip_id } = req.body;
    
    if (!items || !Array.isArray(items) || items.length === 0 || !trip_id) {
      return next(new AppError('Invalid request format', 400));
    }
    
    // Check if the user has permission to update these items
    const userId = req.session.user.id;
    const belongs = await Trip.belongsToUser(parseInt(trip_id), userId);
    if (!belongs) {
      return next(new AppError('You do not have permission to update these items', 403));
    }
    
    // Format items array for updateOrder method
    const formattedItems = items.map(item => ({
      id: parseInt(item.id),
      order_index: parseInt(item.order_index)
    }));
    
    await ItineraryItem.updateOrder(formattedItems);
    res.json({ success: true, message: 'Items reordered successfully' });
  } catch (error) {
    console.error('Error reordering itinerary items:', error);
    next(new AppError('Failed to reorder itinerary items', 500));
  }
});

// Move an itinerary item to a different day
router.put('/:id/move-day', isAuthenticated, checkItemOwnership, async (req, res, next) => {
  try {
    const itemId = parseInt(req.params.id);
    const { day_number, order_index } = req.body;
    
    if (day_number === undefined || order_index === undefined) {
      return next(new AppError('Missing required fields', 400));
    }
    
    const newDayNumber = parseInt(day_number);
    const newOrderIndex = parseInt(order_index);
    
    // Validate day number (must be positive)
    if (newDayNumber <= 0) {
      return next(new AppError('Day number must be positive', 400));
    }
    
    // Validate order index (must be positive)
    if (newOrderIndex <= 0) {
      return next(new AppError('Order index must be positive', 400));
    }
    
    const item = await ItineraryItem.moveToDay(itemId, newDayNumber, newOrderIndex);
    res.json(item);
  } catch (error) {
    console.error('Error moving itinerary item:', error);
    
    if (error.message === 'Itinerary item not found or no changes made') {
      return next(new AppError('Itinerary item not found', 404));
    }
    
    next(new AppError('Failed to move itinerary item', 500));
  }
});

// Bulk update activities for a day (reordering, adding, removing)
router.put('/trip/:tripId/day/:dayNumber', isAuthenticated, checkTripOwnership, async (req, res, next) => {
  try {
    const tripId = parseInt(req.params.tripId);
    const dayNumber = parseInt(req.params.dayNumber);
    const { activities } = req.body;
    
    if (!Array.isArray(activities)) {
      return next(new AppError('Activities must be an array', 400));
    }
    
    // Process each activity
    const updates = activities.map((activity, index) => {
      return {
        id: parseInt(activity.id),
        order_index: index + 1 // Set the order based on array position
      };
    });
    
    await ItineraryItem.updateOrder(updates);
    
    // Get the updated items for this day
    const updatedItems = await ItineraryItem.findByTripAndDay(tripId, dayNumber);
    res.json(updatedItems);
  } catch (error) {
    console.error('Error updating day activities:', error);
    next(new AppError('Failed to update day activities', 500));
  }
});

// Delete an itinerary item
router.delete('/:id', isAuthenticated, checkItemOwnership, async (req, res, next) => {
  try {
    const itemId = parseInt(req.params.id);
    const result = await ItineraryItem.delete(itemId);
    
    if (!result) {
      return next(new AppError('Itinerary item not found', 404));
    }
    
    res.json({ success: true, message: 'Itinerary item deleted successfully' });
  } catch (error) {
    console.error('Error deleting itinerary item:', error);
    next(new AppError('Failed to delete itinerary item', 500));
  }
});

// Export the router
module.exports = router;
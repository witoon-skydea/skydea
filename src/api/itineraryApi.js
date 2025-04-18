const express = require('express');
const router = express.Router();
const ItineraryItem = require('../models/ItineraryItem');
const Trip = require('../models/Trip');
const { authenticateUser } = require('./middleware');

/**
 * Middleware to validate if a trip belongs to the current user
 */
const validateTripAccess = async (req, res, next) => {
  try {
    const tripId = req.body.trip_id || req.query.trip_id || req.params.tripId;
    
    if (!tripId) {
      return res.status(400).json({
        success: false,
        message: 'Trip ID is required'
      });
    }
    
    // Check if trip exists and belongs to user
    const belongsToUser = await Trip.belongsToUser(tripId, req.user.id);
    
    if (!belongsToUser) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You do not have permission to access this trip'
      });
    }
    
    next();
  } catch (error) {
    console.error('Error validating trip access:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * @route   GET /api/itinerary/trip/:tripId
 * @desc    Get all itinerary items for a trip
 * @access  Private
 */
router.get('/trip/:tripId', authenticateUser, validateTripAccess, async (req, res) => {
  try {
    const items = await ItineraryItem.findByTripId(req.params.tripId);
    
    res.json({
      success: true,
      count: items.length,
      data: items
    });
  } catch (error) {
    console.error('Error fetching itinerary items:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch itinerary items',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/itinerary/trip/:tripId/day/:dayNumber
 * @desc    Get all itinerary items for a specific day of a trip
 * @access  Private
 */
router.get('/trip/:tripId/day/:dayNumber', authenticateUser, validateTripAccess, async (req, res) => {
  try {
    const items = await ItineraryItem.findByTripAndDay(req.params.tripId, req.params.dayNumber);
    
    res.json({
      success: true,
      count: items.length,
      data: items
    });
  } catch (error) {
    console.error('Error fetching itinerary items for day:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch itinerary items for day',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/itinerary/:id
 * @desc    Get a single itinerary item by ID
 * @access  Private
 */
router.get('/:id', authenticateUser, async (req, res) => {
  try {
    const item = await ItineraryItem.findById(req.params.id);
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Itinerary item not found'
      });
    }
    
    // Check if the item's trip belongs to the user
    const tripBelongsToUser = await Trip.belongsToUser(item.trip_id, req.user.id);
    
    if (!tripBelongsToUser) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You do not have permission to access this itinerary item'
      });
    }
    
    res.json({
      success: true,
      data: item
    });
  } catch (error) {
    console.error('Error fetching itinerary item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch itinerary item',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/itinerary
 * @desc    Create a new itinerary item
 * @access  Private
 */
router.post('/', authenticateUser, validateTripAccess, async (req, res) => {
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
      tags 
    } = req.body;
    
    // Validate required fields
    if (!trip_id || !title || !start_time || !end_time || !day_number) {
      return res.status(400).json({
        success: false,
        message: 'Trip ID, title, start time, end time, and day number are required'
      });
    }
    
    // Create a new itinerary item
    const item = await ItineraryItem.create({
      trip_id,
      place_id,
      title,
      description,
      start_time,
      end_time,
      day_number,
      order_index: order_index || 0, // Default to 0 if not provided
      tags
    });
    
    res.status(201).json({
      success: true,
      message: 'Itinerary item created successfully',
      data: item
    });
  } catch (error) {
    console.error('Error creating itinerary item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create itinerary item',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/itinerary/:id
 * @desc    Update an itinerary item
 * @access  Private
 */
router.put('/:id', authenticateUser, async (req, res) => {
  try {
    // Get the item to check ownership
    const item = await ItineraryItem.findById(req.params.id);
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Itinerary item not found'
      });
    }
    
    // Check if the item's trip belongs to the user
    const tripBelongsToUser = await Trip.belongsToUser(item.trip_id, req.user.id);
    
    if (!tripBelongsToUser) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You do not have permission to modify this itinerary item'
      });
    }
    
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
    
    // Validate required fields
    if (!title || !start_time || !end_time || !day_number) {
      return res.status(400).json({
        success: false,
        message: 'Title, start time, end time, and day number are required'
      });
    }
    
    // Update the itinerary item
    const updatedItem = await ItineraryItem.update(req.params.id, {
      place_id,
      title,
      description,
      start_time,
      end_time,
      day_number,
      order_index,
      tags
    });
    
    res.json({
      success: true,
      message: 'Itinerary item updated successfully',
      data: updatedItem
    });
  } catch (error) {
    console.error('Error updating itinerary item:', error);
    
    if (error.message === 'Itinerary item not found or no changes made') {
      return res.status(404).json({
        success: false,
        message: 'Itinerary item not found or no changes made'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update itinerary item',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/itinerary/order
 * @desc    Update order of multiple itinerary items (for drag-and-drop reordering)
 * @access  Private
 */
router.put('/order', authenticateUser, async (req, res) => {
  try {
    console.log('Order update request body:', req.body);
    
    // Extract items from request body
    const { items } = req.body;
    
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Items array is required'
      });
    }
    
    console.log('Items to update order:', items);
    
    // Validate that all items in the array have id and order_index
    for (const item of items) {
      if (!item.id || item.order_index === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Each item must have id and order_index properties'
        });
      }
    }
    
    // Check if any items exist
    let allItemsExist = true;
    for (const item of items) {
      const itemExists = await ItineraryItem.findById(item.id);
      if (!itemExists) {
        allItemsExist = false;
        break;
      }
    }
    
    if (!allItemsExist) {
      return res.status(404).json({
        success: false,
        message: 'One or more itinerary items not found'
      });
    }
    
    // First get one item to check trip ownership
    const firstItem = await ItineraryItem.findById(items[0].id);
    
    // Check if the item's trip belongs to the user
    const tripBelongsToUser = await Trip.belongsToUser(firstItem.trip_id, req.user.id);
    
    if (!tripBelongsToUser) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You do not have permission to modify these itinerary items'
      });
    }
    
    // Update the order of items
    await ItineraryItem.updateOrder(items);
    
    res.json({
      success: true,
      message: 'Itinerary items order updated successfully'
    });
  } catch (error) {
    console.error('Error updating itinerary items order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update itinerary items order',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/itinerary/:id/move/:dayNumber
 * @desc    Move an itinerary item to a different day
 * @access  Private
 */
router.put('/:id/move/:dayNumber', authenticateUser, async (req, res) => {
  try {
    const { order_index } = req.body;
    const itemId = req.params.id;
    const newDayNumber = req.params.dayNumber;
    
    // Get the item to check ownership
    const item = await ItineraryItem.findById(itemId);
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Itinerary item not found'
      });
    }
    
    // Check if the item's trip belongs to the user
    const tripBelongsToUser = await Trip.belongsToUser(item.trip_id, req.user.id);
    
    if (!tripBelongsToUser) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You do not have permission to modify this itinerary item'
      });
    }
    
    // Move the item to the new day
    const updatedItem = await ItineraryItem.moveToDay(itemId, newDayNumber, order_index || 0);
    
    res.json({
      success: true,
      message: 'Itinerary item moved successfully',
      data: updatedItem
    });
  } catch (error) {
    console.error('Error moving itinerary item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to move itinerary item',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/itinerary/:id
 * @desc    Delete an itinerary item
 * @access  Private
 */
router.delete('/:id', authenticateUser, async (req, res) => {
  try {
    // Get the item to check ownership
    const item = await ItineraryItem.findById(req.params.id);
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Itinerary item not found'
      });
    }
    
    // Check if the item's trip belongs to the user
    const tripBelongsToUser = await Trip.belongsToUser(item.trip_id, req.user.id);
    
    if (!tripBelongsToUser) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You do not have permission to delete this itinerary item'
      });
    }
    
    // Delete the itinerary item
    const success = await ItineraryItem.delete(req.params.id);
    
    res.json({
      success: true,
      message: 'Itinerary item deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting itinerary item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete itinerary item',
      error: error.message
    });
  }
});

module.exports = router;

/**
 * Validation middlewares for different routes
 */

const { AppError } = require('./errorHandler');

/**
 * Validate trip creation/update data
 */
const validateTripData = (req, res, next) => {
  try {
    const { title, start_date, end_date } = req.body;
    
    // Check required fields
    if (!title || !title.trim()) {
      throw new AppError('Trip title is required', 400);
    }
    
    if (!start_date) {
      throw new AppError('Start date is required', 400);
    }
    
    if (!end_date) {
      throw new AppError('End date is required', 400);
    }
    
    // Validate dates
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    
    if (isNaN(startDate.getTime())) {
      throw new AppError('Invalid start date format', 400);
    }
    
    if (isNaN(endDate.getTime())) {
      throw new AppError('Invalid end date format', 400);
    }
    
    // Validate end date is not before start date
    if (endDate < startDate) {
      throw new AppError('End date must be on or after start date', 400);
    }
    
    // Validate trip is not too long (e.g., 30 days max)
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 30) {
      throw new AppError('Trip cannot exceed 30 days', 400);
    }
    
    // Continue to the next middleware
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Validate place data
 */
const validatePlaceData = (req, res, next) => {
  try {
    const { name, latitude, longitude } = req.body;
    
    // Check required fields
    if (!name || !name.trim()) {
      throw new AppError('Place name is required', 400);
    }
    
    // Validate latitude if provided
    if (latitude !== undefined && latitude !== null && latitude !== '') {
      const lat = parseFloat(latitude);
      if (isNaN(lat) || lat < -90 || lat > 90) {
        throw new AppError('Invalid latitude value (must be between -90 and 90)', 400);
      }
    }
    
    // Validate longitude if provided
    if (longitude !== undefined && longitude !== null && longitude !== '') {
      const lng = parseFloat(longitude);
      if (isNaN(lng) || lng < -180 || lng > 180) {
        throw new AppError('Invalid longitude value (must be between -180 and 180)', 400);
      }
    }
    
    // Continue to the next middleware
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Validate itinerary item data
 */
const validateItineraryItemData = (req, res, next) => {
  try {
    const { title, start_time, end_time, day_number, order_index } = req.body;
    
    // Check required fields
    if (!title || !title.trim()) {
      throw new AppError('Activity title is required', 400);
    }
    
    if (!start_time) {
      throw new AppError('Start time is required', 400);
    }
    
    if (!end_time) {
      throw new AppError('End time is required', 400);
    }
    
    if (day_number === undefined) {
      throw new AppError('Day number is required', 400);
    }
    
    if (order_index === undefined) {
      throw new AppError('Order index is required', 400);
    }
    
    // Validate day number
    const dayNum = parseInt(day_number);
    if (isNaN(dayNum) || dayNum <= 0) {
      throw new AppError('Day number must be a positive integer', 400);
    }
    
    // Validate order index
    const orderIdx = parseInt(order_index);
    if (isNaN(orderIdx) || orderIdx <= 0) {
      throw new AppError('Order index must be a positive integer', 400);
    }
    
    // Validate times
    // This is a simple validation that start_time is before end_time
    // In a real app, you might want to do more sophisticated validation
    if (start_time >= end_time) {
      throw new AppError('Start time must be before end time', 400);
    }
    
    // Continue to the next middleware
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  validateTripData,
  validatePlaceData,
  validateItineraryItemData
};

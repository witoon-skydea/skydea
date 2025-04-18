const User = require('../models/User');

/**
 * Middleware to authenticate API requests using username in request body/query
 * This is a simple authentication method, more secure methods would use API keys or JWT tokens
 */
exports.authenticateUser = async (req, res, next) => {
  try {
    console.log('Authentication request headers:', req.headers);
    console.log('Authentication request body:', req.body);
    console.log('Authentication request query:', req.query);
    console.log('Session user:', req.session?.user);
    
    // First check if user is authenticated via session
    if (req.session && req.session.isAuthenticated && req.session.user) {
      // User is already authenticated via session
      console.log('User authenticated via session');
      req.user = req.session.user;
      return next();
    }
    
    // If not authenticated via session, try API authentication methods
    // Get username from request body, query, or headers
    const username = req.body?.username || req.query?.username || req.headers['x-username'];
    
    console.log('Authenticating user with username:', username);
    
    // If share code is provided in query params, skip authentication
    if (req.query.share) {
      console.log('Share code provided, skipping authentication');
      req.user = { id: null }; // Set a placeholder user object
      return next();
    }
    
    // If no username is provided, return unauthorized
    if (!username) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication failed: Username is required' 
      });
    }
    
    // Find user by username
    const user = await User.findByUsername(username);
    
    console.log('User found:', user ? 'Yes' : 'No');
    
    // If no user found, return unauthorized
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication failed: User not found' 
      });
    }
    
    // Attach user to request object
    req.user = user;
    
    // Continue to next middleware
    next();
  } catch (error) {
    console.error('API Authentication error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Authentication failed: Internal server error' 
    });
  }
};

/**
 * Middleware to validate trip ownership
 * Makes sure the authenticated user owns the requested trip
 */
exports.validateTripOwnership = async (req, res, next) => {
  try {
    // Get trip ID from request parameters
    const tripId = req.params.id || req.params.tripId;
    
    if (!tripId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Trip ID is required' 
      });
    }
    
    // Get Trip model
    const Trip = require('../models/Trip');
    
    // If there's a share code in the query, check if it matches the trip's share code
    if (req.query.share) {
      const trip = await Trip.findById(tripId);
      if (trip && trip.share_code === req.query.share) {
        // Trip is shared via a valid share code
        return next();
      }
    }
    
    // If no valid share code, check if trip belongs to user
    if (!req.user || !req.user.id) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication failed: User not authenticated' 
      });
    }
    
    const belongsToUser = await Trip.belongsToUser(tripId, req.user.id);
    
    if (!belongsToUser) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied: You do not have permission to access this trip' 
      });
    }
    
    // Continue to next middleware
    next();
  } catch (error) {
    console.error('Trip ownership validation error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Validation failed: Internal server error' 
    });
  }
};

/**
 * Error handler for API routes
 */
exports.apiErrorHandler = (err, req, res, next) => {
  console.error('API Error:', err);
  
  // If headers already sent, delegate to Express default error handler
  if (res.headersSent) {
    return next(err);
  }
  
  // Set status code and send error response
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
};

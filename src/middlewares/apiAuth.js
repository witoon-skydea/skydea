const ApiKey = require('../models/ApiKey');

/**
 * Middleware to authenticate API requests using API keys
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.authenticateApiKey = async (req, res, next) => {
  try {
    // Get API key from header or query parameter
    const apiKey = req.headers['x-api-key'] || req.query.api_key;
    
    if (!apiKey) {
      return res.status(401).json({
        success: false,
        error: 'API key is required. Provide it in the X-API-Key header or api_key query parameter.'
      });
    }
    
    // Find API key in database
    const apiKeyData = await ApiKey.findByKey(apiKey);
    
    if (!apiKeyData) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or inactive API key'
      });
    }
    
    // Store user data from API key in request for use in controllers
    req.apiUser = {
      id: apiKeyData.user_id,
      username: apiKeyData.username,
      email: apiKeyData.email
    };
    
    // Add a flag to identify this as an API request
    req.isApiRequest = true;
    
    next();
  } catch (error) {
    console.error('Error authenticating API key:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Helper middleware to extract user_id from request body if not provided
 * This allows API clients to omit the user_id field as it will be extracted from the API key
 */
exports.injectApiUserToBody = (req, res, next) => {
  // If user_id is not provided in the request body and we have an API user, add it
  if (!req.body.user_id && req.apiUser) {
    req.body.user_id = req.apiUser.id;
  }
  
  next();
};
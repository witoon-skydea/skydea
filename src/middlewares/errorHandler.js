/**
 * Global error handler middleware
 */

const appConfig = require('../config/app');

/**
 * Handle API errors (JSON responses)
 */
const handleApiError = (err, req, res) => {
  // Log the error
  console.error('API Error:', err);
  
  // Set appropriate status code (default to 500 if not set)
  const statusCode = err.statusCode || 500;
  
  // Create error response object
  const errorResponse = {
    error: err.message || 'Internal Server Error',
    status: statusCode,
  };
  
  // Include stack trace in development mode
  if (appConfig.nodeEnv === 'development' && err.stack) {
    errorResponse.stack = err.stack;
  }
  
  // Send JSON response
  return res.status(statusCode).json(errorResponse);
};

/**
 * Handle web view errors (HTML responses)
 */
const handleViewError = (err, req, res) => {
  // Log the error
  console.error('View Error:', err);
  
  // Set appropriate status code (default to 500 if not set)
  const statusCode = err.statusCode || 500;
  
  // Create error data for view
  const errorData = {
    title: 'Error',
    message: err.message || 'Internal Server Error',
    error: {},
    basePath: appConfig.appBasePath
  };
  
  // Include error details in development mode
  if (appConfig.nodeEnv === 'development') {
    errorData.error = err;
  }
  
  // Render error view
  return res.status(statusCode).render('error', errorData);
};

/**
 * Main error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  // Skip if headers already sent
  if (res.headersSent) {
    return next(err);
  }
  
  // API routes (JSON responses)
  if (req.path.startsWith('/api/') || req.xhr || req.get('Accept') === 'application/json') {
    return handleApiError(err, req, res);
  }
  
  // Web routes (HTML responses)
  return handleViewError(err, req, res);
};

// Custom error class
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = {
  errorHandler,
  AppError
};

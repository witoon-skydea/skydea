const appConfig = require('../config/app');

/**
 * Middleware to check if user is authenticated
 */
exports.isAuthenticated = (req, res, next) => {
  console.log('isAuthenticated check:', {
    sessionID: req.sessionID,
    isAuthenticated: req.session.isAuthenticated,
    hasUser: !!req.session.user,
    userID: req.session.user?.id
  });
  
  if (req.session.isAuthenticated && req.session.user) {
    console.log('User is authenticated, proceeding to next middleware');
    return next();
  }
  
  console.log('User is NOT authenticated, redirecting to login');
  req.session.error = 'You need to be logged in to access this page';
  return res.redirect(appConfig.getPath('auth/login'));
};

/**
 * Middleware to check if user is authenticated or a trip is being shared
 * Used for trip routes that can be viewed by non-authenticated users if shared
 */
exports.isAuthenticatedOrShared = (req, res, next) => {
  console.log('isAuthenticatedOrShared middleware called');
  console.log('- Path:', req.path);
  console.log('- Query params:', req.query);
  console.log('- Is authenticated:', req.session.isAuthenticated || false);
  
  // If the user is authenticated, allow access
  if (req.session.isAuthenticated && req.session.user) {
    console.log('User is authenticated, allowing access');
    return next();
  }
  
  // If there's a share code in the query, allow access (the checkTripOwnership middleware will verify it)
  if (req.query.share) {
    console.log('Share code present, allowing access');
    return next();
  }
  
  // For API requests, return JSON response instead of redirecting
  if (req.path.includes('/api/') || req.headers.accept === 'application/json') {
    console.log('API request without authentication or share code, sending 401');
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  // Development mode bypass
  if (appConfig.nodeEnv === 'development') {
    console.log('Development mode: Allowing access without authentication');
    return next();
  }
  
  // If neither authenticated nor shared, redirect to login
  console.log('Not authenticated or shared, redirecting to login');
  req.session.error = 'You need to be logged in to access this page';
  return res.redirect(appConfig.getPath('auth/login'));
};

/**
 * Middleware to check if user is a guest (not authenticated)
 */
exports.isGuest = (req, res, next) => {
  if (!req.session.isAuthenticated || !req.session.user) {
    return next();
  }
  
  return res.redirect(appConfig.getPath('dashboard'));
};

/**
 * Middleware to make user data available in all views
 */
exports.setLocals = (req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.isAuthenticated = req.session.isAuthenticated || false;
  res.locals.basePath = appConfig.appBasePath;
  
  // Add flash messages to res.locals
  res.locals.success = req.flash ? req.flash('success') : null;
  res.locals.error = req.flash ? req.flash('error') : null;
  
  next();
};
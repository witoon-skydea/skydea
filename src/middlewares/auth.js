const appConfig = require('../config/app');

/**
 * Middleware to check if user is authenticated
 */
exports.isAuthenticated = (req, res, next) => {
  if (req.session.isAuthenticated && req.session.user) {
    return next();
  }
  
  req.session.error = 'You need to be logged in to access this page';
  return res.redirect(appConfig.getPath('login'));
};

/**
 * Middleware to check if user is authenticated or a trip is being shared
 * Used for trip routes that can be viewed by non-authenticated users if shared
 */
exports.isAuthenticatedOrShared = (req, res, next) => {
  // If the user is authenticated, allow access
  if (req.session.isAuthenticated && req.session.user) {
    return next();
  }
  
  // If there's a share code in the query, allow access (the checkTripOwnership middleware will verify it)
  if (req.query.share) {
    return next();
  }
  
  // If neither authenticated nor shared, redirect to login
  req.session.error = 'You need to be logged in to access this page';
  return res.redirect(appConfig.getPath('login'));
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
  next();
};
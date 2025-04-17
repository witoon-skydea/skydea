const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const cors = require('cors');
const appConfig = require('./config/app');

// Load routes
const indexRoutes = require('./routes/index');
const homeRoutes = require('./routes/home');  // Add new direct home routes
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const tripRoutes = require('./routes/trips');
const placeRoutes = require('./routes/places');
const itineraryRoutes = require('./routes/itinerary');

// Load middleware
const { setLocals } = require('./middlewares/auth');
const { errorHandler, AppError } = require('./middlewares/errorHandler');

// Initialize the Express app
const app = express();

// Set the view engine to ejs
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Configure express-ejs-layouts
app.use(require('express-ejs-layouts'));
app.set('layout', 'layouts/main');

// Middleware
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(session({
  secret: appConfig.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: appConfig.nodeEnv === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Add request logging middleware for debugging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  
  // Track response
  const originalSend = res.send;
  res.send = function(body) {
    // Log error responses for debugging
    if (res.statusCode >= 400) {
      console.error(`[ERROR] Status ${res.statusCode} for ${req.method} ${req.url}`);
      console.error('Response body:', typeof body === 'string' ? body.substring(0, 200) + '...' : body);
    }
    return originalSend.call(this, body);
  };
  
  next();
});

// Set up base path for static files
app.use(express.static(path.join(__dirname, '../public')));
// Also support the configured base path
app.use(appConfig.appBasePath, express.static(path.join(__dirname, '../public')));

// Set up the locals middleware
app.use(setLocals);

// API routes middleware to identify API requests
app.use(`${appConfig.appBasePath}api`, (req, res, next) => {
  req.isApiRequest = true;
  next();
});

// Direct root route handlers
app.use('/', homeRoutes);

// Set up web routes with base path
app.use(appConfig.appBasePath, indexRoutes);
app.use(`${appConfig.appBasePath}auth`, authRoutes);
app.use(`${appConfig.appBasePath}profile`, profileRoutes);
app.use(`${appConfig.appBasePath}trips`, tripRoutes);
app.use(`${appConfig.appBasePath}places`, placeRoutes);
app.use(`${appConfig.appBasePath}itinerary`, itineraryRoutes);

// Set up API routes - Use separate router instances for API routes
const apiTripRoutes = require('./routes/trips');
const apiPlaceRoutes = require('./routes/places');
const apiItineraryRoutes = require('./routes/itinerary');

app.use(`${appConfig.appBasePath}api/trips`, apiTripRoutes);
app.use(`${appConfig.appBasePath}api/places`, apiPlaceRoutes);
app.use(`${appConfig.appBasePath}api/itinerary`, apiItineraryRoutes);

// Log API routes for debugging
console.log(`API route base: ${appConfig.appBasePath}api/`);

// 404 handler
app.use((req, res, next) => {
  // API routes
  if (req.isApiRequest || req.path.startsWith(`${appConfig.appBasePath}api/`)) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  
  // Web routes
  res.status(404).render('error', {
    title: 'Page Not Found',
    message: 'The page you are looking for does not exist',
    error: {},
    basePath: appConfig.appBasePath
  });
});

// Global error handler
app.use(errorHandler);

// Start the server
const PORT = appConfig.port;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Base path: ${appConfig.appBasePath}`);
});

module.exports = app;
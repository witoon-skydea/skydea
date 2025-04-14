const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const cors = require('cors');
const appConfig = require('./config/app');

// Load routes
const indexRoutes = require('./routes/index');
const authRoutes = require('./routes/auth');

// Load middleware
const { setLocals } = require('./middlewares/auth');

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
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
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

// Set up base path for static files
app.use(appConfig.appBasePath, express.static(path.join(__dirname, '../public')));

// Set up the locals middleware
app.use(setLocals);

// Set up routes
app.use(appConfig.appBasePath, indexRoutes);
app.use(`${appConfig.appBasePath}auth`, authRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', {
    title: 'Error',
    message: 'Something went wrong',
    error: appConfig.nodeEnv === 'development' ? err : {},
    basePath: appConfig.appBasePath
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).render('error', {
    title: 'Page Not Found',
    message: 'The page you are looking for does not exist',
    error: {},
    basePath: appConfig.appBasePath
  });
});

// Start the server
const PORT = appConfig.port;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Base path: ${appConfig.appBasePath}`);
});

module.exports = app;
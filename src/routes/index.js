const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middlewares/auth');
const appConfig = require('../config/app');

// Home page - main route
router.get('/', (req, res) => {
  res.render('home', { 
    title: 'Welcome to Skydea',
    basePath: appConfig.appBasePath
  });
});

// Alternative home routes for navigation issues
router.get('/index', (req, res) => {
  res.redirect('/');
});

router.get('/home', (req, res) => {
  res.redirect('/');
});

// Dashboard (protected route)
router.get('/dashboard', isAuthenticated, (req, res) => {
  res.render('dashboard', { 
    title: 'Dashboard - Skydea',
    basePath: appConfig.appBasePath,
    user: req.session.user
  });
});

// Export router
module.exports = router;
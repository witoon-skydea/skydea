const express = require('express');
const router = express.Router();
const appConfig = require('../config/app');

// Direct home page handler
router.get('/', (req, res) => {
  console.log('Direct home route handler called');
  res.render('home', { 
    title: 'Welcome to Skydea',
    basePath: appConfig.appBasePath
  });
});

// Home page redirect
router.get('/home', (req, res) => {
  res.redirect('/');
});

// Additional index redirect
router.get('/index', (req, res) => {
  res.redirect('/');
});

module.exports = router;
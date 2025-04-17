const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middlewares/auth');
const profileController = require('../controllers/profileController');

// Profile page (protected route)
router.get('/', isAuthenticated, profileController.showProfile);

// Update Google Maps API key
router.post('/update-api-key', isAuthenticated, profileController.updateApiKey);

module.exports = router;
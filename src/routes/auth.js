const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { isGuest, isAuthenticated } = require('../middlewares/auth');

// Show login page (guests only)
router.get('/login', isGuest, authController.showLogin);

// Show registration page (guests only)
router.get('/register', isGuest, authController.showRegister);

// Process login form submission
router.post('/login', isGuest, authController.login);

// Process registration form submission
router.post('/register', isGuest, authController.register);

// Process logout
router.get('/logout', isAuthenticated, authController.logout);

module.exports = router;
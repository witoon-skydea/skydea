const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middlewares/auth');
const ApiKeyController = require('../controllers/apiKeyController');

// Render API keys management page
router.get('/', isAuthenticated, ApiKeyController.renderApiKeysPage);

// Create a new API key
router.post('/', isAuthenticated, ApiKeyController.createApiKey);

// Delete an API key
router.delete('/:id', isAuthenticated, ApiKeyController.deleteApiKey);

// Handle delete via POST for non-JavaScript environments
router.post('/:id/delete', isAuthenticated, ApiKeyController.deleteApiKey);

module.exports = router;
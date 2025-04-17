const ApiKey = require('../models/ApiKey');
const { AppError } = require('../middlewares/errorHandler');
const appConfig = require('../config/app');

/**
 * API Key management controller
 */
class ApiKeyController {
  /**
   * Render API keys management page
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async renderApiKeysPage(req, res, next) {
    try {
      // Get user's API keys
      const apiKeys = await ApiKey.findByUserId(req.session.user.id);
      
      res.render('profile-api-keys', {
        title: 'API Keys - Skydea',
        user: req.session.user,
        apiKeys,
        success: req.flash('success'),
        error: req.flash('error')
      });
    } catch (error) {
      console.error('Error rendering API keys page:', error);
      next(new AppError('Failed to load API keys', 500));
    }
  }

  /**
   * Create a new API key
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async createApiKey(req, res, next) {
    try {
      const { description } = req.body;
      
      // Create new API key
      const apiKey = await ApiKey.create({
        user_id: req.session.user.id,
        description: description || 'API Key' // Default description if not provided
      });
      
      // Flash success message and redirect
      req.flash('success', 'API key created successfully. Keep it secure!');
      
      // For API requests
      if (req.xhr || req.headers.accept.includes('application/json')) {
        return res.status(201).json({
          success: true,
          message: 'API key created successfully',
          data: apiKey
        });
      }
      
      // For web requests
      res.redirect(appConfig.getPath('api-keys'));
    } catch (error) {
      console.error('Error creating API key:', error);
      
      // Flash error message
      req.flash('error', 'Failed to create API key');
      
      // For API requests
      if (req.xhr || req.headers.accept.includes('application/json')) {
        return res.status(500).json({
          success: false,
          error: 'Failed to create API key'
        });
      }
      
      // For web requests
      res.redirect(appConfig.getPath('api-keys'));
    }
  }

  /**
   * Delete an API key
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async deleteApiKey(req, res, next) {
    try {
      const { id } = req.params;
      
      // Delete API key
      const result = await ApiKey.delete(id);
      
      if (!result) {
        // Flash error message
        req.flash('error', 'API key not found');
        
        // For API requests
        if (req.xhr || req.headers.accept.includes('application/json')) {
          return res.status(404).json({
            success: false,
            error: 'API key not found'
          });
        }
        
        // For web requests
        return res.redirect(appConfig.getPath('api-keys'));
      }
      
      // Flash success message
      req.flash('success', 'API key deleted successfully');
      
      // For API requests
      if (req.xhr || req.headers.accept.includes('application/json')) {
        return res.json({
          success: true,
          message: 'API key deleted successfully'
        });
      }
      
      // For web requests
      res.redirect(appConfig.getPath('api-keys'));
    } catch (error) {
      console.error('Error deleting API key:', error);
      
      // Flash error message
      req.flash('error', 'Failed to delete API key');
      
      // For API requests
      if (req.xhr || req.headers.accept.includes('application/json')) {
        return res.status(500).json({
          success: false,
          error: 'Failed to delete API key'
        });
      }
      
      // For web requests
      res.redirect(appConfig.getPath('api-keys'));
    }
  }
}

module.exports = ApiKeyController;
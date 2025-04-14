require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  sessionSecret: process.env.SESSION_SECRET || 'default_session_secret',
  appBasePath: process.env.APP_BASE_PATH || '/',
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Google Maps API configuration
  googleMaps: {
    apiKey: process.env.GOOGLE_MAPS_API_KEY || '',
    libraries: 'places'
  },
  
  // Helper function to generate proper paths considering the base path
  getPath: function(relativePath) {
    // Ensure relativePath doesn't start with a slash
    if (relativePath.startsWith('/')) {
      relativePath = relativePath.substring(1);
    }
    
    // Ensure appBasePath has a trailing slash
    let basePath = this.appBasePath;
    if (!basePath.endsWith('/') && basePath !== '') {
      basePath += '/';
    }
    
    return `${basePath}${relativePath}`;
  }
};
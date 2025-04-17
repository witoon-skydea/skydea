// Path Utility Functions
(function(window) {
  'use strict';

  // Log initialization for debugging
  console.log('Initializing Path Utilities with basePath:', window.appBasePath);

  // Normalize path to ensure it has a trailing slash
  function normalizePath(path) {
    if (!path) return '/';
    return path.endsWith('/') ? path : path + '/';
  }
  
  // Get the application base path from window.appBasePath or default to '/'
  function getBasePath() {
    return normalizePath(window.appBasePath || '/');
  }
  
  // Construct a URL with the base path
  function buildUrl(relativePath) {
    if (!relativePath) return getBasePath();
    
    const basePath = getBasePath();
    // Ensure relativePath doesn't start with a slash
    const cleanPath = relativePath.startsWith('/') ? relativePath.substring(1) : relativePath;
    return `${basePath}${cleanPath}`;
  }

  // Build API URL
  function buildApiUrl(endpoint, params = {}) {
    const basePath = getBasePath();
    // Ensure endpoint doesn't start with a slash
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
    const url = `${basePath}api/${cleanEndpoint}`;

    // Add query params if any
    if (Object.keys(params).length > 0) {
      const queryString = Object.entries(params)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&');
      return `${url}?${queryString}`;
    }

    return url;
  }

  // Check if URL is absolute (starts with http:// or https://)
  function isAbsoluteUrl(url) {
    return /^https?:\/\//i.test(url);
  }

  // Build resource URL (for images, CSS, JS, etc.)
  function buildResourceUrl(path) {
    if (isAbsoluteUrl(path)) return path;
    return buildUrl(path);
  }

  // Log any errors for debugging
  function logError(error) {
    console.error('PathUtil Error:', error);
  }

  // Safe wrapper for URL building
  function safeUrlBuilder(builder) {
    return function() {
      try {
        return builder.apply(null, arguments);
      } catch (error) {
        logError(error);
        return '/'; // Safe fallback
      }
    };
  }
  
  // Expose utility functions
  window.PathUtil = {
    normalizePath: safeUrlBuilder(normalizePath),
    getBasePath: safeUrlBuilder(getBasePath),
    buildUrl: safeUrlBuilder(buildUrl),
    buildApiUrl: safeUrlBuilder(buildApiUrl),
    buildResourceUrl: safeUrlBuilder(buildResourceUrl),
    isAbsoluteUrl: isAbsoluteUrl
  };

  // Log successful initialization
  console.log('PathUtil initialized successfully with base path:', getBasePath());
})(window);
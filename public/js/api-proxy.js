// API Proxy to handle all API requests consistently
(function(window) {
  'use strict';
  
  console.log('API Proxy initializing...');
  
  // Get base path from window or default to '/'
  function getBasePath() {
    return window.appBasePath || '/';
  }
  
  // Normalize path to ensure trailing slash
  function normalizePath(path) {
    if (!path) return '/';
    return path.endsWith('/') ? path : path + '/';
  }
  
  // Build API URL
  function buildApiUrl(endpoint, params = {}) {
    const basePath = getBasePath();
    const normalizedBasePath = normalizePath(basePath);
    
    // Clean endpoint (remove leading slash if present)
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
    
    // Build the URL
    let url = `${normalizedBasePath}api/${cleanEndpoint}`;
    
    // Add query params if any
    if (Object.keys(params).length > 0) {
      const queryParams = [];
      for (const key in params) {
        if (params[key] !== undefined && params[key] !== null) {
          queryParams.push(`${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`);
        }
      }
      if (queryParams.length > 0) {
        url += (url.includes('?') ? '&' : '?') + queryParams.join('&');
      }
    }
    
    console.log(`Built API URL: ${url}`);
    return url;
  }
  
  // Make API request with timeout
  async function request(endpoint, options = {}) {
    const { 
      method = 'GET',
      params = {},
      body = null,
      timeout = 20000,
      headers = {}
    } = options;
    
    // Build the URL with params
    const url = buildApiUrl(endpoint, params);
    
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    // Default headers
    const defaultHeaders = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    };
    
    // Merge default headers with provided headers
    const mergedHeaders = {...defaultHeaders, ...headers};
    
    try {
      // Log request
      console.log(`[API] ${method} ${url}`);
      
      // Make the request
      const response = await fetch(url, {
        method,
        headers: mergedHeaders,
        body: body ? JSON.stringify(body) : null,
        signal: controller.signal,
        credentials: 'same-origin'
      });
      
      // Clear timeout
      clearTimeout(timeoutId);
      
      // Log response status
      console.log(`[API] Response status: ${response.status}`);
      
      // Check if response is ok
      if (!response.ok) {
        // Try to get error message from response
        let errorMsg;
        try {
          const errorData = await response.json();
          errorMsg = errorData.error || `API error: ${response.status} ${response.statusText}`;
        } catch (e) {
          errorMsg = `API error: ${response.status} ${response.statusText}`;
        }
        
        throw new Error(errorMsg);
      }
      
      // Parse response
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      
      return await response.text();
    } catch (error) {
      // Clear timeout
      clearTimeout(timeoutId);
      
      // Check if it's an abort error
      if (error.name === 'AbortError') {
        throw new Error('Request timed out. Please try again.');
      }
      
      // Re-throw error
      throw error;
    }
  }
  
  // Export API
  window.ApiProxy = {
    get: (endpoint, params = {}) => request(endpoint, { method: 'GET', params }),
    post: (endpoint, body = {}, params = {}) => request(endpoint, { method: 'POST', body, params }),
    put: (endpoint, body = {}, params = {}) => request(endpoint, { method: 'PUT', body, params }),
    delete: (endpoint, params = {}) => request(endpoint, { method: 'DELETE', params }),
    buildUrl: buildApiUrl
  };
  
  console.log('API Proxy initialized successfully');
})(window);

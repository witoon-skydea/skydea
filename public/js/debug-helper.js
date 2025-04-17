// Debug Helper for Skydea
(function() {
  'use strict';
  
  // Log initialization
  console.log('Debug Helper initializing...');
  
  // Store original fetch function
  const originalFetch = window.fetch;
  
  // Override fetch to add debugging
  window.fetch = function(...args) {
    const startTime = performance.now();
    const url = args[0];
    const options = args[1] || {};
    
    console.log(`[DEBUG] Fetch request to: ${url}`);
    console.log('[DEBUG] Fetch options:', options);
    
    return originalFetch.apply(this, args)
      .then(response => {
        const endTime = performance.now();
        const duration = Math.round(endTime - startTime);
        
        console.log(`[DEBUG] Fetch response from: ${url}`);
        console.log(`[DEBUG] Status: ${response.status} ${response.statusText}`);
        console.log(`[DEBUG] Duration: ${duration}ms`);
        
        // Clone the response so we can still use it
        const clonedResponse = response.clone();
        
        // Try to log response body for debugging
        if (clonedResponse.headers.get('content-type')?.includes('application/json')) {
          clonedResponse.json()
            .then(data => {
              console.log('[DEBUG] Response data:', data);
            })
            .catch(error => {
              console.error('[DEBUG] Error parsing response as JSON:', error);
            });
        }
        
        return response;
      })
      .catch(error => {
        console.error(`[DEBUG] Fetch error for: ${url}`);
        console.error('[DEBUG] Error details:', error);
        throw error;
      });
  };
  
  // Add URL parameter parser
  function getUrlParameters() {
    const params = {};
    const queryString = window.location.search.substring(1);
    const pairs = queryString.split('&');
    
    for (let i = 0; i < pairs.length; i++) {
      const pair = pairs[i].split('=');
      if (pair[0]) {
        params[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
      }
    }
    
    return params;
  }
  
  // Create debug panel
  function createDebugPanel() {
    const panel = document.createElement('div');
    panel.id = 'debug-panel';
    panel.style.cssText = 'position: fixed; bottom: 0; right: 0; width: 400px; height: 300px; background: rgba(0,0,0,0.8); color: white; font-family: monospace; font-size: 12px; padding: 10px; overflow: auto; z-index: 10000; display: none;';
    
    const closeButton = document.createElement('button');
    closeButton.textContent = 'X';
    closeButton.style.cssText = 'position: absolute; top: 5px; right: 5px; background: #f44336; color: white; border: none; padding: 2px 5px; cursor: pointer;';
    closeButton.onclick = function() {
      panel.style.display = 'none';
    };
    
    const title = document.createElement('h3');
    title.textContent = 'Skydea Debug Panel';
    title.style.cssText = 'margin-top: 0; margin-bottom: 10px; border-bottom: 1px solid #555;';
    
    const content = document.createElement('div');
    content.id = 'debug-panel-content';
    
    panel.appendChild(closeButton);
    panel.appendChild(title);
    panel.appendChild(content);
    
    document.body.appendChild(panel);
    
    return {
      panel,
      content,
      show: function() {
        panel.style.display = 'block';
      },
      hide: function() {
        panel.style.display = 'none';
      },
      log: function(message) {
        const line = document.createElement('div');
        line.innerHTML = message;
        line.style.cssText = 'margin-bottom: 5px; border-bottom: 1px dotted #333; padding-bottom: 5px;';
        content.appendChild(line);
        content.scrollTop = content.scrollHeight;
      },
      clear: function() {
        content.innerHTML = '';
      }
    };
  }
  
  // Main debug function
  function initDebug() {
    // Only init in development mode or when debug parameter is present
    const params = getUrlParameters();
    const forceDebug = params.debug === 'true' || params.debug === '1';
    
    // Check if we should enable debugging
    if (!forceDebug) {
      // Check if we're in development environment
      const isDevelopment = window.location.hostname === 'localhost' || 
                           window.location.hostname === '127.0.0.1' ||
                           window.location.hostname.includes('local');
                           
      if (!isDevelopment) {
        return; // Don't initialize debugging in production
      }
    }
    
    // Create debug panel
    const debugPanel = createDebugPanel();
    
    // Store reference globally
    window.skydeaDebug = debugPanel;
    
    // Log initial information
    debugPanel.log(`<b>URL:</b> ${window.location.href}`);
    debugPanel.log(`<b>Base Path:</b> ${window.appBasePath || '/'}`);
    
    if (window.tripData) {
      debugPanel.log(`<b>Trip ID:</b> ${window.tripData.tripId}`);
      debugPanel.log(`<b>Is Owner:</b> ${window.tripData.isOwner}`);
      debugPanel.log(`<b>Is Public:</b> ${window.tripData.isPublic}`);
      debugPanel.log(`<b>Share Code:</b> ${window.tripData.shareCode || 'None'}`);
    }
    
    // Add keyboard shortcut to toggle panel
    document.addEventListener('keydown', function(e) {
      // Alt+Shift+D to toggle debug panel
      if (e.altKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        if (debugPanel.panel.style.display === 'none') {
          debugPanel.show();
        } else {
          debugPanel.hide();
        }
      }
    });
    
    console.log('Debug helper initialized. Press Alt+Shift+D to show debug panel.');
    
    // Auto-show if forceDebug is true
    if (forceDebug) {
      debugPanel.show();
    }
  }
  
  // Initialize when the DOM is loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDebug);
  } else {
    initDebug();
  }
})();
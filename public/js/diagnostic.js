// Diagnostic Helper for Skydea
(function() {
  'use strict';

  // Log initialization
  console.log('Diagnostic tools loading...');

  // Create diagnostic container
  function createDiagnosticUI() {
    // Create floating diagnostic button
    const button = document.createElement('button');
    button.innerHTML = '🛠️';
    button.title = 'Show Diagnostic Tools (Alt+D)';
    button.className = 'diagnostic-button';
    button.style.cssText = 'position: fixed; bottom: 10px; right: 10px; z-index: 9999; padding: 10px; border-radius: 50%; background: #007bff; color: white; border: none; cursor: pointer; width: 40px; height: 40px; font-size: 16px;';
    
    document.body.appendChild(button);
    
    // Create diagnostic panel (hidden initially)
    const panel = document.createElement('div');
    panel.className = 'diagnostic-panel';
    panel.style.cssText = 'display: none; position: fixed; bottom: 60px; right: 10px; z-index: 9999; background: white; border: 1px solid #ccc; border-radius: 5px; width: 400px; max-height: 80vh; overflow-y: auto; padding: 10px; box-shadow: 0 0 15px rgba(0,0,0,0.2);';
    
    document.body.appendChild(panel);
    
    // Toggle panel when button is clicked
    button.addEventListener('click', function() {
      if (panel.style.display === 'none') {
        openDiagnosticPanel();
      } else {
        panel.style.display = 'none';
      }
    });
    
    // Also toggle with Alt+D keyboard shortcut
    document.addEventListener('keydown', function(e) {
      if (e.altKey && e.key === 'd') {
        e.preventDefault();
        if (panel.style.display === 'none') {
          openDiagnosticPanel();
        } else {
          panel.style.display = 'none';
        }
      }
    });
    
    // Create close button for panel
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '&times;';
    closeButton.style.cssText = 'position: absolute; top: 5px; right: 5px; background: none; border: none; font-size: 20px; cursor: pointer;';
    closeButton.addEventListener('click', function() {
      panel.style.display = 'none';
    });
    
    panel.appendChild(closeButton);
    
    return {
      button,
      panel,
      openPanel: function() {
        panel.style.display = 'block';
      },
      closePanel: function() {
        panel.style.display = 'none';
      }
    };
  }
  
  // Open and populate diagnostic panel
  function openDiagnosticPanel() {
    const ui = window.diagnosticUI || (window.diagnosticUI = createDiagnosticUI());
    const panel = ui.panel;
    
    // Clear previous content (except close button)
    while (panel.childNodes.length > 1) {
      panel.removeChild(panel.lastChild);
    }
    
    // Add title
    const title = document.createElement('h4');
    title.textContent = 'Skydea Diagnostic Tools';
    title.style.cssText = 'margin-bottom: 15px; padding-bottom: 5px; border-bottom: 1px solid #ccc;';
    panel.appendChild(title);
    
    // Add environment info
    const envSection = createSection('Environment');
    
    addInfo(envSection, 'App Base Path', window.appBasePath || 'Not set');
    addInfo(envSection, 'Page URL', window.location.href);
    addInfo(envSection, 'Pathname', window.location.pathname);
    
    panel.appendChild(envSection);
    
    // Add trip info if available
    if (window.tripData) {
      const tripSection = createSection('Trip Information');
      
      addInfo(tripSection, 'Trip ID', window.tripData.tripId);
      addInfo(tripSection, 'Is Owner', window.tripData.isOwner);
      addInfo(tripSection, 'Is Public', window.tripData.isPublic);
      addInfo(tripSection, 'Share Code', window.tripData.shareCode || 'None');
      
      panel.appendChild(tripSection);
    }
    
    // Add network test section
    const networkSection = createSection('Network Tests');
    
    // Add test button
    const testButton = document.createElement('button');
    testButton.textContent = 'Test API Endpoints';
    testButton.className = 'btn btn-sm btn-primary';
    testButton.style.marginBottom = '10px';
    
    testButton.addEventListener('click', function() {
      testApiEndpoints(networkSection);
    });
    
    networkSection.appendChild(testButton);
    panel.appendChild(networkSection);
    
    // JavaScript info section
    const jsSection = createSection('JavaScript Environment');
    
    // Add info about loaded scripts
    const scripts = Array.from(document.scripts)
      .map(script => script.src || 'Inline script')
      .filter(src => src !== 'Inline script');
    
    addInfo(jsSection, 'Loaded Scripts', scripts.length);
    
    const scriptsList = document.createElement('ul');
    scriptsList.style.fontSize = '0.85em';
    scriptsList.style.marginTop = '5px';
    
    scripts.forEach(src => {
      const li = document.createElement('li');
      li.textContent = src;
      scriptsList.appendChild(li);
    });
    
    jsSection.appendChild(scriptsList);
    panel.appendChild(jsSection);
    
    // Fix section
    const fixSection = createSection('Quick Fixes');
    
    // Add reload buttons
    const reloadButton = document.createElement('button');
    reloadButton.textContent = 'Reload Page';
    reloadButton.className = 'btn btn-sm btn-secondary mr-2';
    reloadButton.style.marginRight = '10px';
    reloadButton.addEventListener('click', function() {
      window.location.reload();
    });
    
    const hardReloadButton = document.createElement('button');
    hardReloadButton.textContent = 'Hard Reload (Clear Cache)';
    hardReloadButton.className = 'btn btn-sm btn-warning';
    hardReloadButton.addEventListener('click', function() {
      window.location.reload(true);
    });
    
    fixSection.appendChild(reloadButton);
    fixSection.appendChild(hardReloadButton);
    
    panel.appendChild(fixSection);
    
    // Show the panel
    panel.style.display = 'block';
  }
  
  // Create a collapsible section
  function createSection(title) {
    const section = document.createElement('div');
    section.className = 'diagnostic-section';
    section.style.cssText = 'margin-bottom: 15px; background: #f8f9fa; border-radius: 5px; padding: 10px;';
    
    const sectionTitle = document.createElement('h5');
    sectionTitle.textContent = title;
    sectionTitle.style.cssText = 'margin-bottom: 10px; font-size: 1rem;';
    
    section.appendChild(sectionTitle);
    return section;
  }
  
  // Add info item to a section
  function addInfo(section, label, value) {
    const item = document.createElement('div');
    item.style.cssText = 'margin-bottom: 5px;';
    
    const labelSpan = document.createElement('span');
    labelSpan.textContent = label + ': ';
    labelSpan.style.fontWeight = 'bold';
    
    const valueSpan = document.createElement('span');
    valueSpan.textContent = value;
    
    item.appendChild(labelSpan);
    item.appendChild(valueSpan);
    section.appendChild(item);
  }
  
  // Test API endpoints
  function testApiEndpoints(container) {
    // Clear previous results
    const oldResults = container.querySelector('.test-results');
    if (oldResults) {
      container.removeChild(oldResults);
    }
    
    // Create results div
    const results = document.createElement('div');
    results.className = 'test-results';
    results.style.marginTop = '10px';
    
    const loadingIndicator = document.createElement('div');
    loadingIndicator.textContent = 'Testing API endpoints...';
    loadingIndicator.style.fontStyle = 'italic';
    
    results.appendChild(loadingIndicator);
    container.appendChild(results);
    
    // Test endpoints
    const endpoints = [];
    
    // Base endpoints
    endpoints.push('');
    endpoints.push('api');
    
    // If trip planner, add trip-specific endpoints
    if (window.tripData && window.tripData.tripId) {
      endpoints.push(`api/trips/${window.tripData.tripId}`);
    }
    
    // Run tests
    Promise.all(endpoints.map(testEndpoint))
      .then(endpointResults => {
        // Remove loading indicator
        results.removeChild(loadingIndicator);
        
        // Create results table
        const table = document.createElement('table');
        table.className = 'table table-sm';
        table.style.cssText = 'width: 100%; font-size: 0.85em; border-collapse: collapse;';
        
        // Add header
        const thead = document.createElement('thead');
        thead.innerHTML = `
          <tr>
            <th style="border: 1px solid #dee2e6; padding: 5px;">Endpoint</th>
            <th style="border: 1px solid #dee2e6; padding: 5px;">Status</th>
            <th style="border: 1px solid #dee2e6; padding: 5px;">Time</th>
          </tr>
        `;
        table.appendChild(thead);
        
        // Add body
        const tbody = document.createElement('tbody');
        
        endpointResults.forEach(result => {
          const row = document.createElement('tr');
          
          const endpointCell = document.createElement('td');
          endpointCell.textContent = result.endpoint;
          endpointCell.style.cssText = 'border: 1px solid #dee2e6; padding: 5px;';
          
          const statusCell = document.createElement('td');
          statusCell.textContent = result.status;
          statusCell.style.cssText = 'border: 1px solid #dee2e6; padding: 5px;';
          
          // Add color based on status
          if (result.status.startsWith('2')) {
            statusCell.style.color = 'green';
          } else {
            statusCell.style.color = 'red';
          }
          
          const timeCell = document.createElement('td');
          timeCell.textContent = `${result.time}ms`;
          timeCell.style.cssText = 'border: 1px solid #dee2e6; padding: 5px;';
          
          row.appendChild(endpointCell);
          row.appendChild(statusCell);
          row.appendChild(timeCell);
          
          tbody.appendChild(row);
        });
        
        table.appendChild(tbody);
        results.appendChild(table);
      })
      .catch(error => {
        // Remove loading indicator
        results.removeChild(loadingIndicator);
        
        // Show error
        const errorDiv = document.createElement('div');
        errorDiv.className = 'alert alert-danger';
        errorDiv.textContent = `Error running tests: ${error.message}`;
        results.appendChild(errorDiv);
      });
  }
  
  // Test a single endpoint
  function testEndpoint(endpoint) {
    const basePath = window.appBasePath || '/';
    const normalizedPath = basePath.endsWith('/') ? basePath : basePath + '/';
    const url = `${normalizedPath}${endpoint}`;
    
    const startTime = performance.now();
    
    return fetch(url, { 
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    })
    .then(response => {
      const endTime = performance.now();
      const time = Math.round(endTime - startTime);
      
      return {
        endpoint: url,
        status: `${response.status} ${response.statusText}`,
        time: time
      };
    })
    .catch(error => {
      const endTime = performance.now();
      const time = Math.round(endTime - startTime);
      
      return {
        endpoint: url,
        status: `Error: ${error.message}`,
        time: time
      };
    });
  }
  
  // Initialize diagnostic tools when DOM is loaded
  document.addEventListener('DOMContentLoaded', function() {
    console.log('Diagnostic tools initialized');
    window.diagnosticUI = createDiagnosticUI();
    
    // Check for URL parameter to auto-open diagnostic panel
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('diagnostics')) {
      setTimeout(function() {
        openDiagnosticPanel();
      }, 1000);
    }
  });
  
  // Export diagnostic functions to global scope
  window.SkydearDiagnostics = {
    openPanel: openDiagnosticPanel,
    testApiEndpoints: testApiEndpoints
  };
  
  console.log('Diagnostic tools loaded successfully');
})();
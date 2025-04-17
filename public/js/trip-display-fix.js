// Emergency Display Fix for Trip Planner
// This script will directly show trip data regardless of other JavaScript files
(function() {
  'use strict';
  
  console.log('Emergency Trip Display Fix loading...');
  
  // Wait for DOM to be ready
  document.addEventListener('DOMContentLoaded', function() {
    console.log('Emergency Trip Display Fix running...');
    
    setTimeout(function() {
      displayEmergencyInfo();
    }, 1000); // Wait 1 second to ensure other scripts have had a chance to run
  });
  
  function displayEmergencyInfo() {
    console.log('Attempting to display emergency trip info...');
    
    // Get trip ID and base path
    const tripPlannerApp = document.getElementById('trip-planner-app');
    if (!tripPlannerApp) {
      console.error('Trip planner app element not found');
      return;
    }
    
    const tripId = tripPlannerApp.dataset.tripId;
    const basePath = tripPlannerApp.dataset.basePath || '/';
    
    console.log('Emergency fix with trip ID:', tripId, 'and base path:', basePath);
    
    // Create emergency display container
    const emergencyDisplay = document.createElement('div');
    emergencyDisplay.className = 'alert alert-warning mt-3';
    emergencyDisplay.innerHTML = `
      <h4><i class="fas fa-exclamation-triangle"></i> Emergency Trip Data Display</h4>
      <p>This is an emergency display of trip data. Regular display may not be working correctly.</p>
      <p><strong>Trip ID:</strong> ${tripId}</p>
      <p><strong>Base Path:</strong> ${basePath}</p>
      <div id="emergency-data-display"></div>
      <button class="btn btn-primary mt-2" id="emergency-load-btn">Load Trip Data Directly</button>
    `;
    
    // Find a suitable place to insert this
    const container = document.querySelector('.container');
    if (container) {
      container.prepend(emergencyDisplay);
    } else {
      document.body.prepend(emergencyDisplay);
    }
    
    // Add event listener to load button
    document.getElementById('emergency-load-btn').addEventListener('click', function() {
      loadEmergencyTripData(tripId, basePath);
    });
    
    // Load data immediately
    loadEmergencyTripData(tripId, basePath);
  }
  
  function loadEmergencyTripData(tripId, basePath) {
    const normalizedBasePath = basePath.endsWith('/') ? basePath : basePath + '/';
    const shareCode = window.tripData?.shareCode || '';
    const shareParam = shareCode ? `?share=${shareCode}` : '';
    
    const apiUrl = `${normalizedBasePath}api/trips/${tripId}${shareParam}`;
    console.log('Loading emergency trip data from:', apiUrl);
    
    const displayEl = document.getElementById('emergency-data-display');
    if (displayEl) {
      displayEl.innerHTML = '<div class="text-center py-3"><div class="spinner-border text-primary"></div><p class="mt-2">Loading emergency data...</p></div>';
    }
    
    // Load data directly
    fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      cache: 'no-store'
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      console.log('Emergency trip data loaded:', data);
      displayEmergencyTripData(data);
    })
    .catch(error => {
      console.error('Error loading emergency trip data:', error);
      if (displayEl) {
        displayEl.innerHTML = `
          <div class="alert alert-danger">
            <p><strong>Error:</strong> ${error.message}</p>
            <p>Try the following URLs manually:</p>
            <ul>
              <li><a href="${apiUrl}" target="_blank">Trip API URL</a></li>
              <li><a href="${normalizedBasePath}api/places/trip/${tripId}${shareParam}" target="_blank">Places API URL</a></li>
            </ul>
          </div>
        `;
      }
    });
  }
  
  function displayEmergencyTripData(data) {
    const displayEl = document.getElementById('emergency-data-display');
    if (!displayEl) return;
    
    if (!data || !data.trip) {
      displayEl.innerHTML = '<div class="alert alert-danger">No valid trip data received from API</div>';
      return;
    }
    
    const trip = data.trip;
    const places = data.places || [];
    const itineraryItems = data.itineraryItems || [];
    
    let html = `
      <div class="card mt-3">
        <div class="card-header bg-primary text-white">
          <h5 class="mb-0">Trip Details (Emergency Display)</h5>
        </div>
        <div class="card-body">
          <h6>${trip.title}</h6>
          <p>${trip.description || 'No description'}</p>
          <p><strong>Dates:</strong> ${new Date(trip.start_date).toLocaleDateString()} - ${new Date(trip.end_date).toLocaleDateString()}</p>
          <p><strong>Places:</strong> ${places.length}</p>
          <p><strong>Activities:</strong> ${itineraryItems.length}</p>
        </div>
      </div>
    `;
    
    // Display places
    if (places.length > 0) {
      html += `
        <div class="card mt-3">
          <div class="card-header bg-secondary text-white">
            <h5 class="mb-0">Places (${places.length})</h5>
          </div>
          <div class="card-body">
            <div class="row">
      `;
      
      places.forEach(place => {
        html += `
          <div class="col-md-4 mb-3">
            <div class="card h-100">
              <div class="card-body">
                <h6>${place.name}</h6>
                <p class="small text-muted">${place.address || 'No address'}</p>
                <span class="badge bg-secondary">${place.category || 'Uncategorized'}</span>
              </div>
            </div>
          </div>
        `;
      });
      
      html += `
            </div>
          </div>
        </div>
      `;
    }
    
    // Also try to restore normal UI
    tryRestoreNormalUI(data);
    
    displayEl.innerHTML = html;
  }
  
  function tryRestoreNormalUI(data) {
    // Try to update any counters on the page
    const trip = data.trip;
    const places = data.places || [];
    const itineraryItems = data.itineraryItems || [];
    
    // Update all counters
    document.getElementById('place-count').textContent = places.length;
    
    if (trip.start_date && trip.end_date) {
      const startDate = new Date(trip.start_date);
      const endDate = new Date(trip.end_date);
      const diffTime = Math.abs(endDate - startDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      
      document.getElementById('day-count').textContent = diffDays;
    }
    
    document.getElementById('activity-count').textContent = itineraryItems.length;
    
    // Try to show highlights
    const placesHighlights = document.getElementById('places-highlights');
    const placesLoading = document.getElementById('places-loading');
    const placesEmpty = document.getElementById('places-empty');
    const highlightsContainer = document.getElementById('highlights-container');
    
    if (placesLoading) placesLoading.classList.add('d-none');
    
    if (places.length === 0) {
      if (placesEmpty) placesEmpty.classList.remove('d-none');
    } else if (placesHighlights && highlightsContainer) {
      placesHighlights.classList.remove('d-none');
      
      const highlightPlaces = places.slice(0, 3);
      highlightsContainer.innerHTML = highlightPlaces.map(place => `
        <div class="col-md-4">
          <div class="card h-100 place-card">
            <div class="place-image" style="background-image: url('${place.image_url || basePath + 'images/placeholder.jpg'}')"></div>
            <div class="card-body">
              <h5 class="card-title">${place.name}</h5>
              <p class="card-text small text-muted">${place.address || 'No address available'}</p>
              <div class="place-category">
                <span class="badge bg-secondary">${place.category || 'Uncategorized'}</span>
              </div>
            </div>
          </div>
        </div>
      `).join('');
    }
    
    // Hide all loading indicators
    document.querySelectorAll('.spinner-border').forEach(el => {
      const loadingContainer = el.closest('[id$="-loading"]');
      if (loadingContainer) {
        loadingContainer.classList.add('d-none');
      }
    });
  }
})();

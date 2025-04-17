// Fix for Trip Planner API Paths
(function() {
  'use strict';
  
  console.log('Loading Trip Planner path fixes...');
  
  // Wait for DOM to be fully loaded
  document.addEventListener('DOMContentLoaded', function() {
    console.log('Trip Planner path fix initialized');
    
    // Give time for other scripts to load
    setTimeout(fixTripPlannerPaths, 500);
  });
  
  // Fix trip planner path issues
  function fixTripPlannerPaths() {
    // Check if we're on the trip planner page
    const tripPlannerApp = document.getElementById('trip-planner-app');
    if (!tripPlannerApp) {
      console.log('Not on trip planner page, fix not needed');
      return;
    }
    
    console.log('Applying Trip Planner path fixes');
    
    // Make sure we have the correct base path
    if (!window.appBasePath) {
      window.appBasePath = tripPlannerApp.dataset.basePath || '/';
      console.log('Set appBasePath from data attribute:', window.appBasePath);
    }
    
    // Get trip ID from the data attribute
    const tripId = tripPlannerApp.dataset.tripId;
    if (!tripId) {
      console.error('Trip ID not found in data attribute');
      return;
    }
    
    // Fix loading places if not already loaded
    const placesLoading = document.getElementById('places-loading');
    const placesHighlights = document.getElementById('places-highlights');
    
    if (placesLoading && !placesLoading.classList.contains('d-none') && 
        placesHighlights && placesHighlights.classList.contains('d-none')) {
      
      console.log('Places still loading, applying fixes');
      
      // Get the normalized base path
      let basePath = window.appBasePath || '/';
      basePath = basePath.endsWith('/') ? basePath : basePath + '/';
      
      // Check if we have a share code
      const shareCode = window.tripData?.shareCode || '';
      const shareParam = shareCode ? `?share=${shareCode}` : '';
      
      // Construct the places API URL
      const placesUrl = `${basePath}api/places/trip/${tripId}${shareParam}`;
      console.log('Manually fetching places from:', placesUrl);
      
      // Fetch places
      fetch(placesUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`API returned ${response.status} ${response.statusText}`);
        }
        return response.json();
      })
      .then(data => {
        console.log('Successfully fetched places data manually:', data);
        
        // Store the places data in a global variable 
        // for trip-planner.js to use when it loads
        window.manuallyFetchedPlaces = data;
        
        // Hide loading indicator
        placesLoading.classList.add('d-none');
        
        // If there are places, show them, otherwise show empty state
        if (data && data.length > 0) {
          placesHighlights.classList.remove('d-none');
          
          // Update the UI with places data
          updatePlacesUI(data);
        } else {
          const placesEmpty = document.getElementById('places-empty');
          if (placesEmpty) {
            placesEmpty.classList.remove('d-none');
          }
        }
      })
      .catch(error => {
        console.error('Error fetching places:', error);
        
        // Show error message
        placesLoading.innerHTML = `
          <div class="alert alert-danger">
            <p><strong>Error loading places:</strong> ${error.message}</p>
            <p>Try refreshing the page or contact support.</p>
          </div>
        `;
      });
    }
  }
  
  // Update UI with places data
  function updatePlacesUI(places) {
    // Update places counter
    const placeCount = document.getElementById('place-count');
    if (placeCount) {
      placeCount.textContent = places.length;
    }
    
    // Update place highlights
    const highlightsContainer = document.getElementById('highlights-container');
    if (highlightsContainer && places.length > 0) {
      // Display at most 3 places in highlights
      const displayPlaces = places.slice(0, 3);
      
      highlightsContainer.innerHTML = displayPlaces.map(place => `
        <div class="col-md-4">
          <div class="card h-100 place-card">
            <div class="place-image" style="background-image: url('${place.image_url || window.appBasePath + 'images/placeholder.jpg'}')"></div>
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
  }
})();
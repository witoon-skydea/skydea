// Trip Planner Application JavaScript - FIXED VERSION
document.addEventListener('DOMContentLoaded', function() {
  console.log('Trip Planner Fixed Version Initializing...');
  
  // ------------------- HELPER FUNCTIONS -------------------
  
  // Format helpers
  function getCategoryIcon(category) {
    const icons = {
      'hotel': 'fa-hotel',
      'restaurant': 'fa-utensils',
      'shopping': 'fa-shopping-bag',
      'sight seeing': 'fa-camera',
      'transportation': 'fa-bus',
      'other': 'fa-map-marker-alt'
    };
    return icons[category] || 'fa-map-marker-alt';
  }
  
  function getPlaceCategoryIcon(placeId) {
    if (!placeId) return '';
    const place = placesData.find(p => p.id === placeId);
    if (place && place.category) {
      const categoryClass = place.category.replace(/\s+/g, '-').toLowerCase();
      return `<span class="category-badge ${categoryClass}"><i class="fas ${getCategoryIcon(place.category)}"></i> ${place.category}</span>`;
    }
    return '';
  }
  
  function formatTime(timeString) {
    if (!timeString) return '';
    if (/^\d{1,2}:\d{2}$/.test(timeString)) {
      return timeString;
    }
    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch (error) {
      console.error('Error formatting time:', error);
      return timeString || '';
    }
  }
  
  function formatDate(dateString) {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  }
  
  // UI notification
  function showToast(message, type = 'info') {
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
      document.body.appendChild(toastContainer);
    }
    
    const toastId = 'toast-' + Date.now();
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    toast.id = toastId;
    toast.innerHTML = `
      <div class="toast-header bg-${type} text-white">
        <strong class="me-auto">Trip Planner</strong>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
      <div class="toast-body">
        ${message}
      </div>
    `;
    toastContainer.appendChild(toast);

    const bsToast = new bootstrap.Toast(toast, {
      autohide: true,
      delay: 5000
    });
    bsToast.show();
    
    toast.addEventListener('hidden.bs.toast', function() {
      toast.remove();
    });
  }
  
  // ------------------- INITIALIZATION -------------------
  
  // Get base data
  const tripPlannerApp = document.getElementById('trip-planner-app');
  const tripId = tripPlannerApp?.dataset.tripId || window.tripData?.tripId;
  const basePath = tripPlannerApp?.dataset.basePath || window.appBasePath || '/';
  const isOwner = window.tripData?.isOwner === true;
  const isPublic = window.tripData?.isPublic === true;
  let shareCode = window.tripData?.shareCode || '';
  
  // Debug log
  console.log('Trip Planner Base Configuration:', { 
    tripId, 
    basePath, 
    isOwner, 
    isPublic, 
    shareCode 
  });
  
  // Validate required data
  if (!tripId || !tripPlannerApp) {
    console.error('Trip ID not found in dataset or trip-planner-app element not found');
    showToast('Error: Trip information not found', 'danger');
    return;
  }
  
  // State variables
  let tripData = null;
  let placesData = [];
  let itineraryData = [];
  let selectedPlace = null;
  let map = null;
  let markers = [];
  let directionsService = null;
  let directionsRenderer = null;
  
  // ------------------- API FUNCTIONS -------------------
  
  // Get trip data from API
  async function loadTripData() {
    try {
      // Create error container if needed
      const tripPlannerEl = document.getElementById('trip-planner-app');
      let errorContainer = document.getElementById('api-error-container');
      
      if (!errorContainer) {
        errorContainer = document.createElement('div');
        errorContainer.className = 'alert alert-danger';
        errorContainer.id = 'api-error-container';
        errorContainer.style.display = 'none';
        tripPlannerEl.prepend(errorContainer);
      }
      
      // Prepare API URL
      let apiUrl = '';
      const params = shareCode ? { share: shareCode } : {};
      
      // Use ApiProxy if available, or fallback to manual URL construction
      if (window.ApiProxy) {
        console.log('Using ApiProxy to load trip data');
        try {
          const data = await window.ApiProxy.get(`trips/${tripId}`, params);
          console.log('Trip data loaded successfully:', data);
          
          processTripData(data);
          return;
        } catch (error) {
          console.error('Error using ApiProxy:', error);
          showToast('Error loading data via API Proxy: ' + error.message, 'danger');
          // Continue with fallback
        }
      }
      
      // Fallback to manual URL construction if ApiProxy failed or is not available
      console.log('Falling back to manual URL construction');
      const normalizedBasePath = basePath.endsWith('/') ? basePath : basePath + '/';
      const shareParam = shareCode ? `?share=${shareCode}` : '';
      apiUrl = `${normalizedBasePath}api/trips/${tripId}${shareParam}`;
      
      console.log('Loading trip data from URL:', apiUrl);
      
      // Execute the fetch with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);
      
      try {
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
          },
          signal: controller.signal,
          cache: 'no-store'
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          let errorMessage = `Failed to load trip data: ${response.status} ${response.statusText}`;
          try {
            const errorText = await response.text();
            console.error('API error response:', errorText);
            
            try {
              const errorJson = JSON.parse(errorText);
              if (errorJson.error) {
                errorMessage = errorJson.error;
              }
            } catch (e) {
              // Not JSON, use text as is
            }
          } catch (e) {
            console.error('Error reading response text:', e);
          }
          
          errorContainer.innerHTML = `
            <h4>Error Loading Trip Data (${response.status})</h4>
            <p>${errorMessage}</p>
            <div class="mt-3">
              <button class="btn btn-primary me-2" onclick="window.location.reload()">Retry</button>
              <button class="btn btn-outline-secondary" onclick="window.history.back()">Go Back</button>
            </div>
            <hr>
            <div class="small text-muted">
              <p>Technical details:</p>
              <pre class="bg-light p-2">${response.status} ${response.statusText}\nURL: ${apiUrl}</pre>
            </div>
          `;
          errorContainer.style.display = 'block';
          hideAllLoadingElements();
          
          throw new Error(errorMessage);
        }
        
        const data = await response.json();
        console.log('Trip data loaded successfully via direct fetch:', data);
        
        processTripData(data);
      } catch (error) {
        clearTimeout(timeoutId);
        
        if (error.name === 'AbortError') {
          errorContainer.innerHTML = `
            <h4>Request Timeout</h4>
            <p>The request took too long to complete. This might be due to network issues or server load.</p>
            <div class="mt-3">
              <button class="btn btn-primary me-2" onclick="window.location.reload()">Retry</button>
              <button class="btn btn-outline-secondary" onclick="window.history.back()">Go Back</button>
            </div>
          `;
          errorContainer.style.display = 'block';
          hideAllLoadingElements();
          throw new Error('Request timed out. Please try again.');
        }
        
        throw error;
      }
    } catch (error) {
      console.error('Error loading trip data:', error);
      showToast('Error loading trip data: ' + error.message, 'danger');
      hideAllLoadingElements();
      throw error;
    }
  }
  
  // Process the loaded trip data
  function processTripData(data) {
    if (!data.trip) {
      console.error('Trip data structure invalid:', data);
      const errorContainer = document.getElementById('api-error-container');
      if (errorContainer) {
        errorContainer.innerHTML = `
          <h4>Error Processing Trip Data</h4>
          <p>The server returned an invalid data structure.</p>
          <div class="mt-3">
            <button class="btn btn-primary me-2" onclick="window.location.reload()">Retry</button>
            <button class="btn btn-outline-secondary" onclick="window.history.back()">Go Back</button>
          </div>
        `;
        errorContainer.style.display = 'block';
      }
      hideAllLoadingElements();
      throw new Error('Invalid trip data structure received from API');
    }

    // Store data in global state
    tripData = data.trip;
    placesData = data.places || [];
    itineraryData = data.itineraryItems || [];
    
    console.log('Data processed:', {
      tripData: tripData,
      placesCount: placesData.length,
      itineraryCount: itineraryData.length
    });

    // Update UI components
    updateTripDuration();
    updateCounters();
    setTripCoverImage();
    renderPlacesHighlights();
    renderPlacesTable();
    renderItinerary();

    // Initialize map if on the map tab
    if (window.location.hash === '#map') {
      initializeMap();
    }
  }
  
  // Load data from any available source - including manually fetched data
  async function loadFromAnySource() {
    // Check if data was already manually fetched by fix-trips.js
    if (window.manuallyFetchedPlaces && window.manuallyFetchedPlaces.length > 0) {
      console.log('Using manually fetched places data:', window.manuallyFetchedPlaces);
      
      // We have places but need to load trip data too
      // Create minimal trip data structure
      if (!tripData) {
        tripData = {
          id: tripId,
          title: document.querySelector('.trip-title')?.textContent || 'Trip',
          description: document.querySelector('.trip-description')?.textContent || '',
          start_date: null,
          end_date: null,
          isOwner: isOwner,
          isPublic: isPublic
        };
        
        // Try to extract dates from the UI
        const dateRangeEl = document.getElementById('trip-date-range');
        if (dateRangeEl && dateRangeEl.textContent) {
          const dates = dateRangeEl.textContent.split(' - ');
          if (dates.length === 2) {
            try {
              tripData.start_date = new Date(dates[0]).toISOString();
              tripData.end_date = new Date(dates[1]).toISOString();
            } catch (e) {
              console.error('Error parsing dates from UI:', e);
            }
          }
        }
      }
      
      placesData = window.manuallyFetchedPlaces;
      
      // Update UI
      updateTripDuration();
      updateCounters();
      renderPlacesHighlights();
      renderPlacesTable();
      
      return true;
    }
    
    // No pre-fetched data, try to load from API
    try {
      await loadTripData();
      return true;
    } catch (error) {
      console.error('Error loading trip data from any source:', error);
      return false;
    }
  }
  
  // ------------------- UI FUNCTIONS -------------------
  
  // Hide all loading indicators and show empty states if needed
  function hideAllLoadingElements() {
    const loadingElements = [
      'places-loading',
      'places-table-loading',
      'itinerary-loading',
      'map-loading'
    ];
    
    loadingElements.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.classList.add('d-none');
      }
    });
    
    const emptyStateElements = [
      'places-empty',
      'places-table-empty',
      'itinerary-empty',
      'map-empty'
    ];
    
    emptyStateElements.forEach(id => {
      const element = document.getElementById(id);
      if (element && (!placesData || !placesData.length)) {
        element.classList.remove('d-none');
      }
    });
  }
  
  // Update counters in the UI
  function updateCounters() {
    // Update place count
    const placeCount = document.getElementById('place-count');
    if (placeCount) {
      placeCount.textContent = placesData.length;
    }
    
    // Update days count based on trip duration
    if (tripData && tripData.start_date && tripData.end_date) {
      const startDate = new Date(tripData.start_date);
      const endDate = new Date(tripData.end_date);
      const diffTime = Math.abs(endDate - startDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      
      const dayCount = document.getElementById('day-count');
      if (dayCount) {
        dayCount.textContent = diffDays;
      }
    }
    
    // Update activity count
    const activityCount = document.getElementById('activity-count');
    if (activityCount) {
      activityCount.textContent = itineraryData.length;
    }
  }
  
  // Update trip duration badge
  function updateTripDuration() {
    if (!tripData || !tripData.start_date || !tripData.end_date) return;
    
    try {
      const startDate = new Date(tripData.start_date);
      const endDate = new Date(tripData.end_date);
      const diffTime = Math.abs(endDate - startDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      
      const tripDurationBadge = document.getElementById('trip-duration-badge');
      if (tripDurationBadge) {
        tripDurationBadge.textContent = `${diffDays} ${diffDays === 1 ? 'Day' : 'Days'}`;
      }
    } catch (e) {
      console.error('Error calculating trip duration:', e);
    }
  }
  
  // Set trip cover image based on places or default
  function setTripCoverImage() {
    const coverImageEl = document.getElementById('trip-cover-image');
    if (!coverImageEl) return;
    
    // Try to use the first place with an image
    const placeWithImage = placesData.find(place => place.image_url);
    
    if (placeWithImage && placeWithImage.image_url) {
      coverImageEl.style.backgroundImage = `url('${placeWithImage.image_url}')`;
    } else {
      // Use default cover image based on category or generic travel image
      coverImageEl.style.backgroundImage = "url('" + basePath + "images/trip-cover-default.jpg')";
    }
  }
  
  // Render places highlights
  function renderPlacesHighlights() {
    const placesHighlights = document.getElementById('places-highlights');
    const placesLoading = document.getElementById('places-loading');
    const placesEmpty = document.getElementById('places-empty');
    const highlightsContainer = document.getElementById('highlights-container');
    
    if (!placesHighlights || !highlightsContainer) return;
    
    // Hide loading
    if (placesLoading) {
      placesLoading.classList.add('d-none');
    }
    
    // If no places, show empty state
    if (!placesData || placesData.length === 0) {
      if (placesEmpty) {
        placesEmpty.classList.remove('d-none');
      }
      return;
    }
    
    // Show highlights container
    placesHighlights.classList.remove('d-none');
    
    // Get up to 3 places to highlight
    const highlightPlaces = placesData.slice(0, 3);
    
    // Generate highlights HTML
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
  
  // Render places table
  function renderPlacesTable() {
    const placesTableContainer = document.getElementById('places-table-container');
    const placesTableBody = document.getElementById('places-table-body');
    const placesTableLoading = document.getElementById('places-table-loading');
    const placesTableEmpty = document.getElementById('places-table-empty');
    
    if (!placesTableContainer || !placesTableBody) return;
    
    // Hide loading
    if (placesTableLoading) {
      placesTableLoading.classList.add('d-none');
    }
    
    // If no places, show empty state
    if (!placesData || placesData.length === 0) {
      if (placesTableEmpty) {
        placesTableEmpty.classList.remove('d-none');
      }
      return;
    }
    
    // Show table container
    placesTableContainer.classList.remove('d-none');
    
    // Generate table rows
    placesTableBody.innerHTML = placesData.map(place => `
      <tr data-place-id="${place.id}">
        <td>
          <div class="d-flex align-items-center">
            <div class="place-thumbnail me-3">
              <img src="${place.image_url || basePath + 'images/placeholder.jpg'}" alt="${place.name}" class="img-thumbnail" style="width: 50px; height: 50px; object-fit: cover;">
            </div>
            <div>
              <h6 class="mb-0">${place.name}</h6>
              <span class="badge bg-secondary">${place.category || 'Uncategorized'}</span>
            </div>
          </div>
        </td>
        <td>${place.address || 'No address available'}</td>
        <td>
          ${place.latitude && place.longitude ? 
            `<small>${place.latitude.toFixed(4)}, ${place.longitude.toFixed(4)}</small>` : 
            '<span class="text-muted">Not available</span>'}
        </td>
        <td>
          <div class="btn-group">
            <button type="button" class="btn btn-sm btn-primary edit-place-btn" data-place-id="${place.id}">
              <i class="fas fa-edit"></i>
            </button>
            <button type="button" class="btn btn-sm btn-danger delete-place-btn" data-place-id="${place.id}">
              <i class="fas fa-trash-alt"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  }
  
  // Basic implementation of itinerary rendering
  function renderItinerary() {
    const itineraryContainer = document.getElementById('itinerary-container');
    const itineraryLoading = document.getElementById('itinerary-loading');
    const itineraryEmpty = document.getElementById('itinerary-empty');
    
    if (!itineraryContainer) return;
    
    // Hide loading
    if (itineraryLoading) {
      itineraryLoading.classList.add('d-none');
    }
    
    // If no itinerary items, show empty state
    if (!itineraryData || itineraryData.length === 0) {
      if (itineraryEmpty) {
        itineraryEmpty.classList.remove('d-none');
      }
      return;
    }
    
    // Show itinerary container
    itineraryContainer.classList.remove('d-none');
    
    // More complex rendering would go here
    // For now, just implement a basic version so the page doesn't break
  }
  
  // Basic map initialization 
  function initializeMap() {
    // Will be implemented if needed
    // For now just hide loading state
    const mapLoading = document.getElementById('map-loading');
    if (mapLoading) {
      mapLoading.classList.add('d-none');
    }
  }
  
  // ------------------- EVENT LISTENERS -------------------
  
  // Set up event listeners for interactive elements
  function setupEventListeners() {
    // Simple event listeners for tab switching
    document.querySelectorAll('#trip-nav [data-bs-toggle="list"]').forEach(tabEl => {
      tabEl.addEventListener('shown.bs.tab', event => {
        const targetId = event.target.getAttribute('href').substring(1);
        if (targetId === 'map' && !map && placesData.length > 0) {
          initializeMap();
        }
      });
    });
    
    // More event listeners would be added here in the full implementation
  }
  
  // ------------------- INITIALIZE THE APP -------------------
  
  // Main initialization function
  async function init() {
    try {
      console.log('Initializing trip planner application...');
      
      // Try to load data from any available source
      await loadFromAnySource();
      
      // Set up event listeners
      setupEventListeners();
      
    } catch (error) {
      console.error('Trip planner initialization error:', error);
      showToast('Error initializing application: ' + error.message, 'danger');
      hideAllLoadingElements();
    }
  }
  
  // Start the application
  init();
});

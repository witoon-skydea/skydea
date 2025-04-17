// Trip Planner Application JavaScript
document.addEventListener('DOMContentLoaded', function() {
  // Helper function to get icon for place category
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
  
  // Helper function to get category icon for an activity's place
  function getPlaceCategoryIcon(placeId) {
    if (!placeId) return '';
    
    const place = placesData.find(p => p.id === placeId);
    if (place && place.category) {
      // Get the clean category name (without spaces)
      const categoryClass = place.category.replace(/\s+/g, '-').toLowerCase();
      // Return a nicer styled category badge with the appropriate icon
      return `<span class="category-badge ${categoryClass}"><i class="fas ${getCategoryIcon(place.category)}"></i> ${place.category}</span>`;
    }
    
    return '';
  }

  // Helper function to get time marker icon based on place category
  function getTimeMarkerIcon(placeId) {
    if (!placeId) return 'fa-clock';
    
    const place = placesData.find(p => p.id === placeId);
    if (!place || !place.category) return 'fa-clock';
    
    const icons = {
      'hotel': 'fa-bed',
      'restaurant': 'fa-utensils',
      'shopping': 'fa-shopping-bag',
      'sight seeing': 'fa-camera',
      'transportation': 'fa-bus',
      'other': 'fa-map-marker-alt'
    };
    
    return icons[place.category] || 'fa-clock';
  }
  
  // Helper function to truncate text
  function truncateText(text, maxLength) {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }

  // Helper function to format time (HH:MM)
  function formatTime(timeString) {
    if (!timeString) return '';
    
    // Check if it's already in HH:MM format
    if (/^\d{1,2}:\d{2}$/.test(timeString)) {
      return timeString;
    }
    
    try {
      // Try to parse as a date string with ISO format
      const date = new Date(timeString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch (error) {
      console.error('Error formatting time:', error);
      return timeString || '';
    }
  }
  
  // Helper function to format date
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
  
  // Show toast notification
  function showToast(message, type = 'info') {
    // Create toast container if it doesn't exist
    let toastContainer = document.querySelector('.toast-container');
    
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
      document.body.appendChild(toastContainer);
    }
    
    // Create toast
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

    // Initialize and show the toast
    const bsToast = new bootstrap.Toast(toast, {
      autohide: true,
      delay: 5000
    });
    bsToast.show();
    
    // Remove toast after it's hidden
    toast.addEventListener('hidden.bs.toast', function() {
      toast.remove();
    });
  }
  
  // Get base data
  const tripPlannerApp = document.getElementById('trip-planner-app');
  const tripId = tripPlannerApp?.dataset.tripId || window.tripData?.tripId;
  
  // Ensure basePath is set correctly - first from app element, then from window, finally default to '/'
  const basePath = tripPlannerApp?.dataset.basePath || window.appBasePath || '/';
  
  const isOwner = window.tripData?.isOwner === true;
  const isPublic = window.tripData?.isPublic === true;
  let shareCode = window.tripData?.shareCode || '';
  
  // Log for debugging
  console.log('Trip Planner Initialization:', { tripId, basePath, isOwner, isPublic, shareCode });
  
  if (!tripId || !tripPlannerApp) {
    console.error('Trip ID not found in dataset or trip-planner-app element not found');
    showToast('Error: Trip information not found', 'danger');
    return;
  }
  
  // API URLs
  // Append share code to URLs if available
  const shareParam = shareCode ? `?share=${shareCode}` : '';
  
  // Use PathUtil for consistent URL construction if available, fallback to manual normalization
  let buildApiEndpoint;
  
  if (window.PathUtil && typeof window.PathUtil.buildApiUrl === 'function') {
    console.log('Using PathUtil to build API URLs');
    buildApiEndpoint = (endpoint) => window.PathUtil.buildApiUrl(endpoint);
  } else {
    console.log('PathUtil not available, using manual path construction');
    // Ensure basePath has trailing slash for proper URL construction
    const normalizePath = (path) => {
      return path.endsWith('/') ? path : path + '/';
    };
    const normalizedBasePath = normalizePath(basePath);
    buildApiEndpoint = (endpoint) => `${normalizedBasePath}api/${endpoint}`;
  }
  
  const apiUrls = {
    trip: buildApiEndpoint(`trips/${tripId}${shareParam}`),
    places: buildApiEndpoint(`places/trip/${tripId}${shareParam}`),
    createPlace: buildApiEndpoint('places'),
    itinerary: buildApiEndpoint(`itinerary/trip/${tripId}${shareParam}`),
    createItinerary: buildApiEndpoint('itinerary'),
    reorderItinerary: buildApiEndpoint('itinerary/reorder/batch'),
    privacy: buildApiEndpoint(`trips/${tripId}/privacy`),
    shareCode: buildApiEndpoint(`trips/${tripId}/share-code`),
    shareLink: buildApiEndpoint(`trips/${tripId}/share`)
  };

  // Log all API URLs for debugging
  console.log('API URLs initialized:', apiUrls);
  
  // State variables
  let tripData = null;
  let placesData = [];
  let itineraryData = [];
  let selectedPlace = null;
  let map = null;
  let markers = [];
  let directionsService = null;
  let directionsRenderer = null;
  
  // DOM Elements
  const editTripBtn = document.getElementById('edit-trip-btn');
  const addPlaceBtn = document.getElementById('add-place-btn');
  const addPlaceBtn2 = document.getElementById('add-place-btn-2');
  const emptyAddPlaceBtn = document.getElementById('empty-add-place-btn');
  const tableAddPlaceBtn = document.getElementById('table-add-place-btn');
  const mapAddPlaceBtn = document.getElementById('map-add-place-btn');
  const viewAllPlacesBtn = document.getElementById('view-all-places-btn');
  const savePlaceBtn = document.getElementById('save-place-btn');
  const addActivityBtn = document.getElementById('add-activity-btn');
  const emptyAddActivityBtn = document.getElementById('empty-add-activity-btn');
  const saveActivityBtn = document.getElementById('save-activity-btn');
  const planItineraryBtn = document.getElementById('plan-itinerary-btn');
  const updateTripBtn = document.getElementById('update-trip-btn');
  const showAllPlacesBtn = document.getElementById('show-all-places-btn');
  const showByDayBtn = document.getElementById('show-by-day-btn');
  const googleSearchBtn = document.getElementById('google-search-btn');
  
  // Initialize the app
  init();
  
  // Main initialization function
  async function init() {
    try {
      // Load trip data
      await loadTripData();
      
      // Set up event listeners
      setupEventListeners();
      
      // Calculate and update trip duration
      updateTripDuration();
    } catch (error) {
      console.error('Initialization error:', error);
      showToast('Error initializing application: ' + error.message, 'danger');
      
      // Make sure loading elements are hidden if there's an error
      hideAllLoadingElements();
    }
  }
  
  // Load all trip data from API
  async function loadTripData() {
    try {
      console.log('Loading trip data from:', apiUrls.trip);

      if (!tripId) {
        throw new Error('Trip ID is not defined');
      }

      // Create container for error messages
      const tripPlannerEl = document.getElementById('trip-planner-app');
      const errorContainer = document.createElement('div');
      errorContainer.className = 'alert alert-danger';
      errorContainer.id = 'api-error-container';
      errorContainer.style.display = 'none';
      tripPlannerEl.prepend(errorContainer);

      // Add timeout to fetch to prevent hanging
      const fetchWithTimeout = async (url, options = {}, timeout = 20000) => {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);
        
        const headers = {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        };
        
        try {
          const response = await fetch(url, {
            ...options,
            headers: { ...headers, ...options.headers },
            signal: controller.signal,
            // Add cache busting parameter
            cache: 'no-store'
          });
          clearTimeout(id);
          return response;
        } catch (error) {
          clearTimeout(id);
          console.error('Fetch error:', error);
          
          // Display friendly error message
          errorContainer.innerHTML = `
            <h4>Connection Error</h4>
            <p>${error.name === 'AbortError' ? 'Request timed out' : 'Network error'}: Could not connect to the server.</p>
            <p>Details: ${error.message}</p>
            <button class="btn btn-primary mt-2" onclick="window.location.reload()">Retry</button>
          `;
          errorContainer.style.display = 'block';
          
          // Make sure to hide all loading elements when there's an error
          hideAllLoadingElements();
          
          if (error.name === 'AbortError') {
            throw new Error('Request timed out. Please try again.');
          }
          throw error;
        }
      };

      // Add debug info about API URL
      console.group('API Call Details');
      console.log('BasePath:', basePath);
      // Safe way to get normalized base path
      const normalizePath = (path) => {
        return path.endsWith('/') ? path : path + '/';
      };
      const debugNormalizedBasePath = normalizePath(basePath);
      console.log('Normalized BasePath:', debugNormalizedBasePath);
      console.log('Trip ID:', tripId);
      console.log('Share Code:', shareCode);
      console.log('Full API URL:', apiUrls.trip);
      console.groupEnd();

      const response = await fetchWithTimeout(apiUrls.trip);
      console.log('Trip API response status:', response.status);

      if (!response.ok) {
        let errorMessage = `Failed to load trip data: ${response.status} ${response.statusText}`;
        try {
          const errorText = await response.text();
          console.error('API error response:', errorText);
          
          // Try to parse as JSON if possible
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
        
        // Display friendly error message
        const errorContainer = document.getElementById('api-error-container');
        if (errorContainer) {
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
              <pre class="bg-light p-2">${response.status} ${response.statusText}\nURL: ${apiUrls.trip}</pre>
            </div>
          `;
          errorContainer.style.display = 'block';
          
          // Make sure to hide all loading elements
          hideAllLoadingElements();
        }
        
        throw new Error(errorMessage);
      }

      let data;
      try {
        data = await response.json();
        console.log('Trip data loaded successfully:', data);
      } catch (e) {
        console.error('Error parsing JSON response:', e);

        // Display friendly error message
        const errorContainer = document.getElementById('api-error-container');
        if (errorContainer) {
          errorContainer.innerHTML = `
            <h4>Error Processing Response</h4>
            <p>The server response could not be processed properly. This might indicate an issue with the server configuration.</p>
            <div class="mt-3">
              <button class="btn btn-primary me-2" onclick="window.location.reload()">Retry</button>
              <button class="btn btn-outline-secondary" onclick="window.history.back()">Go Back</button>
            </div>
            <hr>
            <div class="small text-muted">
              <p>Technical details:</p>
              <pre class="bg-light p-2">JSON Parse Error: ${e.message}</pre>
            </div>
          `;
          errorContainer.style.display = 'block';
        }
        
        // Hide all loading elements
        hideAllLoadingElements();

        throw new Error('Invalid JSON response from server');
      }

      if (!data.trip) {
        console.error('Trip data structure invalid:', data);
        
        // Display friendly error message for invalid structure
        const errorContainer = document.getElementById('api-error-container');
        if (errorContainer) {
          errorContainer.innerHTML = `
            <h4>Error Processing Trip Data</h4>
            <p>The server returned an invalid data structure. This might indicate an issue with the server configuration.</p>
            <div class="mt-3">
              <button class="btn btn-primary me-2" onclick="window.location.reload()">Retry</button>
              <button class="btn btn-outline-secondary" onclick="window.history.back()">Go Back</button>
            </div>
          `;
          errorContainer.style.display = 'block';
        }
        
        // Hide all loading elements
        hideAllLoadingElements();
        
        throw new Error('Invalid trip data structure received from API');
      }

      tripData = data.trip;
      placesData = data.places || [];
      itineraryData = data.itineraryItems || [];
      
      console.log('Parsed trip data:', {
        tripData,
        placesCount: placesData.length,
        itineraryCount: itineraryData.length
      });

      // Update UI safely with try-catch blocks for each operation
      try {
        updateCounters();
        console.log('Counters updated');
      } catch (err) {
        console.error('Error updating counters:', err);
      }
      
      try {
        // Set trip cover image
        setTripCoverImage();
        console.log('Trip cover image set');
      } catch (err) {
        console.error('Error setting trip cover image:', err);
      }
      
      try {
        renderPlacesHighlights();
        console.log('Places highlights rendered');
      } catch (err) {
        console.error('Error rendering places highlights:', err);
      }
      
      try {
        renderPlacesTable();
        console.log('Places table rendered');
      } catch (err) {
        console.error('Error rendering places table:', err);
      }
      
      try {
        renderItinerary();
        console.log('Itinerary rendered');
      } catch (err) {
        console.error('Error rendering itinerary:', err);
      }

      // Initialize map if on the map tab
      if (window.location.hash === '#map') {
        try {
          initializeMap();
          console.log('Map initialized');
        } catch (err) {
          console.error('Error initializing map:', err);
        }
      }
    } catch (error) {
      console.error('Error loading trip data:', error);
      showToast('Error loading trip data: ' + error.message, 'danger');
      
      // Make sure to hide all loading elements
      hideAllLoadingElements();
      
      throw error; // Re-throw to be caught by init()
    }
  }
  
  // Helper function to hide all loading elements
  function hideAllLoadingElements() {
    // Hide all loading indicators
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
    
    // Show empty states if applicable
    const emptyStateElements = [
      'places-empty',
      'places-table-empty',
      'itinerary-empty',
      'map-empty'
    ];
    
    emptyStateElements.forEach(id => {
      const element = document.getElementById(id);
      if (element && !placesData.length) {
        element.classList.remove('d-none');
      }
    });
  }
  
  // Set up event listeners
  function setupEventListeners() {
    // Add more code here for event listeners
  }
  
  // Update trip duration badge
  function updateTripDuration() {
    if (!tripData) return;
    
    const startDate = new Date(tripData.start_date);
    const endDate = new Date(tripData.end_date);
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Include start and end day
    
    const tripDurationBadge = document.getElementById('trip-duration-badge');
    if (tripDurationBadge) {
      tripDurationBadge.textContent = `${diffDays} ${diffDays === 1 ? 'Day' : 'Days'}`;
    }
  }
  
  // Placeholder for other functions
  function updateCounters() {
    // This will be implemented
  }
  
  function setTripCoverImage() {
    // This will be implemented
  }
  
  function renderPlacesHighlights() {
    // This will be implemented
  }
  
  function renderPlacesTable() {
    // This will be implemented
  }
  
  function renderItinerary() {
    // This will be implemented
  }
  
  function initializeMap() {
    // This will be implemented
  }
});
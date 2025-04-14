// Trip Planner Application JavaScript
document.addEventListener('DOMContentLoaded', function() {
  // Get base data
  const tripPlannerApp = document.getElementById('trip-planner-app');
  const tripId = tripPlannerApp?.dataset.tripId;
  const basePath = tripPlannerApp?.dataset.basePath || '/';
  
  // API URLs
  const apiUrls = {
    trip: `${basePath}api/trips/${tripId}`,
    places: `${basePath}api/places/trip/${tripId}`,
    createPlace: `${basePath}api/places`,
    itinerary: `${basePath}api/itinerary/trip/${tripId}`,
    createItinerary: `${basePath}api/itinerary`,
    reorderItinerary: `${basePath}api/itinerary/reorder/batch`
  };
  
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
      showToast('Error initializing application', 'danger');
    }
  }
  
  // Load all trip data from API
  async function loadTripData() {
    try {
      const response = await fetch(apiUrls.trip);
      if (!response.ok) {
        throw new Error('Failed to load trip data');
      }
      
      const data = await response.json();
      tripData = data.trip;
      placesData = data.places || [];
      itineraryData = data.itineraryItems || [];
      
      // Update UI
      updateCounters();
      renderPlacesHighlights();
      renderPlacesTable();
      renderItinerary();
      
      // Initialize map if on the map tab
      if (window.location.hash === '#map') {
        initializeMap();
      }
    } catch (error) {
      console.error('Error loading trip data:', error);
      showToast('Error loading trip data', 'danger');
    }
  }
  
  // Set up event listeners
  function setupEventListeners() {
    // Tab change listeners
    document.querySelectorAll('#trip-nav a').forEach(tab => {
      tab.addEventListener('click', function(e) {
        // If map tab is clicked, initialize the map
        if (this.getAttribute('href') === '#map' && !map) {
          setTimeout(() => {
            initializeMap();
          }, 100);
        }
      });
    });
    
    // Trip edit button
    editTripBtn?.addEventListener('click', openEditTripModal);
    
    // Add place buttons
    addPlaceBtn?.addEventListener('click', openAddPlaceModal);
    addPlaceBtn2?.addEventListener('click', openAddPlaceModal);
    emptyAddPlaceBtn?.addEventListener('click', openAddPlaceModal);
    tableAddPlaceBtn?.addEventListener('click', openAddPlaceModal);
    mapAddPlaceBtn?.addEventListener('click', openAddPlaceModal);
    
    // View all places button
    viewAllPlacesBtn?.addEventListener('click', () => {
      document.querySelector('#trip-nav a[href="#places"]').click();
    });
    
    // Save place button
    savePlaceBtn?.addEventListener('click', savePlace);
    
    // Google search button
    googleSearchBtn?.addEventListener('click', searchGooglePlaces);
    
    // Google search input - search on Enter key
    const googleSearchInput = document.getElementById('google-search');
    googleSearchInput?.addEventListener('keyup', function(e) {
      if (e.key === 'Enter') {
        searchGooglePlaces();
      }
    });
    
    // Add activity buttons
    addActivityBtn?.addEventListener('click', openAddActivityModal);
    emptyAddActivityBtn?.addEventListener('click', openAddActivityModal);
    
    // Save activity button
    saveActivityBtn?.addEventListener('click', saveActivity);
    
    // Plan itinerary button
    planItineraryBtn?.addEventListener('click', () => {
      document.querySelector('#trip-nav a[href="#itinerary"]').click();
    });
    
    // Update trip button
    updateTripBtn?.addEventListener('click', updateTrip);
    
    // Map control buttons
    showAllPlacesBtn?.addEventListener('click', () => showAllMarkersOnMap());
    showByDayBtn?.addEventListener('click', () => showItineraryOnMap());
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
  
  // Update count statistics
  function updateCounters() {
    document.getElementById('place-count').textContent = placesData.length;
    
    // Calculate days based on start and end date
    const startDate = new Date(tripData.start_date);
    const endDate = new Date(tripData.end_date);
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Include start and end day
    
    document.getElementById('day-count').textContent = diffDays;
    document.getElementById('activity-count').textContent = itineraryData.length;
  }
  
  // Render places highlights on the Overview tab
  function renderPlacesHighlights() {
    const placesLoading = document.getElementById('places-loading');
    const placesEmpty = document.getElementById('places-empty');
    const placesHighlights = document.getElementById('places-highlights');
    const highlightsContainer = document.getElementById('highlights-container');
    
    // Hide all initially
    placesLoading.classList.add('d-none');
    placesEmpty.classList.add('d-none');
    placesHighlights.classList.add('d-none');
    
    if (placesData.length === 0) {
      placesEmpty.classList.remove('d-none');
      return;
    }
    
    // Show highlights container
    placesHighlights.classList.remove('d-none');
    highlightsContainer.innerHTML = '';
    
    // Get up to 3 places to show as highlights
    const highlights = placesData.slice(0, 3);
    
    highlights.forEach(place => {
      const placeCard = document.createElement('div');
      placeCard.className = 'col-md-4';
      
      // Generate image source
      const imageUrl = place.image_url || `https://via.placeholder.com/300x200?text=${encodeURIComponent(place.name)}`;
      
      placeCard.innerHTML = `
        <div class="card h-100 shadow-sm">
          <img src="${imageUrl}" class="card-img-top" alt="${place.name}" style="height: 150px; object-fit: cover;">
          <div class="card-body">
            <h5 class="card-title">${place.name}</h5>
            ${place.address ? `<p class="card-text text-muted small mb-2"><i class="fas fa-map-marker-alt me-2"></i>${place.address}</p>` : ''}
            ${place.description ? `<p class="card-text">${truncateText(place.description, 100)}</p>` : ''}
          </div>
        </div>
      `;
      
      highlightsContainer.appendChild(placeCard);
    });
  }
  
  // Render places table on the Places tab
  function renderPlacesTable() {
    const placesTableLoading = document.getElementById('places-table-loading');
    const placesTableEmpty = document.getElementById('places-table-empty');
    const placesTableContainer = document.getElementById('places-table-container');
    const placesTableBody = document.getElementById('places-table-body');
    
    // Hide all initially
    placesTableLoading.classList.add('d-none');
    placesTableEmpty.classList.add('d-none');
    placesTableContainer.classList.add('d-none');
    
    if (placesData.length === 0) {
      placesTableEmpty.classList.remove('d-none');
      return;
    }
    
    // Show table container
    placesTableContainer.classList.remove('d-none');
    placesTableBody.innerHTML = '';
    
    placesData.forEach(place => {
      const row = document.createElement('tr');
      
      // Create coordinates text if available
      const coordsText = place.latitude && place.longitude 
        ? `${place.latitude.toFixed(6)}, ${place.longitude.toFixed(6)}` 
        : 'Not specified';
      
      row.innerHTML = `
        <td>
          <div class="d-flex align-items-center">
            <div class="flex-shrink-0">
              <div class="place-icon bg-light rounded-circle">
                <i class="fas fa-map-marker-alt text-primary"></i>
              </div>
            </div>
            <div class="ms-3">
              <h6 class="mb-0">${place.name}</h6>
              ${place.description ? `<p class="small text-muted mb-0">${truncateText(place.description, 60)}</p>` : ''}
            </div>
          </div>
        </td>
        <td>${place.address || 'Not specified'}</td>
        <td>${coordsText}</td>
        <td>
          <div class="btn-group btn-group-sm">
            <button class="btn btn-outline-primary edit-place-btn" data-place-id="${place.id}">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-outline-danger delete-place-btn" data-place-id="${place.id}">
              <i class="fas fa-trash-alt"></i>
            </button>
          </div>
        </td>
      `;
      
      placesTableBody.appendChild(row);
    });
    
    // Add event listeners for edit and delete buttons
    document.querySelectorAll('.edit-place-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const placeId = parseInt(this.dataset.placeId);
        const place = placesData.find(p => p.id === placeId);
        if (place) {
          openEditPlaceModal(place);
        }
      });
    });
    
    document.querySelectorAll('.delete-place-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const placeId = parseInt(this.dataset.placeId);
        const place = placesData.find(p => p.id === placeId);
        if (place) {
          confirmDeletePlace(place);
        }
      });
    });
  }
  
  // Render itinerary
  function renderItinerary() {
    const itineraryLoading = document.getElementById('itinerary-loading');
    const itineraryEmpty = document.getElementById('itinerary-empty');
    const itineraryContainer = document.getElementById('itinerary-container');
    const dayTabs = document.getElementById('day-tabs');
    const dayTabContent = document.getElementById('day-tab-content');
    
    // Hide all initially
    itineraryLoading.classList.add('d-none');
    itineraryEmpty.classList.add('d-none');
    itineraryContainer.classList.add('d-none');
    
    if (itineraryData.length === 0) {
      itineraryEmpty.classList.remove('d-none');
      return;
    }
    
    // Show itinerary container
    itineraryContainer.classList.remove('d-none');
    dayTabs.innerHTML = '';
    dayTabContent.innerHTML = '';
    
    // Calculate the number of days
    const startDate = new Date(tripData.start_date);
    const endDate = new Date(tripData.end_date);
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Include start and end day
    
    // Group itinerary items by day
    const itemsByDay = {};
    for (let i = 1; i <= diffDays; i++) {
      itemsByDay[i] = itineraryData.filter(item => item.day_number === i)
        .sort((a, b) => a.order_index - b.order_index);
    }
    
    // Create tabs and content for each day
    for (let day = 1; day <= diffDays; day++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + day - 1);
      const formattedDate = date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
      
      // Create tab
      const tab = document.createElement('li');
      tab.className = 'nav-item';
      tab.innerHTML = `
        <button class="nav-link ${day === 1 ? 'active' : ''}" id="day-${day}-tab" data-bs-toggle="tab" 
                data-bs-target="#day-${day}" type="button" role="tab" aria-controls="day-${day}" 
                aria-selected="${day === 1 ? 'true' : 'false'}">
          Day ${day} <span class="d-none d-md-inline">- ${formattedDate}</span>
        </button>
      `;
      dayTabs.appendChild(tab);
      
      // Create tab content
      const tabContent = document.createElement('div');
      tabContent.className = `tab-pane fade ${day === 1 ? 'show active' : ''}`;
      tabContent.id = `day-${day}`;
      tabContent.setAttribute('role', 'tabpanel');
      tabContent.setAttribute('aria-labelledby', `day-${day}-tab`);
      
      // Check if there are items for this day
      const dayItems = itemsByDay[day] || [];
      
      if (dayItems.length === 0) {
        tabContent.innerHTML = `
          <div class="text-center p-4">
            <div class="mb-3">
              <i class="fas fa-calendar-day fa-3x text-muted opacity-50"></i>
            </div>
            <h5>No Activities for Day ${day}</h5>
            <p class="text-muted mb-4">Plan your activities for ${formattedDate}</p>
            <button class="btn btn-primary add-day-activity-btn" data-day="${day}">
              <i class="fas fa-plus me-2"></i> Add Activity
            </button>
          </div>
        `;
      } else {
        let timelineHTML = `
          <div class="timeline">
            <div class="timeline-header d-flex justify-content-between align-items-center mb-4">
              <h5 class="mb-0">Day ${day} - ${formattedDate}</h5>
              <button class="btn btn-sm btn-primary add-day-activity-btn" data-day="${day}">
                <i class="fas fa-plus me-1"></i> Add Activity
              </button>
            </div>
            <div class="timeline-container" id="timeline-day-${day}">
        `;
        
        dayItems.forEach((item, index) => {
          const startTime = formatTime(item.start_time);
          const endTime = formatTime(item.end_time);
          
          timelineHTML += `
            <div class="timeline-item" data-item-id="${item.id}" draggable="true">
              <div class="timeline-item-content">
                <div class="timeline-time">
                  <span class="badge bg-primary">${startTime} - ${endTime}</span>
                </div>
                <div class="timeline-body">
                  <div class="d-flex justify-content-between">
                    <h6 class="mb-1">${item.title}</h6>
                    <div class="timeline-actions">
                      <button class="btn btn-sm btn-outline-primary edit-activity-btn" data-item-id="${item.id}">
                        <i class="fas fa-edit"></i>
                      </button>
                      <button class="btn btn-sm btn-outline-danger delete-activity-btn" data-item-id="${item.id}">
                        <i class="fas fa-trash-alt"></i>
                      </button>
                    </div>
                  </div>
                  ${item.place_name ? `<p class="mb-1 small"><i class="fas fa-map-marker-alt me-2"></i>${item.place_name}</p>` : 
                   (item.place_id ? `<p class="mb-1 small text-muted"><i class="fas fa-map-marker-alt me-2"></i>ไม่พบข้อมูลสถานที่</p>` : 
                   `<p class="mb-1 small text-muted"><i class="fas fa-info-circle me-2"></i>กิจกรรมไม่ระบุสถานที่</p>`)}
                  ${item.description ? `<p class="mb-0 text-muted small">${item.description}</p>` : ''}
                </div>
              </div>
            </div>
          `;
        });
        
        timelineHTML += `
            </div>
          </div>
        `;
        
        tabContent.innerHTML = timelineHTML;
      }
      
      dayTabContent.appendChild(tabContent);
    }
    
    // Add event listeners to the "Add Activity" buttons
    document.querySelectorAll('.add-day-activity-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const day = parseInt(this.dataset.day);
        openAddActivityModal(day);
      });
    });
    
    // Add event listeners for edit and delete activity buttons
    document.querySelectorAll('.edit-activity-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const itemId = parseInt(this.dataset.itemId);
        const item = itineraryData.find(i => i.id === itemId);
        if (item) {
          openEditActivityModal(item);
        }
      });
    });
    
    document.querySelectorAll('.delete-activity-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const itemId = parseInt(this.dataset.itemId);
        const item = itineraryData.find(i => i.id === itemId);
        if (item) {
          confirmDeleteActivity(item);
        }
      });
    });
    
    // Set up drag-and-drop functionality for activities
    setupDragAndDrop();
  }
  
  // Initialize Google Map
  function initializeMap() {
    const mapLoading = document.getElementById('map-loading');
    const mapEmpty = document.getElementById('map-empty');
    const mapContainer = document.getElementById('map-container');
    const mapElement = document.getElementById('trip-map');
    
    // Hide all initially
    mapLoading.classList.add('d-none');
    mapEmpty.classList.add('d-none');
    mapContainer.classList.add('d-none');
    
    // Check if we have any places with coordinates
    const placesWithCoords = placesData.filter(place => place.latitude && place.longitude);
    
    if (placesWithCoords.length === 0) {
      mapEmpty.classList.remove('d-none');
      return;
    }
    
    // Show map container
    mapContainer.classList.remove('d-none');
    
    // Check if Google Maps API is loaded
    if (typeof google === 'undefined' || typeof google.maps === 'undefined') {
      mapElement.innerHTML = '<div class="alert alert-warning m-5">Google Maps API not loaded. Please check your API key.</div>';
      return;
    }
    
    // Create map instance
    map = new google.maps.Map(mapElement, {
      center: { lat: 0, lng: 0 },
      zoom: 2,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      mapTypeControl: true,
      mapTypeControlOptions: {
        style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
        position: google.maps.ControlPosition.TOP_RIGHT
      },
      fullscreenControl: true,
      streetViewControl: true,
      zoomControl: true
    });
    
    // Create marker instances for all places with coordinates
    markers = placesWithCoords.map(place => {
      const marker = new google.maps.Marker({
        position: { lat: place.latitude, lng: place.longitude },
        map: map,
        title: place.name,
        animation: google.maps.Animation.DROP
      });
      
      // Add info window with place information
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div class="map-info-window">
            <h5>${place.name}</h5>
            ${place.address ? `<p class="mb-1 small"><i class="fas fa-map-marker-alt me-2"></i>${place.address}</p>` : ''}
            ${place.description ? `<p class="mb-0 text-muted small">${truncateText(place.description, 100)}</p>` : ''}
          </div>
        `
      });
      
      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });
      
      return {
        marker,
        infoWindow,
        place
      };
    });
    
    // Initialize directions service
    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({
      suppressMarkers: true, // We'll use our own markers
      polylineOptions: {
        strokeColor: '#4285F4',
        strokeWeight: 5,
        strokeOpacity: 0.7
      }
    });
    directionsRenderer.setMap(map);
    
    // Fit map to markers
    fitMapToMarkers();
  }
  
  // Fit map to all markers
  function fitMapToMarkers() {
    if (!map || markers.length === 0) return;
    
    const bounds = new google.maps.LatLngBounds();
    markers.forEach(({ marker }) => {
      bounds.extend(marker.getPosition());
    });
    
    map.fitBounds(bounds);
    
    // Zoom out a bit if only one marker
    if (markers.length === 1) {
      map.setZoom(14);
    }
  }
  
  // Show all markers on the map
  function showAllMarkersOnMap() {
    if (!map) return;
    
    // Clear any existing directions
    directionsRenderer.setDirections({ routes: [] });
    
    // Show all markers
    markers.forEach(({ marker }) => {
      marker.setMap(map);
    });
    
    // Fit map to markers
    fitMapToMarkers();
  }
  
  // Show itinerary on the map
  function showItineraryOnMap() {
    if (!map || !directionsService || !directionsRenderer) return;
    
    // Hide all markers initially
    markers.forEach(({ marker }) => {
      marker.setMap(null);
    });
    
    // Get the active day tab
    const activeTabId = document.querySelector('#day-tabs .nav-link.active').getAttribute('id');
    const dayNumber = parseInt(activeTabId.replace('day-', '').replace('-tab', ''));
    
    // Filter itinerary items for the active day
    const dayItems = itineraryData.filter(item => item.day_number === dayNumber && item.place_id)
      .sort((a, b) => a.order_index - b.order_index);
    
    if (dayItems.length < 2) {
      // Not enough points for directions
      showToast('Need at least two places with locations to show directions', 'warning');
      
      // Show markers for this day only
      const dayPlaceIds = dayItems.map(item => item.place_id);
      markers.forEach(({ marker, place }) => {
        if (dayPlaceIds.includes(place.id)) {
          marker.setMap(map);
        }
      });
      
      fitMapToMarkers();
      return;
    }
    
    // Build waypoints for directions
    const waypoints = [];
    let origin = null;
    let destination = null;
    
    // Find related place objects for each itinerary item
    const routePoints = dayItems.map(item => {
      const place = placesData.find(p => p.id === item.place_id);
      if (place && place.latitude && place.longitude) {
        return {
          location: { lat: place.latitude, lng: place.longitude },
          name: place.name,
          placeId: place.id
        };
      }
      return null;
    }).filter(point => point !== null);
    
    if (routePoints.length < 2) {
      showToast('Not enough places with valid coordinates', 'warning');
      return;
    }
    
    // Set origin, waypoints, and destination
    origin = routePoints[0].location;
    destination = routePoints[routePoints.length - 1].location;
    
    if (routePoints.length > 2) {
      for (let i = 1; i < routePoints.length - 1; i++) {
        waypoints.push({
          location: routePoints[i].location,
          stopover: true
        });
      }
    }
    
    // Request directions
    directionsService.route({
      origin: origin,
      destination: destination,
      waypoints: waypoints,
      travelMode: google.maps.TravelMode.DRIVING,
      optimizeWaypoints: false
    }, (result, status) => {
      if (status === google.maps.DirectionsStatus.OK) {
        directionsRenderer.setDirections(result);
        
        // Show markers for each location in the route
        routePoints.forEach(point => {
          const markerObj = markers.find(m => m.place.id === point.placeId);
          if (markerObj) {
            markerObj.marker.setMap(map);
          }
        });
      } else {
        showToast('Could not display directions: ' + status, 'danger');
        showAllMarkersOnMap();
      }
    });
  }
  
  // Open the Add Place modal
  function openAddPlaceModal() {
    // Reset form
    document.getElementById('manual-place-form').reset();
    document.getElementById('manual-place-error').classList.add('d-none');
    document.getElementById('google-search').value = '';
    document.getElementById('google-search-results').classList.add('d-none');
    document.getElementById('google-search-loading').classList.add('d-none');
    document.getElementById('google-search-error').classList.add('d-none');
    document.getElementById('google-place-details').classList.add('d-none');
    
    // Reset selected place
    selectedPlace = null;
    
    // Reset tab to manual entry
    document.getElementById('manual-tab').click();
    
    // Set save button to "Add Place"
    const saveBtn = document.getElementById('save-place-btn');
    saveBtn.textContent = 'Add Place';
    saveBtn.dataset.mode = 'add';
    saveBtn.dataset.placeId = '';
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('add-place-modal'));
    modal.show();
  }
  
  // Open the Edit Place modal with pre-filled data
  function openEditPlaceModal(place) {
    // Fill form with place data
    document.getElementById('place-name').value = place.name;
    document.getElementById('place-description').value = place.description || '';
    document.getElementById('place-address').value = place.address || '';
    document.getElementById('place-latitude').value = place.latitude || '';
    document.getElementById('place-longitude').value = place.longitude || '';
    document.getElementById('place-image').value = place.image_url || '';
    
    document.getElementById('manual-place-error').classList.add('d-none');
    
    // Make sure we're on the manual tab
    document.getElementById('manual-tab').click();
    
    // Set save button to "Update Place"
    const saveBtn = document.getElementById('save-place-btn');
    saveBtn.textContent = 'Update Place';
    saveBtn.dataset.mode = 'edit';
    saveBtn.dataset.placeId = place.id;
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('add-place-modal'));
    modal.show();
  }
  
  // Save or update a place
  async function savePlace() {
    try {
      const saveBtn = document.getElementById('save-place-btn');
      const isEditMode = saveBtn.dataset.mode === 'edit';
      const activeTab = document.querySelector('#place-tabs .nav-link.active');
      
      let placeData = {};
      
      if (activeTab.id === 'manual-tab') {
        // Manual entry form
        const name = document.getElementById('place-name').value.trim();
        const description = document.getElementById('place-description').value.trim();
        const address = document.getElementById('place-address').value.trim();
        const latitude = document.getElementById('place-latitude').value.trim();
        const longitude = document.getElementById('place-longitude').value.trim();
        const imageUrl = document.getElementById('place-image').value.trim();
        
        // Validate required fields
        if (!name) {
          const errorElement = document.getElementById('manual-place-error');
          errorElement.textContent = 'Place name is required';
          errorElement.classList.remove('d-none');
          return;
        }
        
        // Validate coordinates if provided
        if ((latitude && !longitude) || (!latitude && longitude)) {
          const errorElement = document.getElementById('manual-place-error');
          errorElement.textContent = 'Both latitude and longitude must be provided or left empty';
          errorElement.classList.remove('d-none');
          return;
        }
        
        placeData = {
          name,
          description: description || null,
          address: address || null,
          latitude: latitude ? parseFloat(latitude) : null,
          longitude: longitude ? parseFloat(longitude) : null,
          image_url: imageUrl || null
        };
      } else {
        // Google Places selection
        if (!selectedPlace) {
          showToast('Please select a place from the search results', 'warning');
          return;
        }
        
        placeData = {
          name: selectedPlace.name,
          address: selectedPlace.formatted_address,
          latitude: selectedPlace.geometry.location.lat,
          longitude: selectedPlace.geometry.location.lng,
          place_id: selectedPlace.place_id,
          // You can add additional fields from Google Places API here
        };
      }
      
      // API request
      let url, method;
      
      if (isEditMode) {
        const placeId = saveBtn.dataset.placeId;
        url = `${basePath}api/places/${placeId}`;
        method = 'PUT';
      } else {
        placeData.trip_id = tripId;
        url = apiUrls.createPlace;
        method = 'POST';
      }
      
      // Disable save button and show loading
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(placeData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save place');
      }
      
      const savedPlace = await response.json();
      
      // Update local data
      if (isEditMode) {
        const index = placesData.findIndex(p => p.id === parseInt(saveBtn.dataset.placeId));
        if (index !== -1) {
          placesData[index] = savedPlace;
        }
      } else {
        placesData.push(savedPlace);
      }
      
      // Close modal
      bootstrap.Modal.getInstance(document.getElementById('add-place-modal')).hide();
      
      // Update UI
      updateCounters();
      renderPlacesHighlights();
      renderPlacesTable();
      
      // Reinitialize map if it exists
      if (map) {
        initializeMap();
      }
      
      // Show success message
      showToast(isEditMode ? 'Place updated successfully' : 'Place added successfully', 'success');
    } catch (error) {
      console.error('Error saving place:', error);
      showToast(error.message || 'Failed to save place', 'danger');
      
      // Re-enable save button
      const saveBtn = document.getElementById('save-place-btn');
      saveBtn.disabled = false;
      saveBtn.textContent = saveBtn.dataset.mode === 'edit' ? 'Update Place' : 'Add Place';
    }
  }
  
  // Confirm delete place
  function confirmDeletePlace(place) {
    if (confirm(`Are you sure you want to delete "${place.name}"?`)) {
      deletePlace(place.id);
    }
  }
  
  // Delete a place
  async function deletePlace(placeId) {
    try {
      const response = await fetch(`${basePath}api/places/${placeId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete place');
      }
      
      // Update local data
      placesData = placesData.filter(p => p.id !== placeId);
      
      // Update itinerary items that referenced this place
      itineraryData.forEach(item => {
        if (item.place_id === placeId) {
          item.place_id = null;
          item.place_name = null;
        }
      });
      
      // Update UI
      updateCounters();
      renderPlacesHighlights();
      renderPlacesTable();
      renderItinerary();
      
      // Reinitialize map if it exists
      if (map) {
        initializeMap();
      }
      
      // Show success message
      showToast('Place deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting place:', error);
      showToast(error.message || 'Failed to delete place', 'danger');
    }
  }
  
  // Search Google Places
  async function searchGooglePlaces() {
    const searchInput = document.getElementById('google-search');
    const query = searchInput.value.trim();
    
    if (!query) {
      showToast('Please enter a search query', 'warning');
      return;
    }
    
    const resultsContainer = document.getElementById('google-search-results');
    const loadingElement = document.getElementById('google-search-loading');
    const errorElement = document.getElementById('google-search-error');
    const placeDetails = document.getElementById('google-place-details');
    
    // Hide all initially
    resultsContainer.classList.add('d-none');
    errorElement.classList.add('d-none');
    placeDetails.classList.add('d-none');
    
    // Show loading
    loadingElement.classList.remove('d-none');
    
    try {
      // Check if Google Maps Places API is available
      if (!google || !google.maps || !google.maps.places) {
        throw new Error('Google Maps Places API not loaded. Please check your API key.');
      }
      
      // Create PlacesService instance
      const placesService = new google.maps.places.PlacesService(document.createElement('div'));
      
      // Execute search
      placesService.textSearch({
        query: query
      }, (results, status) => {
        // Hide loading
        loadingElement.classList.add('d-none');
        
        if (status !== google.maps.places.PlacesServiceStatus.OK || !results) {
          errorElement.textContent = 'No places found for your search.';
          errorElement.classList.remove('d-none');
          return;
        }
        
        // Show results
        resultsContainer.classList.remove('d-none');
        const resultsList = document.getElementById('google-results-list');
        resultsList.innerHTML = '';
        
        results.slice(0, 5).forEach(place => {
          const listItem = document.createElement('a');
          listItem.className = 'list-group-item list-group-item-action';
          listItem.href = '#';
          listItem.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <h6 class="mb-1">${place.name}</h6>
                <p class="mb-1 small text-muted">${place.formatted_address || ''}</p>
              </div>
              <span class="badge bg-light text-dark rounded-pill">${place.rating ? `Rating: ${place.rating}/5` : 'No ratings'}</span>
            </div>
          `;
          
          listItem.addEventListener('click', (e) => {
            e.preventDefault();
            selectGooglePlace(place);
          });
          
          resultsList.appendChild(listItem);
        });
      });
    } catch (error) {
      // Hide loading
      loadingElement.classList.add('d-none');
      
      // Show error
      errorElement.textContent = error.message;
      errorElement.classList.remove('d-none');
      
      console.error('Error searching Google Places:', error);
    }
  }
  
  // Select a place from Google Places search results
  function selectGooglePlace(place) {
    selectedPlace = place;
    
    // Show place details
    const detailsContainer = document.getElementById('google-place-details');
    detailsContainer.classList.remove('d-none');
    
    document.getElementById('google-place-name').textContent = place.name;
    document.getElementById('google-place-address').textContent = place.formatted_address || 'No address available';
    document.getElementById('google-place-coords').textContent = `${place.geometry.location.lat().toFixed(6)}, ${place.geometry.location.lng().toFixed(6)}`;
    
    // Add event listener to add button
    document.getElementById('google-select-place-btn').addEventListener('click', () => {
      document.getElementById('save-place-btn').click();
    });
  }
  
  // Open the Add Activity modal
  function openAddActivityModal(dayNumber) {
    // Reset form
    document.getElementById('activity-form').reset();
    document.getElementById('activity-form-error').classList.add('d-none');
    
    // Get the total days for the trip
    const startDate = new Date(tripData.start_date);
    const endDate = new Date(tripData.end_date);
    const diffTime = Math.abs(endDate - startDate);
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Include start and end day
    
    // Populate the days dropdown
    const daysSelect = document.getElementById('activity-day');
    daysSelect.innerHTML = '';
    for (let i = 1; i <= totalDays; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i - 1);
      const formattedDate = date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
      
      const option = document.createElement('option');
      option.value = i;
      option.textContent = `Day ${i} - ${formattedDate}`;
      daysSelect.appendChild(option);
    }
    
    // Set the day number if provided
    if (dayNumber) {
      daysSelect.value = dayNumber;
    }
    
    // Populate the places dropdown
    const placesSelect = document.getElementById('activity-place');
    placesSelect.innerHTML = '<option value="">Select a place or leave blank</option>';
    placesData.forEach(place => {
      const option = document.createElement('option');
      option.value = place.id;
      option.textContent = place.name;
      placesSelect.appendChild(option);
    });
    
    // Set default times (9:00 AM to 10:00 AM)
    document.getElementById('activity-start-time').value = '09:00';
    document.getElementById('activity-end-time').value = '10:00';
    
    // Calculate default order index (next available)
    if (dayNumber) {
      const dayItems = itineraryData.filter(item => item.day_number === dayNumber);
      let maxOrder = 0;
      if (dayItems.length > 0) {
        maxOrder = Math.max(...dayItems.map(item => item.order_index));
      }
      document.getElementById('activity-order').value = maxOrder + 1;
    } else {
      document.getElementById('activity-order').value = 1;
    }
    
    // Set save button to "Add Activity"
    const saveBtn = document.getElementById('save-activity-btn');
    saveBtn.textContent = 'Add Activity';
    saveBtn.dataset.mode = 'add';
    saveBtn.dataset.itemId = '';
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('add-activity-modal'));
    modal.show();
  }
  
  // Open the Edit Activity modal with pre-filled data
  function openEditActivityModal(item) {
    // Fill form with activity data
    document.getElementById('activity-title').value = item.title;
    document.getElementById('activity-description').value = item.description || '';
    document.getElementById('activity-day').value = item.day_number;
    document.getElementById('activity-order').value = item.order_index;
    document.getElementById('activity-start-time').value = formatTime24h(item.start_time);
    document.getElementById('activity-end-time').value = formatTime24h(item.end_time);
    
    // Set place if available
    if (item.place_id) {
      document.getElementById('activity-place').value = item.place_id;
    } else {
      document.getElementById('activity-place').value = '';
    }
    
    document.getElementById('activity-form-error').classList.add('d-none');
    
    // Set save button to "Update Activity"
    const saveBtn = document.getElementById('save-activity-btn');
    saveBtn.textContent = 'Update Activity';
    saveBtn.dataset.mode = 'edit';
    saveBtn.dataset.itemId = item.id;
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('add-activity-modal'));
    modal.show();
  }
  
  // Save or update an activity
  async function saveActivity() {
    try {
      const saveBtn = document.getElementById('save-activity-btn');
      const isEditMode = saveBtn.dataset.mode === 'edit';
      
      // Get form values
      const title = document.getElementById('activity-title').value.trim();
      const description = document.getElementById('activity-description').value.trim();
      const placeId = document.getElementById('activity-place').value;
      const dayNumber = document.getElementById('activity-day').value;
      const orderIndex = document.getElementById('activity-order').value;
      const startTime = document.getElementById('activity-start-time').value;
      const endTime = document.getElementById('activity-end-time').value;
      
      // Validate required fields
      if (!title || !dayNumber || !orderIndex || !startTime || !endTime) {
        const errorElement = document.getElementById('activity-form-error');
        errorElement.textContent = 'Please fill in all required fields';
        errorElement.classList.remove('d-none');
        return;
      }
      
      // Validate that start time is before end time
      if (startTime >= endTime) {
        const errorElement = document.getElementById('activity-form-error');
        errorElement.textContent = 'Start time must be before end time';
        errorElement.classList.remove('d-none');
        return;
      }
      
      const activityData = {
        title,
        description: description || null,
        place_id: placeId !== "" ? placeId : null,
        day_number: parseInt(dayNumber),
        order_index: parseInt(orderIndex),
        start_time: startTime,
        end_time: endTime
      };
      
      // API request
      let url, method;
      
      if (isEditMode) {
        const itemId = saveBtn.dataset.itemId;
        url = `${basePath}api/itinerary/${itemId}`;
        method = 'PUT';
      } else {
        activityData.trip_id = tripId;
        url = apiUrls.createItinerary;
        method = 'POST';
      }
      
      // Disable save button and show loading
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(activityData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save activity');
      }
      
      const savedActivity = await response.json();
      
      // Update local data
      if (isEditMode) {
        const index = itineraryData.findIndex(i => i.id === parseInt(saveBtn.dataset.itemId));
        if (index !== -1) {
          itineraryData[index] = savedActivity;
        }
      } else {
        itineraryData.push(savedActivity);
      }
      
      // Close modal
      bootstrap.Modal.getInstance(document.getElementById('add-activity-modal')).hide();
      
      // Update UI
      updateCounters();
      renderItinerary();
      
      // Show success message
      showToast(isEditMode ? 'Activity updated successfully' : 'Activity added successfully', 'success');
    } catch (error) {
      console.error('Error saving activity:', error);
      showToast(error.message || 'Failed to save activity', 'danger');
      
      // Re-enable save button
      const saveBtn = document.getElementById('save-activity-btn');
      saveBtn.disabled = false;
      saveBtn.textContent = saveBtn.dataset.mode === 'edit' ? 'Update Activity' : 'Add Activity';
    }
  }
  
  // Confirm delete activity
  function confirmDeleteActivity(item) {
    if (confirm(`Are you sure you want to delete "${item.title}"?`)) {
      deleteActivity(item.id);
    }
  }
  
  // Delete an activity
  async function deleteActivity(itemId) {
    try {
      const response = await fetch(`${basePath}api/itinerary/${itemId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete activity');
      }
      
      // Update local data
      itineraryData = itineraryData.filter(i => i.id !== itemId);
      
      // Update UI
      updateCounters();
      renderItinerary();
      
      // Show success message
      showToast('Activity deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting activity:', error);
      showToast(error.message || 'Failed to delete activity', 'danger');
    }
  }
  
  // Setup drag-and-drop functionality for activities
  function setupDragAndDrop() {
    const timelineContainers = document.querySelectorAll('.timeline-container');
    
    timelineContainers.forEach(container => {
      const dayNumber = parseInt(container.id.replace('timeline-day-', ''));
      
      // Get all items in this container
      const items = container.querySelectorAll('.timeline-item');
      
      items.forEach(item => {
        // Make item draggable
        item.setAttribute('draggable', 'true');
        
        // Add drag start event
        item.addEventListener('dragstart', function(e) {
          e.dataTransfer.setData('text/plain', item.dataset.itemId);
          item.classList.add('dragging');
        });
        
        // Add drag end event
        item.addEventListener('dragend', function() {
          item.classList.remove('dragging');
        });
      });
      
      // Add dragover event to container
      container.addEventListener('dragover', function(e) {
        e.preventDefault();
        const afterElement = getDragAfterElement(container, e.clientY);
        const draggable = document.querySelector('.dragging');
        
        if (afterElement == null) {
          container.appendChild(draggable);
        } else {
          container.insertBefore(draggable, afterElement);
        }
      });
      
      // Add drop event to container
      container.addEventListener('drop', function(e) {
        e.preventDefault();
        const itemId = e.dataTransfer.getData('text/plain');
        const item = document.querySelector(`.timeline-item[data-item-id="${itemId}"]`);
        
        if (item) {
          // Get new order
          const newOrder = Array.from(container.querySelectorAll('.timeline-item'))
            .map((item, index) => ({
              id: parseInt(item.dataset.itemId),
              order_index: index + 1
            }));
          
          // Update order in database
          updateActivityOrder(dayNumber, newOrder);
        }
      });
    });
  }
  
  // Get the element after the dragged element based on mouse position
  function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.timeline-item:not(.dragging)')];
    
    return draggableElements.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      
      if (offset < 0 && offset > closest.offset) {
        return { offset, element: child };
      } else {
        return closest;
      }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  }
  
  // Update activity order after drag and drop
  async function updateActivityOrder(dayNumber, newOrder) {
    try {
      // Update UI first (optimistic update)
      newOrder.forEach(item => {
        const index = itineraryData.findIndex(i => i.id === item.id);
        if (index !== -1) {
          itineraryData[index].order_index = item.order_index;
        }
      });
      
      // Send API request
      const response = await fetch(apiUrls.reorderItinerary, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          trip_id: tripId,
          items: newOrder
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update activity order');
      }
      
      // Show success message
      showToast('Activity order updated', 'success');
    } catch (error) {
      console.error('Error updating activity order:', error);
      showToast(error.message || 'Failed to update activity order', 'danger');
      
      // Refresh the UI to ensure consistency
      renderItinerary();
    }
  }
  
  // Open the Edit Trip modal
  function openEditTripModal() {
    // Fill form with trip data
    document.getElementById('edit-trip-title').value = tripData.title;
    document.getElementById('edit-trip-description').value = tripData.description || '';
    document.getElementById('edit-trip-start-date').value = formatDateForInput(tripData.start_date);
    document.getElementById('edit-trip-end-date').value = formatDateForInput(tripData.end_date);
    
    document.getElementById('edit-trip-error').classList.add('d-none');
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('edit-trip-modal'));
    modal.show();
  }
  
  // Update the trip
  async function updateTrip() {
    try {
      // Get form values
      const title = document.getElementById('edit-trip-title').value.trim();
      const description = document.getElementById('edit-trip-description').value.trim();
      const startDate = document.getElementById('edit-trip-start-date').value;
      const endDate = document.getElementById('edit-trip-end-date').value;
      
      // Validate required fields
      if (!title || !startDate || !endDate) {
        const errorElement = document.getElementById('edit-trip-error');
        errorElement.textContent = 'Please fill in all required fields';
        errorElement.classList.remove('d-none');
        return;
      }
      
      // Validate that start date is before or equal to end date
      if (new Date(startDate) > new Date(endDate)) {
        const errorElement = document.getElementById('edit-trip-error');
        errorElement.textContent = 'Start date must be before or equal to end date';
        errorElement.classList.remove('d-none');
        return;
      }
      
      const tripUpdateData = {
        title,
        description: description || null,
        start_date: startDate,
        end_date: endDate
      };
      
      // Disable update button and show loading
      const updateBtn = document.getElementById('update-trip-btn');
      updateBtn.disabled = true;
      updateBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...';
      
      // Send API request
      const response = await fetch(apiUrls.trip, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(tripUpdateData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update trip');
      }
      
      const updatedTrip = await response.json();
      
      // Update local data
      tripData = updatedTrip;
      
      // Close modal
      bootstrap.Modal.getInstance(document.getElementById('edit-trip-modal')).hide();
      
      // Update UI
      document.querySelector('.trip-title').textContent = tripData.title;
      document.querySelector('.trip-description').textContent = tripData.description || 'No description available';
      document.querySelector('#trip-date-range').textContent = `${new Date(tripData.start_date).toLocaleDateString()} - ${new Date(tripData.end_date).toLocaleDateString()}`;
      
      // Update trip duration
      updateTripDuration();
      updateCounters();
      renderItinerary(); // Re-render to update day labels
      
      // Show success message
      showToast('Trip updated successfully', 'success');
      
      // Reload page after a short delay to ensure everything is in sync
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Error updating trip:', error);
      showToast(error.message || 'Failed to update trip', 'danger');
      
      // Re-enable update button
      const updateBtn = document.getElementById('update-trip-btn');
      updateBtn.disabled = false;
      updateBtn.textContent = 'Save Changes';
    }
  }
  
  // Utility function to format time (e.g., "13:30" to "1:30 PM")
  function formatTime(timeStr) {
    if (!timeStr) return '';
    
    try {
      // If timeStr is date string, extract time part
      if (timeStr.includes('T')) {
        timeStr = timeStr.split('T')[1].substring(0, 5);
      }
      
      const [hours, minutes] = timeStr.split(':').map(Number);
      const period = hours >= 12 ? 'PM' : 'AM';
      const hour12 = hours % 12 || 12;
      return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
    } catch (e) {
      console.error('Error formatting time:', e);
      return timeStr;
    }
  }
  
  // Format time for 24-hour input (e.g., "2023-04-15T13:30:00" to "13:30")
  function formatTime24h(timeStr) {
    if (!timeStr) return '';
    
    try {
      // If timeStr is a date string, extract time part
      if (timeStr.includes('T')) {
        return timeStr.split('T')[1].substring(0, 5);
      }
      return timeStr.substring(0, 5);
    } catch (e) {
      console.error('Error formatting 24h time:', e);
      return timeStr;
    }
  }
  
  // Format date for input (e.g., "2023-04-15T00:00:00" to "2023-04-15")
  function formatDateForInput(dateStr) {
    if (!dateStr) return '';
    
    try {
      const date = new Date(dateStr);
      return date.toISOString().split('T')[0];
    } catch (e) {
      console.error('Error formatting date for input:', e);
      return dateStr;
    }
  }
  
  // Truncate text to a specified length with ellipsis
  function truncateText(text, maxLength) {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }
  
  // Show toast notification
  function showToast(message, type = 'primary') {
    // Check if a toast container exists, if not, create one
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
      document.body.appendChild(toastContainer);
    }
    
    // Create a new toast element
    const toastId = 'toast-' + Date.now();
    const toast = document.createElement('div');
    toast.className = `toast bg-${type} text-white`;
    toast.role = 'alert';
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
});

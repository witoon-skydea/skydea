const axios = require('axios');
require('dotenv').config();

// Configuration
// Ensure proper path handling - fix potential double slashes
const basePath = process.env.APP_BASE_PATH || '/';
const normBasePath = basePath.endsWith('/') ? basePath : `${basePath}/`;
const API_BASE_URL = `http://localhost:${process.env.PORT || 3000}${normBasePath}api`;
console.log(`Using API base URL: ${API_BASE_URL}`);
const TEST_USERNAME = 'testuser'; // This user must exist in your database

// First, let's ensure we have a test user
async function ensureTestUser() {
  try {
    // Check if test user exists by trying to register
    const registerResponse = await apiRequest('POST', '/users/register', {
      username: TEST_USERNAME,
      email: `${TEST_USERNAME}@example.com`,
      password: 'password123'
    });
    
    console.log('User registration result:', registerResponse.success ? 'Success' : 'Failed (might already exist)');
    
    return true;
  } catch (error) {
    console.log('User might already exist, continuing with tests');
    return true;
  }
}

// Helper function to make API requests with consistent authentication
async function apiRequest(method, endpoint, data = null) {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Add username to data if not present
    const requestData = data || {};
    if (!requestData.username) {
      requestData.username = TEST_USERNAME;
    }
    
    const config = {
      method,
      url,
      headers: {
        'Content-Type': 'application/json',
        'x-username': TEST_USERNAME
      },
      data: requestData
    };
    
    console.log(`${method} ${url}`);
    const response = await axios(config);
    return response.data;
  } catch (error) {
    if (error.response) {
      console.error(`Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
      return error.response.data;
    } else {
      console.error(`Error: ${error.message}`);
      throw error;
    }
  }
}

// Test all API endpoints
async function runTests() {
  try {
    console.log('\n=== STARTING API TESTS ===\n');
    
    // Ensure test user exists
    await ensureTestUser();
    
    // Test user profile
    console.log('\n--- Testing User API ---\n');
    const userProfile = await apiRequest('GET', '/users/profile');
    console.log('User profile:', userProfile);
    
    // Test trips
    console.log('\n--- Testing Trip API ---\n');
    
    // Get all trips
    const allTrips = await apiRequest('GET', '/trips');
    console.log('All trips:', allTrips);
    
    // Create a new trip
    const newTrip = await apiRequest('POST', '/trips', {
      title: 'Test Trip',
      description: 'A trip created by the API test script',
      start_date: '2025-06-01',
      end_date: '2025-06-07',
      is_public: true
    });
    console.log('New trip created:', newTrip);
    
    if (newTrip.success && newTrip.data && newTrip.data.id) {
      const tripId = newTrip.data.id;
      
      // Get the trip by ID
      const trip = await apiRequest('GET', `/trips/${tripId}`);
      console.log('Trip by ID:', trip);
      
      // Update the trip
      const updatedTrip = await apiRequest('PUT', `/trips/${tripId}`, {
        title: 'Updated Test Trip',
        description: 'This trip was updated by the API test script',
        start_date: '2025-06-02',
        end_date: '2025-06-08',
        is_public: false
      });
      console.log('Updated trip:', updatedTrip);
      
      // Test places
      console.log('\n--- Testing Place API ---\n');
      
      // Create a new place
      const newPlace = await apiRequest('POST', '/places', {
        trip_id: tripId,
        name: 'Test Place',
        description: 'A place created by the API test script',
        latitude: 35.6586,
        longitude: 139.7454,
        address: '4 Chome-2-8 Shibakoen, Minato City, Tokyo',
        category: 'attraction'
      });
      console.log('New place created:', newPlace);
      
      if (newPlace.success && newPlace.data && newPlace.data.id) {
        const placeId = newPlace.data.id;
        
        // Get all places for the trip
        const tripPlaces = await apiRequest('GET', `/places/trip/${tripId}`);
        console.log('Trip places:', tripPlaces);
        
        // Get the place by ID
        const place = await apiRequest('GET', `/places/${placeId}`);
        console.log('Place by ID:', place);
        
        // Update the place
        const updatedPlace = await apiRequest('PUT', `/places/${placeId}`, {
          name: 'Updated Test Place',
          description: 'This place was updated by the API test script',
          category: 'landmark'
        });
        console.log('Updated place:', updatedPlace);
        
        // Test itinerary items
        console.log('\n--- Testing Itinerary API ---\n');
        
        // Create a new itinerary item
        const newItem = await apiRequest('POST', '/itinerary', {
          trip_id: tripId,
          place_id: placeId,
          title: 'Test Itinerary Item',
          description: 'An itinerary item created by the API test script',
          start_time: '2025-06-02T10:00:00',
          end_time: '2025-06-02T12:00:00',
          day_number: 1,
          order_index: 0,
          tags: ['test', 'api']
        });
        console.log('New itinerary item created:', newItem);
        
        if (newItem.success && newItem.data && newItem.data.id) {
          const itemId = newItem.data.id;
          
          // Get all itinerary items for the trip
          const tripItems = await apiRequest('GET', `/itinerary/trip/${tripId}`);
          console.log('Trip itinerary items:', tripItems);
          
          // Get itinerary items for a specific day
          const dayItems = await apiRequest('GET', `/itinerary/trip/${tripId}/day/1`);
          console.log('Day 1 itinerary items:', dayItems);
          
          // Get the itinerary item by ID
          const item = await apiRequest('GET', `/itinerary/${itemId}`);
          console.log('Itinerary item by ID:', item);
          
          // Update the itinerary item
          const updatedItem = await apiRequest('PUT', `/itinerary/${itemId}`, {
            title: 'Updated Test Itinerary Item',
            description: 'This itinerary item was updated by the API test script',
            start_time: '2025-06-02T11:00:00',
            end_time: '2025-06-02T13:00:00',
            day_number: 1,
            order_index: 0,
            tags: ['updated', 'test', 'api']
          });
          console.log('Updated itinerary item:', updatedItem);
          
          // Create a second itinerary item for testing order updates
          const secondItem = await apiRequest('POST', '/itinerary', {
            trip_id: tripId,
            title: 'Second Test Item',
            description: 'A second itinerary item for testing',
            start_time: '2025-06-02T14:00:00',
            end_time: '2025-06-02T16:00:00',
            day_number: 1,
            order_index: 1
          });
          console.log('Second itinerary item created:', secondItem);
          
          if (secondItem.success && secondItem.data && secondItem.data.id) {
            const secondItemId = secondItem.data.id;
            
            // Update the order of items
            const orderUpdate = await apiRequest('PUT', '/itinerary/order', {
              username: TEST_USERNAME,
              items: [
                { id: itemId, order_index: 1 },
                { id: secondItemId, order_index: 0 }
              ]
            });
            console.log('Order update:', orderUpdate);
            
            // Move an item to a different day
            const moveItem = await apiRequest('PUT', `/itinerary/${secondItemId}/move/2`, {
              order_index: 0
            });
            console.log('Move item to day 2:', moveItem);
            
            // Cleanup - Delete itinerary items
            console.log('\n--- Cleaning up ---\n');
            
            const deleteSecondItem = await apiRequest('DELETE', `/itinerary/${secondItemId}`);
            console.log('Delete second itinerary item:', deleteSecondItem);
            
            const deleteFirstItem = await apiRequest('DELETE', `/itinerary/${itemId}`);
            console.log('Delete first itinerary item:', deleteFirstItem);
          }
        }
        
        // Cleanup - Delete place
        const deletePlace = await apiRequest('DELETE', `/places/${placeId}`);
        console.log('Delete place:', deletePlace);
      }
      
      // Cleanup - Delete trip
      const deleteTrip = await apiRequest('DELETE', `/trips/${tripId}`);
      console.log('Delete trip:', deleteTrip);
    }
    
    console.log('\n=== API TESTS COMPLETED ===\n');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the tests
runTests();

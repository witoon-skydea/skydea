# Skydea API Client Examples

This document provides examples of how to interact with the Skydea API using different programming languages.

## Prerequisites

- An API key generated from the Skydea web interface
- The base URL of your Skydea application

## JavaScript / Node.js Example

### Using Fetch API (Browser/Node.js with node-fetch)

```javascript
// Set your API key and base URL
const API_KEY = 'your_api_key_here';
const BASE_URL = 'https://yourdomain.com/api/external';

// Helper function for API requests
async function apiRequest(endpoint, method = 'GET', data = null) {
  const url = `${BASE_URL}${endpoint}`;
  
  const options = {
    method,
    headers: {
      'X-API-Key': API_KEY,
      'Content-Type': 'application/json'
    }
  };
  
  if (data && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(data);
  }
  
  const response = await fetch(url, options);
  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.error || 'API request failed');
  }
  
  return result;
}

// Example: Get all trips
async function getAllTrips() {
  try {
    const result = await apiRequest('/trips');
    console.log('Trips:', result.data);
    return result.data;
  } catch (error) {
    console.error('Error getting trips:', error.message);
    throw error;
  }
}

// Example: Create a trip
async function createTrip(tripData) {
  try {
    const result = await apiRequest('/trips', 'POST', tripData);
    console.log('Trip created:', result.data);
    return result.data;
  } catch (error) {
    console.error('Error creating trip:', error.message);
    throw error;
  }
}

// Example: Add a place to a trip
async function addPlace(placeData) {
  try {
    const result = await apiRequest('/places', 'POST', placeData);
    console.log('Place added:', result.data);
    return result.data;
  } catch (error) {
    console.error('Error adding place:', error.message);
    throw error;
  }
}

// Example: Add an activity to a trip
async function addActivity(activityData) {
  try {
    const result = await apiRequest('/activities', 'POST', activityData);
    console.log('Activity added:', result.data);
    return result.data;
  } catch (error) {
    console.error('Error adding activity:', error.message);
    throw error;
  }
}

// Usage example
async function main() {
  try {
    // Create a new trip
    const trip = await createTrip({
      title: 'Weekend in Chiang Mai',
      description: 'Quick weekend getaway',
      start_date: '2025-06-15',
      end_date: '2025-06-17',
      is_public: false
    });
    
    // Add a place to the trip
    const place = await addPlace({
      trip_id: trip.id,
      name: 'Doi Suthep',
      description: 'Temple on the mountain',
      latitude: 18.8048,
      longitude: 98.9217,
      address: 'Doi Suthep, Chiang Mai',
      category: 'sight seeing'
    });
    
    // Add an activity to the trip
    const activity = await addActivity({
      trip_id: trip.id,
      place_id: place.id,
      title: 'Visit Doi Suthep Temple',
      description: 'Explore the temple and enjoy the view',
      start_time: '2025-06-16 09:00:00',
      end_time: '2025-06-16 12:00:00',
      day_number: 2,
      order_index: 1,
      tags: ['temple', 'mountain']
    });
    
    console.log('Successfully created trip with place and activity');
  } catch (error) {
    console.error('Error in main process:', error.message);
  }
}

main();
```

## Python Example

```python
import requests
import json

# Set your API key and base URL
API_KEY = 'your_api_key_here'
BASE_URL = 'https://yourdomain.com/api/external'

# Helper function for API requests
def api_request(endpoint, method='GET', data=None):
    url = f"{BASE_URL}{endpoint}"
    
    headers = {
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json'
    }
    
    if method == 'GET':
        response = requests.get(url, headers=headers)
    elif method == 'POST':
        response = requests.post(url, headers=headers, json=data)
    elif method == 'PUT':
        response = requests.put(url, headers=headers, json=data)
    elif method == 'DELETE':
        response = requests.delete(url, headers=headers)
    else:
        raise ValueError(f"Unsupported method: {method}")
    
    if response.status_code not in (200, 201):
        try:
            error_data = response.json()
            error_message = error_data.get('error', 'Unknown error')
        except:
            error_message = f"API request failed with status code {response.status_code}"
        
        raise Exception(error_message)
    
    return response.json()

# Example: Get all trips
def get_all_trips():
    try:
        result = api_request('/trips')
        print('Trips:', result['data'])
        return result['data']
    except Exception as e:
        print(f'Error getting trips: {str(e)}')
        raise

# Example: Create a trip
def create_trip(trip_data):
    try:
        result = api_request('/trips', method='POST', data=trip_data)
        print('Trip created:', result['data'])
        return result['data']
    except Exception as e:
        print(f'Error creating trip: {str(e)}')
        raise

# Example: Add a place to a trip
def add_place(place_data):
    try:
        result = api_request('/places', method='POST', data=place_data)
        print('Place added:', result['data'])
        return result['data']
    except Exception as e:
        print(f'Error adding place: {str(e)}')
        raise

# Example: Add an activity to a trip
def add_activity(activity_data):
    try:
        result = api_request('/activities', method='POST', data=activity_data)
        print('Activity added:', result['data'])
        return result['data']
    except Exception as e:
        print(f'Error adding activity: {str(e)}')
        raise

# Usage example
def main():
    try:
        # Create a new trip
        trip = create_trip({
            'title': 'Weekend in Chiang Mai',
            'description': 'Quick weekend getaway',
            'start_date': '2025-06-15',
            'end_date': '2025-06-17',
            'is_public': False
        })
        
        # Add a place to the trip
        place = add_place({
            'trip_id': trip['id'],
            'name': 'Doi Suthep',
            'description': 'Temple on the mountain',
            'latitude': 18.8048,
            'longitude': 98.9217,
            'address': 'Doi Suthep, Chiang Mai',
            'category': 'sight seeing'
        })
        
        # Add an activity to the trip
        activity = add_activity({
            'trip_id': trip['id'],
            'place_id': place['id'],
            'title': 'Visit Doi Suthep Temple',
            'description': 'Explore the temple and enjoy the view',
            'start_time': '2025-06-16 09:00:00',
            'end_time': '2025-06-16 12:00:00',
            'day_number': 2,
            'order_index': 1,
            'tags': ['temple', 'mountain']
        })
        
        print('Successfully created trip with place and activity')
    except Exception as e:
        print(f'Error in main process: {str(e)}')

if __name__ == '__main__':
    main()
```

## PHP Example

```php
<?php
// Set your API key and base URL
$API_KEY = 'your_api_key_here';
$BASE_URL = 'https://yourdomain.com/api/external';

// Helper function for API requests
function apiRequest($endpoint, $method = 'GET', $data = null) {
    global $API_KEY, $BASE_URL;
    
    $url = $BASE_URL . $endpoint;
    
    $headers = [
        'X-API-Key: ' . $API_KEY,
        'Content-Type: application/json'
    ];
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    
    if ($method === 'POST') {
        curl_setopt($ch, CURLOPT_POST, true);
        if ($data) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        }
    } else if ($method === 'PUT') {
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
        if ($data) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        }
    } else if ($method === 'DELETE') {
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'DELETE');
    }
    
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    
    if (curl_errno($ch)) {
        throw new Exception('cURL error: ' . curl_error($ch));
    }
    
    curl_close($ch);
    
    $result = json_decode($response, true);
    
    if ($http_code < 200 || $http_code >= 300) {
        throw new Exception($result['error'] ?? 'API request failed with status code ' . $http_code);
    }
    
    return $result;
}

// Example: Get all trips
function getAllTrips() {
    try {
        $result = apiRequest('/trips');
        echo "Trips: " . json_encode($result['data'], JSON_PRETTY_PRINT) . "\n";
        return $result['data'];
    } catch (Exception $e) {
        echo "Error getting trips: " . $e->getMessage() . "\n";
        throw $e;
    }
}

// Example: Create a trip
function createTrip($tripData) {
    try {
        $result = apiRequest('/trips', 'POST', $tripData);
        echo "Trip created: " . json_encode($result['data'], JSON_PRETTY_PRINT) . "\n";
        return $result['data'];
    } catch (Exception $e) {
        echo "Error creating trip: " . $e->getMessage() . "\n";
        throw $e;
    }
}

// Example: Add a place to a trip
function addPlace($placeData) {
    try {
        $result = apiRequest('/places', 'POST', $placeData);
        echo "Place added: " . json_encode($result['data'], JSON_PRETTY_PRINT) . "\n";
        return $result['data'];
    } catch (Exception $e) {
        echo "Error adding place: " . $e->getMessage() . "\n";
        throw $e;
    }
}

// Example: Add an activity to a trip
function addActivity($activityData) {
    try {
        $result = apiRequest('/activities', 'POST', $activityData);
        echo "Activity added: " . json_encode($result['data'], JSON_PRETTY_PRINT) . "\n";
        return $result['data'];
    } catch (Exception $e) {
        echo "Error adding activity: " . $e->getMessage() . "\n";
        throw $e;
    }
}

// Usage example
function main() {
    try {
        // Create a new trip
        $trip = createTrip([
            'title' => 'Weekend in Chiang Mai',
            'description' => 'Quick weekend getaway',
            'start_date' => '2025-06-15',
            'end_date' => '2025-06-17',
            'is_public' => false
        ]);
        
        // Add a place to the trip
        $place = addPlace([
            'trip_id' => $trip['id'],
            'name' => 'Doi Suthep',
            'description' => 'Temple on the mountain',
            'latitude' => 18.8048,
            'longitude' => 98.9217,
            'address' => 'Doi Suthep, Chiang Mai',
            'category' => 'sight seeing'
        ]);
        
        // Add an activity to the trip
        $activity = addActivity([
            'trip_id' => $trip['id'],
            'place_id' => $place['id'],
            'title' => 'Visit Doi Suthep Temple',
            'description' => 'Explore the temple and enjoy the view',
            'start_time' => '2025-06-16 09:00:00',
            'end_time' => '2025-06-16 12:00:00',
            'day_number' => 2,
            'order_index' => 1,
            'tags' => ['temple', 'mountain']
        ]);
        
        echo "Successfully created trip with place and activity\n";
    } catch (Exception $e) {
        echo "Error in main process: " . $e->getMessage() . "\n";
    }
}

main();
?>
```

## Java Example

```java
import java.io.IOException;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Scanner;
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;

public class SkydeaApiClient {
    private static final String API_KEY = "your_api_key_here";
    private static final String BASE_URL = "https://yourdomain.com/api/external";
    private static final Gson gson = new Gson();
    
    // Helper method for API requests
    private static Map<String, Object> apiRequest(String endpoint, String method, Map<String, Object> data) throws IOException {
        URL url = new URL(BASE_URL + endpoint);
        HttpURLConnection connection = (HttpURLConnection) url.openConnection();
        connection.setRequestMethod(method);
        connection.setRequestProperty("X-API-Key", API_KEY);
        connection.setRequestProperty("Content-Type", "application/json");
        connection.setDoOutput(true);
        
        if (data != null && (method.equals("POST") || method.equals("PUT"))) {
            String jsonData = gson.toJson(data);
            try (OutputStream os = connection.getOutputStream()) {
                byte[] input = jsonData.getBytes(StandardCharsets.UTF_8);
                os.write(input, 0, input.length);
            }
        }
        
        int responseCode = connection.getResponseCode();
        
        if (responseCode >= 200 && responseCode < 300) {
            Scanner scanner = new Scanner(connection.getInputStream(), StandardCharsets.UTF_8.name());
            String responseBody = scanner.useDelimiter("\\A").next();
            scanner.close();
            
            return gson.fromJson(responseBody, new TypeToken<Map<String, Object>>(){}.getType());
        } else {
            Scanner scanner = new Scanner(connection.getErrorStream(), StandardCharsets.UTF_8.name());
            String errorBody = scanner.useDelimiter("\\A").hasNext() ? scanner.next() : "";
            scanner.close();
            
            Map<String, Object> errorData = gson.fromJson(errorBody, new TypeToken<Map<String, Object>>(){}.getType());
            String errorMessage = errorData.containsKey("error") ? errorData.get("error").toString() : "API request failed with status code " + responseCode;
            
            throw new IOException(errorMessage);
        }
    }
    
    // Example: Get all trips
    public static List<Map<String, Object>> getAllTrips() throws IOException {
        try {
            Map<String, Object> result = apiRequest("/trips", "GET", null);
            List<Map<String, Object>> trips = gson.fromJson(gson.toJson(result.get("data")), new TypeToken<List<Map<String, Object>>>(){}.getType());
            System.out.println("Trips: " + gson.toJson(trips));
            return trips;
        } catch (IOException e) {
            System.err.println("Error getting trips: " + e.getMessage());
            throw e;
        }
    }
    
    // Example: Create a trip
    public static Map<String, Object> createTrip(Map<String, Object> tripData) throws IOException {
        try {
            Map<String, Object> result = apiRequest("/trips", "POST", tripData);
            Map<String, Object> trip = gson.fromJson(gson.toJson(result.get("data")), new TypeToken<Map<String, Object>>(){}.getType());
            System.out.println("Trip created: " + gson.toJson(trip));
            return trip;
        } catch (IOException e) {
            System.err.println("Error creating trip: " + e.getMessage());
            throw e;
        }
    }
    
    // Example: Add a place to a trip
    public static Map<String, Object> addPlace(Map<String, Object> placeData) throws IOException {
        try {
            Map<String, Object> result = apiRequest("/places", "POST", placeData);
            Map<String, Object> place = gson.fromJson(gson.toJson(result.get("data")), new TypeToken<Map<String, Object>>(){}.getType());
            System.out.println("Place added: " + gson.toJson(place));
            return place;
        } catch (IOException e) {
            System.err.println("Error adding place: " + e.getMessage());
            throw e;
        }
    }
    
    // Example: Add an activity to a trip
    public static Map<String, Object> addActivity(Map<String, Object> activityData) throws IOException {
        try {
            Map<String, Object> result = apiRequest("/activities", "POST", activityData);
            Map<String, Object> activity = gson.fromJson(gson.toJson(result.get("data")), new TypeToken<Map<String, Object>>(){}.getType());
            System.out.println("Activity added: " + gson.toJson(activity));
            return activity;
        } catch (IOException e) {
            System.err.println("Error adding activity: " + e.getMessage());
            throw e;
        }
    }
    
    // Usage example
    public static void main(String[] args) {
        try {
            // Create a new trip
            Map<String, Object> tripData = new HashMap<>();
            tripData.put("title", "Weekend in Chiang Mai");
            tripData.put("description", "Quick weekend getaway");
            tripData.put("start_date", "2025-06-15");
            tripData.put("end_date", "2025-06-17");
            tripData.put("is_public", false);
            
            Map<String, Object> trip = createTrip(tripData);
            
            // Add a place to the trip
            Map<String, Object> placeData = new HashMap<>();
            placeData.put("trip_id", ((Double) trip.get("id")).intValue());
            placeData.put("name", "Doi Suthep");
            placeData.put("description", "Temple on the mountain");
            placeData.put("latitude", 18.8048);
            placeData.put("longitude", 98.9217);
            placeData.put("address", "Doi Suthep, Chiang Mai");
            placeData.put("category", "sight seeing");
            
            Map<String, Object> place = addPlace(placeData);
            
            // Add an activity to the trip
            Map<String, Object> activityData = new HashMap<>();
            activityData.put("trip_id", ((Double) trip.get("id")).intValue());
            activityData.put("place_id", ((Double) place.get("id")).intValue());
            activityData.put("title", "Visit Doi Suthep Temple");
            activityData.put("description", "Explore the temple and enjoy the view");
            activityData.put("start_time", "2025-06-16 09:00:00");
            activityData.put("end_time", "2025-06-16 12:00:00");
            activityData.put("day_number", 2);
            activityData.put("order_index", 1);
            
            List<String> tags = new ArrayList<>();
            tags.add("temple");
            tags.add("mountain");
            activityData.put("tags", tags);
            
            Map<String, Object> activity = addActivity(activityData);
            
            System.out.println("Successfully created trip with place and activity");
        } catch (Exception e) {
            System.err.println("Error in main process: " + e.getMessage());
        }
    }
}
```

## Example Usage Scenarios

### 1. Creating a Complete Trip Itinerary

```javascript
// Example in JavaScript
async function createFullTrip() {
  try {
    // Create a new trip
    const trip = await createTrip({
      title: 'Bangkok Exploration',
      description: 'A week in Bangkok exploring the city',
      start_date: '2025-07-10',
      end_date: '2025-07-17',
      is_public: true
    });
    
    // Add multiple places to the trip
    const places = [];
    
    places.push(await addPlace({
      trip_id: trip.id,
      name: 'Grand Palace',
      description: 'Historic palace complex',
      latitude: 13.7500,
      longitude: 100.4900,
      address: 'Na Phra Lan Rd, Bangkok',
      category: 'sight seeing'
    }));
    
    places.push(await addPlace({
      trip_id: trip.id,
      name: 'Chatuchak Weekend Market',
      description: 'Huge weekend market',
      latitude: 13.7999,
      longitude: 100.5500,
      address: 'Kamphaeng Phet 2 Rd, Bangkok',
      category: 'shopping'
    }));
    
    places.push(await addPlace({
      trip_id: trip.id,
      name: 'Wat Arun',
      description: 'Temple of Dawn',
      latitude: 13.7435,
      longitude: 100.4889,
      address: 'Arun Amarin Rd, Bangkok',
      category: 'sight seeing'
    }));
    
    // Add activities for each day
    
    // Day 1
    await addActivity({
      trip_id: trip.id,
      place_id: places[0].id,
      title: 'Visit Grand Palace',
      description: 'Explore the historic palace complex',
      start_time: '2025-07-11 09:00:00',
      end_time: '2025-07-11 12:00:00',
      day_number: 1,
      order_index: 1,
      tags: ['cultural', 'must-see']
    });
    
    await addActivity({
      trip_id: trip.id,
      title: 'Lunch at Local Restaurant',
      description: 'Try authentic Thai cuisine',
      start_time: '2025-07-11 12:30:00',
      end_time: '2025-07-11 14:00:00',
      day_number: 1,
      order_index: 2,
      tags: ['food']
    });
    
    // Day 2
    await addActivity({
      trip_id: trip.id,
      place_id: places[1].id,
      title: 'Shopping at Chatuchak',
      description: 'Explore the massive weekend market',
      start_time: '2025-07-12 10:00:00',
      end_time: '2025-07-12 14:00:00',
      day_number: 2,
      order_index: 1,
      tags: ['shopping', 'local']
    });
    
    // Day 3
    await addActivity({
      trip_id: trip.id,
      place_id: places[2].id,
      title: 'Visit Wat Arun',
      description: 'Explore the Temple of Dawn',
      start_time: '2025-07-13 09:00:00',
      end_time: '2025-07-13 11:00:00',
      day_number: 3,
      order_index: 1,
      tags: ['cultural', 'temple']
    });
    
    console.log('Successfully created full trip itinerary');
    return trip.id;
  } catch (error) {
    console.error('Error creating full trip:', error.message);
    throw error;
  }
}
```

### 2. Updating an Existing Trip

```javascript
// Example in JavaScript
async function updateExistingTrip(tripId) {
  try {
    // Get the trip details
    const tripResponse = await apiRequest(`/trips/${tripId}`);
    const tripData = tripResponse.data;
    
    // Update the trip dates
    await apiRequest(`/trips/${tripId}`, 'PUT', {
      title: tripData.trip.title,
      description: tripData.trip.description,
      start_date: '2025-07-12', // Changed from original
      end_date: '2025-07-19',   // Changed from original
      is_public: tripData.trip.is_public
    });
    
    // Update an existing place
    const placeId = tripData.places[0].id;
    await apiRequest(`/places/${placeId}`, 'PUT', {
      name: tripData.places[0].name,
      description: 'Updated description with more details about the historic palace complex',
      latitude: tripData.places[0].latitude,
      longitude: tripData.places[0].longitude,
      address: tripData.places[0].address,
      category: tripData.places[0].category
    });
    
    // Add a new activity
    await addActivity({
      trip_id: tripId,
      title: 'River Cruise',
      description: 'Evening dinner cruise on the Chao Phraya River',
      start_time: '2025-07-13 18:00:00',
      end_time: '2025-07-13 21:00:00',
      day_number: 3,
      order_index: 2,
      tags: ['relaxation', 'dinner']
    });
    
    console.log('Successfully updated trip');
  } catch (error) {
    console.error('Error updating trip:', error.message);
    throw error;
  }
}
```

These examples showcase how to use the Skydea API in different programming languages and for common scenarios. Adjust the API endpoint URLs, API keys, and specific parameters according to your application's needs.

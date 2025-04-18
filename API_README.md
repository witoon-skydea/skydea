# Skydea API Documentation

This document provides information about the Skydea API, which allows accessing and creating data in the SQLite database according to the project's data structure.

## Authentication

The API uses a simple username-based authentication method rather than API keys. You need to provide a valid username in one of the following ways:

- Request body: `{ "username": "yourUsername", ... }`
- Query parameter: `?username=yourUsername`
- Header: `x-username: yourUsername`

All API endpoints (except explicitly marked public endpoints) require authentication.

## Base URL

The API base URL depends on your configuration:

- If `APP_BASE_PATH=/`: `http://yourdomain.com/api`
- If `APP_BASE_PATH=/skydea`: `http://yourdomain.com/skydea/api`

## Response Format

All API responses follow this format:

```json
{
  "success": true|false,
  "message": "Optional message",
  "data": { /* Response data object or array */ },
  "count": 123, // Only for list endpoints
  "error": "Error message" // Only for error responses
}
```

## API Endpoints

### User API

#### Get User Profile

```
GET /api/users/profile
```

Retrieves the authenticated user's profile information.

#### Update User Profile

```
PUT /api/users/profile
```

Updates the authenticated user's profile information.

**Request Body:**

```json
{
  "username": "yourUsername", // Required for authentication
  "email": "newemail@example.com", // Optional
  "google_maps_api_key": "your-api-key" // Optional
}
```

#### Register a New User

```
POST /api/users/register
```

Registers a new user account.

**Request Body:**

```json
{
  "username": "newuser",
  "email": "newuser@example.com",
  "password": "securepassword",
  "google_maps_api_key": "your-api-key" // Optional
}
```

### Trip API

#### Get All Trips

```
GET /api/trips
```

Retrieves all trips for the authenticated user.

#### Get Trip by ID

```
GET /api/trips/:id
```

Retrieves a specific trip by ID.

#### Create a Trip

```
POST /api/trips
```

Creates a new trip.

**Request Body:**

```json
{
  "username": "yourUsername", // Required for authentication
  "title": "My Trip to Japan",
  "description": "Two weeks in Japan visiting Tokyo and Kyoto", // Optional
  "start_date": "2025-05-01",
  "end_date": "2025-05-15",
  "is_public": true // Optional, defaults to false
}
```

#### Update a Trip

```
PUT /api/trips/:id
```

Updates an existing trip.

**Request Body:**

```json
{
  "username": "yourUsername", // Required for authentication
  "title": "Updated Trip to Japan",
  "description": "Updated description", // Optional
  "start_date": "2025-05-02",
  "end_date": "2025-05-16",
  "is_public": false // Optional
}
```

#### Delete a Trip

```
DELETE /api/trips/:id
```

Deletes a trip and all associated places and itinerary items.

#### Get a Shared Trip

```
GET /api/trips/share/:shareCode
```

Retrieves a trip by its share code. This is a public endpoint and does not require authentication if the trip is marked as public.

### Place API

#### Get All Places for a Trip

```
GET /api/places/trip/:tripId
```

Retrieves all places associated with a trip.

#### Get a Place by ID

```
GET /api/places/:id
```

Retrieves a specific place by ID.

#### Create a Place

```
POST /api/places
```

Creates a new place.

**Request Body:**

```json
{
  "username": "yourUsername", // Required for authentication
  "trip_id": 123,
  "name": "Tokyo Tower",
  "description": "Famous tower in Tokyo", // Optional
  "latitude": 35.6586, // Optional
  "longitude": 139.7454, // Optional
  "address": "4 Chome-2-8 Shibakoen, Minato City, Tokyo", // Optional
  "place_id": "ChIJCewJkL2LGGAR0wK0xcha9FY", // Optional (Google Maps Place ID)
  "image_url": "https://example.com/image.jpg", // Optional
  "category": "attraction" // Optional
}
```

#### Update a Place

```
PUT /api/places/:id
```

Updates an existing place.

**Request Body:**

```json
{
  "username": "yourUsername", // Required for authentication
  "name": "Updated Tokyo Tower",
  "description": "Updated description", // Optional
  "latitude": 35.6586, // Optional
  "longitude": 139.7454, // Optional
  "address": "Updated address", // Optional
  "place_id": "ChIJCewJkL2LGGAR0wK0xcha9FY", // Optional
  "image_url": "https://example.com/new-image.jpg", // Optional
  "category": "landmark" // Optional
}
```

#### Delete a Place

```
DELETE /api/places/:id
```

Deletes a place.

### Itinerary API

#### Get All Itinerary Items for a Trip

```
GET /api/itinerary/trip/:tripId
```

Retrieves all itinerary items for a trip.

#### Get Itinerary Items for a Specific Day

```
GET /api/itinerary/trip/:tripId/day/:dayNumber
```

Retrieves all itinerary items for a specific day of a trip.

#### Get an Itinerary Item by ID

```
GET /api/itinerary/:id
```

Retrieves a specific itinerary item by ID.

#### Create an Itinerary Item

```
POST /api/itinerary
```

Creates a new itinerary item.

**Request Body:**

```json
{
  "username": "yourUsername", // Required for authentication
  "trip_id": 123,
  "place_id": 456, // Optional (reference to a place)
  "title": "Visit Tokyo Tower",
  "description": "Enjoy the view from the observation deck", // Optional
  "start_time": "2025-05-02T10:00:00",
  "end_time": "2025-05-02T12:00:00",
  "day_number": 2,
  "order_index": 1, // Optional, defaults to 0
  "tags": ["sightseeing", "photography"] // Optional
}
```

#### Update an Itinerary Item

```
PUT /api/itinerary/:id
```

Updates an existing itinerary item.

**Request Body:**

```json
{
  "username": "yourUsername", // Required for authentication
  "place_id": 456, // Optional
  "title": "Updated: Visit Tokyo Tower",
  "description": "Updated description", // Optional
  "start_time": "2025-05-02T11:00:00",
  "end_time": "2025-05-02T13:00:00",
  "day_number": 2,
  "order_index": 2, // Optional
  "tags": ["updated", "sightseeing"] // Optional
}
```

#### Update Order of Multiple Itinerary Items

```
PUT /api/itinerary/order
```

Updates the order of multiple itinerary items (for drag-and-drop reordering).

**Request Body:**

```json
{
  "username": "yourUsername", // Required for authentication
  "items": [
    { "id": 1, "order_index": 0 },
    { "id": 2, "order_index": 1 },
    { "id": 3, "order_index": 2 }
  ]
}
```

#### Move an Itinerary Item to a Different Day

```
PUT /api/itinerary/:id/move/:dayNumber
```

Moves an itinerary item to a different day.

**Request Body:**

```json
{
  "username": "yourUsername", // Required for authentication
  "order_index": 0 // Optional, defaults to 0
}
```

#### Delete an Itinerary Item

```
DELETE /api/itinerary/:id
```

Deletes an itinerary item.

## Error Handling

The API uses the following HTTP status codes:

- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Authentication failed
- `403 Forbidden`: User does not have permission to access the resource
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

## Testing

You can test the API using tools like Postman, cURL, or any HTTP client.

Example cURL request:

```bash
curl -X GET "http://localhost:3000/api/trips?username=testuser"
```

Example with JSON body:

```bash
curl -X POST "http://localhost:3000/api/trips" \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","title":"My Trip","start_date":"2025-05-01","end_date":"2025-05-15"}'
```

# Skydea API Documentation

This document provides instructions for using the Skydea API to create and manage trips, places, and activities.

## Authentication

All API requests require an API key. The API key can be provided in two ways:

1. Using the `X-API-Key` header:
```
X-API-Key: your_api_key_here
```

2. Using the `api_key` query parameter:
```
?api_key=your_api_key_here
```

## API Endpoints

### Base URL

All API endpoints are relative to:
```
{host}/api/external
```

### Trip Endpoints

#### Get All Trips

```
GET /trips
```

Retrieves all trips for the authenticated user.

**Response:**
```json
{
  "success": true,
  "message": "Trips retrieved successfully",
  "data": [
    {
      "id": 1,
      "user_id": 1,
      "title": "Trip to Bangkok",
      "description": "Annual vacation",
      "start_date": "2025-05-01",
      "end_date": "2025-05-07",
      "is_public": 0,
      "share_code": "abc123xyz",
      "created_at": "2025-04-10 12:00:00",
      "updated_at": "2025-04-10 12:00:00"
    },
    // More trips...
  ]
}
```

#### Get Trip by ID

```
GET /trips/:id
```

Retrieves a specific trip by ID, including its places and activities.

**Response:**
```json
{
  "success": true,
  "message": "Trip retrieved successfully",
  "data": {
    "trip": {
      "id": 1,
      "user_id": 1,
      "title": "Trip to Bangkok",
      "description": "Annual vacation",
      "start_date": "2025-05-01",
      "end_date": "2025-05-07",
      "is_public": 0,
      "share_code": "abc123xyz",
      "created_at": "2025-04-10 12:00:00",
      "updated_at": "2025-04-10 12:00:00"
    },
    "places": [
      {
        "id": 1,
        "trip_id": 1,
        "name": "Grand Palace",
        "description": "Historic palace complex",
        "latitude": 13.7500,
        "longitude": 100.4900,
        "address": "Na Phra Lan Rd, Bangkok",
        "place_id": "ChIJD7fiBg5hHTERZ9uHCDSHxpA",
        "image_url": "https://example.com/grandpalace.jpg",
        "category": "sight seeing",
        "created_at": "2025-04-10 12:30:00",
        "updated_at": "2025-04-10 12:30:00"
      },
      // More places...
    ],
    "itineraryItems": [
      {
        "id": 1,
        "trip_id": 1,
        "place_id": 1,
        "title": "Visit Grand Palace",
        "description": "Explore the historic palace",
        "start_time": "2025-05-02 09:00:00",
        "end_time": "2025-05-02 12:00:00",
        "day_number": 2,
        "order_index": 1,
        "tags": ["cultural", "must-see"],
        "created_at": "2025-04-10 13:00:00",
        "updated_at": "2025-04-10 13:00:00",
        "place_name": "Grand Palace",
        "latitude": 13.7500,
        "longitude": 100.4900,
        "address": "Na Phra Lan Rd, Bangkok"
      },
      // More activities...
    ]
  }
}
```

#### Create Trip

```
POST /trips
```

Creates a new trip.

**Request Body:**
```json
{
  "title": "Trip to Bangkok",
  "description": "Annual vacation",
  "start_date": "2025-05-01",
  "end_date": "2025-05-07",
  "is_public": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Trip created successfully",
  "data": {
    "id": 1,
    "user_id": 1,
    "title": "Trip to Bangkok",
    "description": "Annual vacation",
    "start_date": "2025-05-01",
    "end_date": "2025-05-07",
    "is_public": 0,
    "share_code": "abc123xyz",
    "created_at": "2025-04-10 12:00:00",
    "updated_at": "2025-04-10 12:00:00"
  }
}
```

#### Update Trip

```
PUT /trips/:id
```

Updates an existing trip.

**Request Body:**
```json
{
  "title": "Updated Trip to Bangkok",
  "description": "Updated annual vacation",
  "start_date": "2025-05-01",
  "end_date": "2025-05-10",
  "is_public": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Trip updated successfully",
  "data": {
    "id": 1,
    "user_id": 1,
    "title": "Updated Trip to Bangkok",
    "description": "Updated annual vacation",
    "start_date": "2025-05-01",
    "end_date": "2025-05-10",
    "is_public": 1,
    "share_code": "abc123xyz",
    "created_at": "2025-04-10 12:00:00",
    "updated_at": "2025-04-10 14:00:00"
  }
}
```

#### Delete Trip

```
DELETE /trips/:id
```

Deletes a trip and all associated places and activities.

**Response:**
```json
{
  "success": true,
  "message": "Trip deleted successfully"
}
```

### Place Endpoints

#### Get Places for Trip

```
GET /trips/:tripId/places
```

Retrieves all places for a specific trip.

**Response:**
```json
{
  "success": true,
  "message": "Places retrieved successfully",
  "data": [
    {
      "id": 1,
      "trip_id": 1,
      "name": "Grand Palace",
      "description": "Historic palace complex",
      "latitude": 13.7500,
      "longitude": 100.4900,
      "address": "Na Phra Lan Rd, Bangkok",
      "place_id": "ChIJD7fiBg5hHTERZ9uHCDSHxpA",
      "image_url": "https://example.com/grandpalace.jpg",
      "category": "sight seeing",
      "created_at": "2025-04-10 12:30:00",
      "updated_at": "2025-04-10 12:30:00"
    },
    // More places...
  ]
}
```

#### Create Place

```
POST /places
```

Creates a new place for a trip.

**Request Body:**
```json
{
  "trip_id": 1,
  "name": "Grand Palace",
  "description": "Historic palace complex",
  "latitude": 13.7500,
  "longitude": 100.4900,
  "address": "Na Phra Lan Rd, Bangkok",
  "place_id": "ChIJD7fiBg5hHTERZ9uHCDSHxpA",
  "image_url": "https://example.com/grandpalace.jpg",
  "category": "sight seeing"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Place created successfully",
  "data": {
    "id": 1,
    "trip_id": 1,
    "name": "Grand Palace",
    "description": "Historic palace complex",
    "latitude": 13.7500,
    "longitude": 100.4900,
    "address": "Na Phra Lan Rd, Bangkok",
    "place_id": "ChIJD7fiBg5hHTERZ9uHCDSHxpA",
    "image_url": "https://example.com/grandpalace.jpg",
    "category": "sight seeing",
    "created_at": "2025-04-10 12:30:00",
    "updated_at": "2025-04-10 12:30:00"
  }
}
```

#### Update Place

```
PUT /places/:id
```

Updates an existing place.

**Request Body:**
```json
{
  "name": "Updated Grand Palace",
  "description": "Updated historic palace complex",
  "latitude": 13.7500,
  "longitude": 100.4900,
  "address": "Na Phra Lan Rd, Bangkok",
  "place_id": "ChIJD7fiBg5hHTERZ9uHCDSHxpA",
  "image_url": "https://example.com/updated-grandpalace.jpg",
  "category": "sight seeing"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Place updated successfully",
  "data": {
    "id": 1,
    "trip_id": 1,
    "name": "Updated Grand Palace",
    "description": "Updated historic palace complex",
    "latitude": 13.7500,
    "longitude": 100.4900,
    "address": "Na Phra Lan Rd, Bangkok",
    "place_id": "ChIJD7fiBg5hHTERZ9uHCDSHxpA",
    "image_url": "https://example.com/updated-grandpalace.jpg",
    "category": "sight seeing",
    "created_at": "2025-04-10 12:30:00",
    "updated_at": "2025-04-10 14:30:00"
  }
}
```

#### Delete Place

```
DELETE /places/:id
```

Deletes a place.

**Response:**
```json
{
  "success": true,
  "message": "Place deleted successfully"
}
```

### Activity Endpoints

#### Get Activities for Trip

```
GET /trips/:tripId/activities
```

Retrieves all activities for a specific trip.

**Response:**
```json
{
  "success": true,
  "message": "Activities retrieved successfully",
  "data": [
    {
      "id": 1,
      "trip_id": 1,
      "place_id": 1,
      "title": "Visit Grand Palace",
      "description": "Explore the historic palace",
      "start_time": "2025-05-02 09:00:00",
      "end_time": "2025-05-02 12:00:00",
      "day_number": 2,
      "order_index": 1,
      "tags": ["cultural", "must-see"],
      "created_at": "2025-04-10 13:00:00",
      "updated_at": "2025-04-10 13:00:00",
      "place_name": "Grand Palace",
      "latitude": 13.7500,
      "longitude": 100.4900,
      "address": "Na Phra Lan Rd, Bangkok"
    },
    // More activities...
  ]
}
```

#### Create Activity

```
POST /activities
```

Creates a new activity for a trip.

**Request Body:**
```json
{
  "trip_id": 1,
  "place_id": 1,
  "title": "Visit Grand Palace",
  "description": "Explore the historic palace",
  "start_time": "2025-05-02 09:00:00",
  "end_time": "2025-05-02 12:00:00",
  "day_number": 2,
  "order_index": 1,
  "tags": ["cultural", "must-see"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Activity created successfully",
  "data": {
    "id": 1,
    "trip_id": 1,
    "place_id": 1,
    "title": "Visit Grand Palace",
    "description": "Explore the historic palace",
    "start_time": "2025-05-02 09:00:00",
    "end_time": "2025-05-02 12:00:00",
    "day_number": 2,
    "order_index": 1,
    "tags": ["cultural", "must-see"],
    "created_at": "2025-04-10 13:00:00",
    "updated_at": "2025-04-10 13:00:00"
  }
}
```

#### Update Activity

```
PUT /activities/:id
```

Updates an existing activity.

**Request Body:**
```json
{
  "place_id": 1,
  "title": "Updated Visit to Grand Palace",
  "description": "Updated exploration of the historic palace",
  "start_time": "2025-05-02 09:30:00",
  "end_time": "2025-05-02 12:30:00",
  "day_number": 2,
  "order_index": 1,
  "tags": ["cultural", "must-see", "updated"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Activity updated successfully",
  "data": {
    "id": 1,
    "trip_id": 1,
    "place_id": 1,
    "title": "Updated Visit to Grand Palace",
    "description": "Updated exploration of the historic palace",
    "start_time": "2025-05-02 09:30:00",
    "end_time": "2025-05-02 12:30:00",
    "day_number": 2,
    "order_index": 1,
    "tags": ["cultural", "must-see", "updated"],
    "created_at": "2025-04-10 13:00:00",
    "updated_at": "2025-04-10 15:00:00",
    "place_name": "Grand Palace",
    "latitude": 13.7500,
    "longitude": 100.4900,
    "address": "Na Phra Lan Rd, Bangkok"
  }
}
```

#### Delete Activity

```
DELETE /activities/:id
```

Deletes an activity.

**Response:**
```json
{
  "success": true,
  "message": "Activity deleted successfully"
}
```

## Error Handling

All API endpoints will respond with appropriate HTTP status codes:

- `200 OK`: Request succeeded
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Missing or invalid API key
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server-side error

Error responses will be in the following format:

```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

## API Key Management

API keys can be managed through the Skydea web interface at `/api-keys`. Each user can create multiple API keys with different descriptions to track usage.

## Example API Usage (cURL)

### Get all trips

```bash
curl -X GET "https://yourdomain.com/api/external/trips" \
  -H "X-API-Key: your_api_key_here"
```

### Create a new trip

```bash
curl -X POST "https://yourdomain.com/api/external/trips" \
  -H "X-API-Key: your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Trip to Bangkok",
    "description": "Annual vacation",
    "start_date": "2025-05-01",
    "end_date": "2025-05-07",
    "is_public": false
  }'
```

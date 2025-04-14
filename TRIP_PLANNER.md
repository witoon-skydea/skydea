# Skydea Trip Planner Feature Guide

This document provides in-depth information about the Skydea Trip Planner feature, including setup instructions, usage guidelines, and technical details.

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Setup](#setup)
4. [Usage Guide](#usage-guide)
5. [Technical Implementation](#technical-implementation)
6. [API Reference](#api-reference)
7. [Troubleshooting](#troubleshooting)

## Overview

The Trip Planner is a comprehensive feature in Skydea that allows users to create and manage detailed travel itineraries. Users can plan multi-day trips, add places of interest either manually or via Google Maps integration, organize daily activities, and visualize their journey on an interactive map.

## Features

### Trip Management
- Create trips with titles, descriptions, and date ranges
- View all trips on the user dashboard
- Edit trip details
- Delete trips and associated data

### Place Management
- Add places manually with names, descriptions, addresses, and coordinates
- Search for places using Google Maps Places API
- View place details including address, coordinates, and descriptions
- Edit and delete places

### Itinerary Planning
- Create daily activities with start and end times
- Associate activities with saved places
- View a daily timeline of activities
- Rearrange activities using drag-and-drop
- Move activities between days

### Map Visualization
- Interactive map showing all trip locations
- Filter map to show places by day
- Display routes between places on the same day
- Click markers to view place details

## Setup

### Requirements

- Node.js 14+ and npm
- Google Maps API key with Maps JavaScript API and Places API enabled

### Google Maps API Setup

1. Visit the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Navigate to "APIs & Services" > "Library"
4. Enable the following APIs:
   - Maps JavaScript API
   - Places API
5. Create an API key under "APIs & Services" > "Credentials"
6. Restrict the API key to HTTP referrers of your application domains for security

### Configuration

1. Copy `.env.example` to `.env`
2. Add your Google Maps API key to the `GOOGLE_MAPS_API_KEY` variable
3. Adjust other environment variables as needed

## Usage Guide

### Creating a Trip

1. Navigate to the Dashboard
2. Click "Create New Trip"
3. Enter the trip details:
   - Title (required)
   - Description (optional)
   - Start date (required)
   - End date (required)
4. Click "Create Trip"

### Adding Places

1. Open a trip from the Dashboard
2. Navigate to the "Places" tab
3. Click "Add Place"
4. Choose either:
   - **Manual Entry**: Enter place details directly
   - **Google Places Search**: Search for places using Google Maps
5. Fill in the required information
6. Click "Add Place"

### Planning the Itinerary

1. Navigate to the "Itinerary" tab
2. Select a day from the tabs
3. Click "Add Activity"
4. Enter activity details:
   - Title (required)
   - Description (optional)
   - Associated place (optional)
   - Start time (required)
   - End time (required)
5. Click "Add Activity"
6. Rearrange activities by dragging them to a new position
7. Move activities between days using the day selector

### Using the Map

1. Navigate to the "Map View" tab
2. Map markers show all places with coordinates
3. Click "By Day" to filter places by day and show routes
4. Click markers to view place details
5. Use the map controls to zoom, pan, and change map type

## Technical Implementation

### Database Schema

The Trip Planner uses three main tables:

1. **trips**
   - id (primary key)
   - user_id (foreign key to users)
   - title
   - description
   - start_date
   - end_date
   - created_at
   - updated_at

2. **places**
   - id (primary key)
   - trip_id (foreign key to trips)
   - name
   - description
   - latitude
   - longitude
   - address
   - place_id (Google Places ID)
   - image_url
   - created_at
   - updated_at

3. **itinerary_items**
   - id (primary key)
   - trip_id (foreign key to trips)
   - place_id (foreign key to places, nullable)
   - title
   - description
   - start_time
   - end_time
   - day_number
   - order_index
   - created_at
   - updated_at

### Key Files

- **Models**
  - `Trip.js`: Trip data management
  - `Place.js`: Place data management
  - `ItineraryItem.js`: Itinerary data management

- **Routes**
  - `trips.js`: Trip-related endpoints
  - `places.js`: Place-related endpoints, including Google Places search
  - `itinerary.js`: Itinerary-related endpoints

- **Client-side**
  - `trip-planner.js`: Main client-side functionality
  - `trip-planner.css`: Custom styling

- **Views**
  - `planner.ejs`: Main Trip Planner page template

### Technologies Used

- **Frontend**: HTML, CSS, JavaScript, Bootstrap 5
- **Backend**: Node.js, Express.js
- **Database**: SQLite
- **APIs**: Google Maps JavaScript API, Google Places API
- **Templating**: EJS

## API Reference

### Trip Endpoints

- `GET /api/trips`: Get all trips for the logged-in user
- `POST /api/trips`: Create a new trip
- `GET /api/trips/:id`: Get a specific trip with its places and itinerary
- `PUT /api/trips/:id`: Update a trip
- `DELETE /api/trips/:id`: Delete a trip

### Place Endpoints

- `GET /api/places/trip/:tripId`: Get all places for a trip
- `POST /api/places`: Create a new place
- `GET /api/places/:id`: Get a specific place
- `PUT /api/places/:id`: Update a place
- `DELETE /api/places/:id`: Delete a place
- `GET /api/places/search`: Search Google Places API (proxy)
- `GET /api/places/details`: Get place details from Google Places API (proxy)

### Itinerary Endpoints

- `GET /api/itinerary/trip/:tripId`: Get all itinerary items for a trip
- `GET /api/itinerary/trip/:tripId/day/:dayNumber`: Get itinerary items for a specific day
- `POST /api/itinerary`: Create a new itinerary item
- `GET /api/itinerary/:id`: Get a specific itinerary item
- `PUT /api/itinerary/:id`: Update an itinerary item
- `DELETE /api/itinerary/:id`: Delete an itinerary item
- `PUT /api/itinerary/reorder/batch`: Update the order of multiple itinerary items
- `PUT /api/itinerary/:id/move-day`: Move an itinerary item to a different day

## Troubleshooting

### Google Maps Issues

- **Map Not Loading**: Verify your API key is correct and that the Maps JavaScript API is enabled
- **Places Search Not Working**: Ensure the Places API is enabled in your Google Cloud Console
- **API Key Restrictions**: If using API key restrictions, ensure your domain is allowed

### Drag-and-Drop Issues

- **Items Not Draggable**: Make sure JavaScript is enabled and no browser extensions are interfering
- **Order Not Saving**: Check browser console for errors; the API might be failing to update the order

### Other Common Issues

- **Activities Not Showing on Map**: Verify that the places associated with activities have valid coordinates
- **Date Range Problems**: Ensure the trip's start date is before or equal to the end date
- **Performance Issues**: Large trips with many places might cause performance slowdowns; consider optimizing database queries

---

For further assistance or to report bugs, please contact the development team.

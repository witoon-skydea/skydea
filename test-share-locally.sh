#!/bin/bash

# Test script for shared trip view in local environment
echo "Starting local test for shared trip view fix..."

# Stop any existing Node.js processes
echo "Stopping existing Node.js processes..."
pkill -f "node src/server.js" || true

# Start the application in background
echo "Starting application in dev mode..."
NODE_ENV=development node src/server.js &
APP_PID=$!

echo "Application started with PID: $APP_PID"
echo "Wait 3 seconds for application to initialize..."
sleep 3

# Open the browser to test the shared trip view
echo "Opening browser to test shared view..."
# Using the correct share code for trip 1 from the local database
open "http://localhost:3000/trips/1/planner?share=oiHN1NblqQ"

echo "Press Enter to stop the application when done testing"
read -p ""

# Stop the application
echo "Stopping application..."
kill $APP_PID

echo "Test completed!"

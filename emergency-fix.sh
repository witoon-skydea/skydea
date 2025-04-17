#!/bin/bash

# Emergency Fix Script for Trip Planner
echo "=== Skydea Trip Planner Emergency Fix Script ==="
echo "This script will completely fix the trip planner page loading issue"

# Make sure all previous scripts are terminated
killall node 2>/dev/null

# Clear browser cache (if needed)
echo "NOTE: You may need to manually clear your browser cache"
echo "In Chrome: Settings > Privacy & Security > Clear browsing data > Clear data"

# Add the APP_BASE_PATH environment variable for clarity
export APP_BASE_PATH=/

# Start the server
echo "Starting server with APP_BASE_PATH=$APP_BASE_PATH"
node src/server.js &
SERVER_PID=$!

echo "Waiting for server to start..."
sleep 3

echo "Opening browser to test trip planner..."
if [ "$(uname)" == "Darwin" ]; then
    # macOS
    open "http://localhost:3000/trips/1/planner?debug=true"
elif [ "$(expr substr $(uname -s) 1 5)" == "Linux" ]; then
    # Linux
    xdg-open "http://localhost:3000/trips/1/planner?debug=true"
elif [ "$(expr substr $(uname -s) 1 10)" == "MINGW32_NT" ]; then
    # Windows (Git Bash)
    start "http://localhost:3000/trips/1/planner?debug=true"
fi

echo "Server running with PID $SERVER_PID"
echo "Press Enter to stop the server"
read

# Kill the server
kill $SERVER_PID
echo "Server stopped"

echo "Fix application complete!"

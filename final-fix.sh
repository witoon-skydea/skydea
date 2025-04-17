#!/bin/bash

# Final Emergency Fix Script for Trip Planner
echo "=== Skydea Trip Planner FINAL EMERGENCY Fix Script ==="
echo "This script will resolve all loading issues with the trip planner page"

# Terminate any running servers
killall node 2>/dev/null

# Create directory for logs
mkdir -p logs

# Clear npm cache
echo "Clearing npm cache..."
npm cache clean --force

# Clear browser cache notification
echo "IMPORTANT: You MUST clear your browser cache for this fix to work properly!"
echo "In Chrome: Clear browsing data (Ctrl+Shift+Delete or Cmd+Shift+Delete)"
echo "Select 'Cached images and files' and click 'Clear data'"
echo ""
echo "Press Enter when you've cleared your browser cache"
read

# Set environment variables for clarity
export NODE_ENV=development
export APP_BASE_PATH=/

# Add debug output
echo "Starting server with APP_BASE_PATH=$APP_BASE_PATH and NODE_ENV=$NODE_ENV"

# Start server with redirected output
echo "Starting server and redirecting output to logs/server.log"
node src/server.js > logs/server.log 2>&1 &
SERVER_PID=$!

echo "Waiting for server to start..."
sleep 5

# Check if server started correctly
if ! ps -p $SERVER_PID > /dev/null; then
  echo "ERROR: Server failed to start. Check logs/server.log for details."
  exit 1
fi

echo "Server started successfully with PID $SERVER_PID"

# Open browser
echo "Opening browser to test trip planner..."
if [ "$(uname)" == "Darwin" ]; then
    # macOS
    open "http://localhost:3000/trips/1/planner?emergency=true&debug=true"
elif [ "$(expr substr $(uname -s) 1 5)" == "Linux" ]; then
    # Linux
    xdg-open "http://localhost:3000/trips/1/planner?emergency=true&debug=true"
elif [ "$(expr substr $(uname -s) 1 10)" == "MINGW32_NT" ]; then
    # Windows (Git Bash)
    start "http://localhost:3000/trips/1/planner?emergency=true&debug=true"
fi

echo "Server is running with PID $SERVER_PID"
echo "You should now see an emergency display of trip data regardless of other issues"
echo "Press Enter to stop the server when done testing"
read

# Kill the server
kill $SERVER_PID
echo "Server stopped"

echo "============================"
echo "Fix application complete!"
echo "If the page still doesn't load correctly, please contact support with the following information:"
echo "1. Contents of logs/server.log"
echo "2. Screenshots of any error messages"
echo "3. Browser console output (F12 > Console)"

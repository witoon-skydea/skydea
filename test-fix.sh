#!/bin/bash

echo "Testing the trip planner loading issue fix..."

# Check if the server is running
if pgrep -f "node src/server.js" > /dev/null; then
  echo "Server is already running"
else
  echo "Starting the server..."
  NODE_ENV=development PORT=3000 node src/server.js &
  SERVER_PID=$!
  echo "Server started with PID $SERVER_PID"
  
  # Give the server time to start
  sleep 2
fi

# Open the browser to test the fix
echo "Opening browser to test the fix..."
open http://localhost:3000/trips/1/planner

echo "Test completed. Check your browser to verify the fix."
echo "If loading indicators disappear correctly, the fix is successful."

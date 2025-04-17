#!/bin/bash

# Trip Planner Bug Fix Test Script
echo "=== Skydea Trip Planner Fix Test Script ==="
echo "Testing trip planner with bug fixes applied"

# Navigate to project directory
cd "$(dirname "$0")"

# Make sure script is executable
chmod +x ./test-subpath.sh

# Test in normal mode (root path)
echo -e "\n>>> Testing in normal mode (root path) <<<"
export APP_BASE_PATH=/
echo "Starting server with APP_BASE_PATH=$APP_BASE_PATH"
node src/server.js &
SERVER_PID=$!

echo "Waiting for server to start..."
sleep 3

echo "Opening browser to test trip planner..."
if [ "$(uname)" == "Darwin" ]; then
    # macOS
    open "http://localhost:3000/trips/1/planner"
elif [ "$(expr substr $(uname -s) 1 5)" == "Linux" ]; then
    # Linux
    xdg-open "http://localhost:3000/trips/1/planner"
elif [ "$(expr substr $(uname -s) 1 10)" == "MINGW32_NT" ]; then
    # Windows (Git Bash)
    start "http://localhost:3000/trips/1/planner"
fi

echo "Server running with PID $SERVER_PID"
echo "Press Enter to kill server and test with subpath"
read

# Kill the server
kill $SERVER_PID
echo "Server stopped"

# Test in subpath mode
echo -e "\n>>> Testing in subpath mode <<<"
./test-subpath.sh

echo -e "\n=== Testing complete ==="
echo "Please refer to the browser windows to verify that both test scenarios work correctly."
echo "The trip planner should load without getting stuck in both cases."

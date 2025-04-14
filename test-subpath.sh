#!/bin/bash

# Set environment variables
export PORT=3000
export APP_BASE_PATH="/skydea"
export NODE_ENV="development"

# Start the application
echo "Starting Skydea application with sub-path /skydea..."
npm run dev
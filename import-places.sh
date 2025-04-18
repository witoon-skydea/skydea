#!/bin/bash

TRIP_ID=7
USERNAME="witoonp"
API_URL="http://localhost:3000/api/places"

# Extract and process each place from places-json.json
cat /Users/witoonpongsilathong/Downloads/places-json.json | jq -c '.places[]' | while read -r place; do
    # Update trip_id to match our created trip
    place=$(echo $place | jq ". + {trip_id: $TRIP_ID}")
    
    # Send to API
    echo "Importing place: $(echo $place | jq -r '.name')"
    response=$(curl -s -X POST "$API_URL" \
        -H "Content-Type: application/json" \
        -H "x-username: $USERNAME" \
        -d "$place")
    
    echo "Response: $response"
    echo "-------------------------------------"
    
    # Small delay to avoid overwhelming the API
    sleep 0.5
done

echo "Places import completed!"

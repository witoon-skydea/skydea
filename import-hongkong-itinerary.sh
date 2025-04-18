#!/bin/bash

USERNAME="witoonp"
API_URL="http://localhost:3000/api/itinerary"

# Extract and process each itinerary item from hongkong-itinerary.json
cat /Users/witoonpongsilathong/MCP_folder/mm_dev_mode/skydea_fork/skydea/hongkong-itinerary.json | jq -c '.itinerary_items[]' | while read -r item; do
    # Send to API
    title=$(echo $item | jq -r '.title')
    echo "Importing itinerary item: $title"
    response=$(curl -s -X POST "$API_URL" \
        -H "Content-Type: application/json" \
        -H "x-username: $USERNAME" \
        -d "$item")
    
    echo "Response: $response"
    echo "-------------------------------------"
    
    # Small delay to avoid overwhelming the API
    sleep 0.5
done

echo "Itinerary import completed!"
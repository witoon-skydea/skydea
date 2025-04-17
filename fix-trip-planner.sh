#!/bin/bash

# Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting Trip Planner Issue Diagnosis and Fix...${NC}"

# 1. Check if the database exists and has data
SQLITE_DB="./database.sqlite"

if [ ! -f "$SQLITE_DB" ]; then
    echo -e "${RED}Error: Database file not found at $SQLITE_DB${NC}"
    echo -e "${YELLOW}Creating initial database with test data...${NC}"
    
    # Create the database file
    touch "$SQLITE_DB"
    
    # Create tables and add test data
    sqlite3 "$SQLITE_DB" << EOF
-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    google_maps_api_key TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create trips table
CREATE TABLE IF NOT EXISTS trips (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_public INTEGER DEFAULT 0,
    share_code TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
);

-- Create places table
CREATE TABLE IF NOT EXISTS places (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trip_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    latitude REAL,
    longitude REAL,
    address TEXT,
    image_url TEXT,
    category TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (trip_id) REFERENCES trips (id)
);

-- Create itinerary_items table
CREATE TABLE IF NOT EXISTS itinerary_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trip_id INTEGER NOT NULL,
    day_number INTEGER NOT NULL,
    order_index INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    start_time TEXT,
    end_time TEXT,
    place_id INTEGER,
    tags TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (trip_id) REFERENCES trips (id),
    FOREIGN KEY (place_id) REFERENCES places (id)
);

-- Insert test user
INSERT INTO users (username, email, password)
VALUES ('testuser', 'test@example.com', '\$2b\$10\$LPSW5QJdnd0QMUeVz5r.QuW4kPo5VY00ZhyukvgO/0LVrdrCXz9Ty');

-- Insert test trip
INSERT INTO trips (user_id, title, description, start_date, end_date, is_public, share_code)
VALUES (
    1, 
    'Bangkok Adventure', 
    'Exploring the vibrant city of Bangkok', 
    '2025-04-20', 
    '2025-04-25', 
    1, 
    'test-share-code-123'
);

-- Insert test places
INSERT INTO places (trip_id, name, description, latitude, longitude, address, category)
VALUES 
(1, 'Grand Palace', 'Historic palace complex in Bangkok', 13.7500, 100.4914, 'Na Phra Lan Rd, Phra Borom Maha Ratchawang, Phra Nakhon, Bangkok 10200', 'sight seeing'),
(1, 'Chatuchak Weekend Market', 'Large market with over 8,000 stalls', 13.7999, 100.5498, '587/10 Kamphaeng Phet 2 Rd, Chatuchak, Bangkok 10900', 'shopping'),
(1, 'Wat Arun', 'Temple of Dawn on the Chao Phraya River', 13.7437, 100.4888, '158 Thanon Wang Doem, Wat Arun, Bangkok Yai, Bangkok 10600', 'sight seeing');

-- Insert test itinerary items
INSERT INTO itinerary_items (trip_id, day_number, order_index, title, description, start_time, end_time, place_id)
VALUES
(1, 1, 1, 'Grand Palace Visit', 'Explore the Grand Palace and Emerald Buddha', '09:00', '12:00', 1),
(1, 2, 1, 'Shopping at Chatuchak', 'Shop for souvenirs and local goods', '10:00', '14:00', 2),
(1, 3, 1, 'Visit Wat Arun', 'See the Temple of Dawn', '08:00', '11:00', 3);
EOF
    
    echo -e "${GREEN}Test database created successfully with sample data!${NC}"
else
    echo -e "${GREEN}Database file found. Checking trip data...${NC}"
    
    # Check if there are trips in the database
    TRIP_COUNT=$(sqlite3 "$SQLITE_DB" "SELECT COUNT(*) FROM trips;")
    
    if [ "$TRIP_COUNT" -eq 0 ]; then
        echo -e "${YELLOW}No trips found in database. Adding a sample trip...${NC}"
        
        # Check if we have a user
        USER_COUNT=$(sqlite3 "$SQLITE_DB" "SELECT COUNT(*) FROM users;")
        
        if [ "$USER_COUNT" -eq 0 ]; then
            echo -e "${YELLOW}No users found. Adding a test user...${NC}"
            sqlite3 "$SQLITE_DB" "INSERT INTO users (username, email, password) VALUES ('testuser', 'test@example.com', '\$2b\$10\$LPSW5QJdnd0QMUeVz5r.QuW4kPo5VY00ZhyukvgO/0LVrdrCXz9Ty');"
        fi
        
        # Add a test trip with the first user's ID
        USER_ID=$(sqlite3 "$SQLITE_DB" "SELECT id FROM users LIMIT 1;")
        
        sqlite3 "$SQLITE_DB" << EOF
-- Insert test trip
INSERT INTO trips (user_id, title, description, start_date, end_date, is_public, share_code)
VALUES (
    $USER_ID, 
    'Bangkok Adventure', 
    'Exploring the vibrant city of Bangkok', 
    '2025-04-20', 
    '2025-04-25', 
    1, 
    'test-share-code-123'
);

-- Get the inserted trip ID
EOF
        
        TRIP_ID=$(sqlite3 "$SQLITE_DB" "SELECT id FROM trips ORDER BY id DESC LIMIT 1;")
        
        echo -e "${YELLOW}Adding sample places and itinerary items to trip ID $TRIP_ID...${NC}"
        
        sqlite3 "$SQLITE_DB" << EOF
-- Insert test places
INSERT INTO places (trip_id, name, description, latitude, longitude, address, category)
VALUES 
($TRIP_ID, 'Grand Palace', 'Historic palace complex in Bangkok', 13.7500, 100.4914, 'Na Phra Lan Rd, Phra Borom Maha Ratchawang, Phra Nakhon, Bangkok 10200', 'sight seeing'),
($TRIP_ID, 'Chatuchak Weekend Market', 'Large market with over 8,000 stalls', 13.7999, 100.5498, '587/10 Kamphaeng Phet 2 Rd, Chatuchak, Bangkok 10900', 'shopping'),
($TRIP_ID, 'Wat Arun', 'Temple of Dawn on the Chao Phraya River', 13.7437, 100.4888, '158 Thanon Wang Doem, Wat Arun, Bangkok Yai, Bangkok 10600', 'sight seeing');

-- Get place IDs
EOF
        
        PLACE_IDS=$(sqlite3 "$SQLITE_DB" "SELECT id FROM places WHERE trip_id = $TRIP_ID ORDER BY id;")
        PLACE_ID_ARR=($PLACE_IDS)
        
        sqlite3 "$SQLITE_DB" << EOF
-- Insert test itinerary items
INSERT INTO itinerary_items (trip_id, day_number, order_index, title, description, start_time, end_time, place_id)
VALUES
($TRIP_ID, 1, 1, 'Grand Palace Visit', 'Explore the Grand Palace and Emerald Buddha', '09:00', '12:00', ${PLACE_ID_ARR[0]}),
($TRIP_ID, 2, 1, 'Shopping at Chatuchak', 'Shop for souvenirs and local goods', '10:00', '14:00', ${PLACE_ID_ARR[1]}),
($TRIP_ID, 3, 1, 'Visit Wat Arun', 'See the Temple of Dawn', '08:00', '11:00', ${PLACE_ID_ARR[2]});
EOF
        
        echo -e "${GREEN}Sample trip data added successfully!${NC}"
    else
        echo -e "${GREEN}Found $TRIP_COUNT trips in the database.${NC}"
    fi
fi

# 2. Force development mode
echo -e "${YELLOW}Setting development mode and ensuring correct base path...${NC}"

# Check if .env file exists
ENV_FILE=".env"
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${YELLOW}Creating .env file...${NC}"
    cat > "$ENV_FILE" << EOF
# Application Settings
PORT=3000
NODE_ENV=development
APP_BASE_PATH=/
SESSION_SECRET=dev_session_secret_for_debugging

# Database Settings
DB_PATH=./database.sqlite

# Default Google Maps API
GOOGLE_MAPS_API_KEY=
EOF
else
    # Update .env file
    sed -i '' 's/NODE_ENV=.*/NODE_ENV=development/' "$ENV_FILE"
    sed -i '' 's/APP_BASE_PATH=.*/APP_BASE_PATH=\//' "$ENV_FILE"
fi

# 3. Create startup script
echo -e "${YELLOW}Creating debug startup script...${NC}"

cat > debug-start.sh << EOF
#!/bin/bash
export NODE_ENV=development
export DEBUG=skydea:*
export APP_BASE_PATH=/

echo "Starting Skydea in debug mode..."
npx nodemon --inspect src/server.js
EOF

chmod +x debug-start.sh

echo -e "${GREEN}Debug startup script created!${NC}"

# 4. Create client test script
echo -e "${YELLOW}Creating client test script...${NC}"

cat > test-client.js << EOF
// Test script to directly access the API
const fetch = require('node-fetch');

async function testTripAPI() {
  const tripId = 1; // Change to your trip ID
  const url = 'http://localhost:3000/api/trips/' + tripId;
  
  console.log('Testing API URL:', url);
  
  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json'
      }
    });
    
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      throw new Error('Failed to fetch trip data: ' + response.status);
    }
    
    const data = await response.json();
    console.log('Trip data fetch successful!');
    console.log('Trip title:', data.trip.title);
    console.log('Number of places:', data.places.length);
    console.log('Number of itinerary items:', data.itineraryItems.length);
  } catch (error) {
    console.error('Error fetching trip data:', error);
  }
}

testTripAPI();
EOF

echo -e "${GREEN}Client test script created!${NC}"

# 5. Provide instructions
echo -e "${GREEN}Fix completed!${NC}"
echo -e "${YELLOW}Follow these steps to test and debug:${NC}"
echo -e "1. Start the server in debug mode: ${GREEN}./debug-start.sh${NC}"
echo -e "2. Open a new terminal and test the API: ${GREEN}node test-client.js${NC}"
echo -e "3. Access the trip planner in your browser: ${GREEN}http://localhost:3000/trips/1/planner${NC}"
echo -e "4. Press ${GREEN}Alt+Shift+D${NC} to open the debug panel in the browser"
echo -e ""
echo -e "If you still have issues, check the server logs for details."

exit 0
#!/bin/bash

TRIP_ID=7
USERNAME="witoonp"
API_URL="http://localhost:3000/api/itinerary"

# ฟังก์ชั่น map_place_id - แปลง place_id ในไฟล์ JSON (1-26) ให้ตรงกับ place_id ในฐานข้อมูล (16-41)
# เนื่องจากสถานที่ในฐานข้อมูลมี id ที่เริ่มจาก 16 ไม่ใช่ 1
map_place_id() {
    local original_id=$1
    if [ "$original_id" == "null" ]; then
        echo "null"
    else
        # original_id คือไฟล์ JSON เริ่มจาก 1, ในฐานข้อมูลเริ่มจาก 16
        echo $((original_id + 15))
    fi
}

# Extract and process each itinerary item from itinerary-json.json
cat /Users/witoonpongsilathong/Downloads/itinerary-json.json | jq -c '.itinerary_items[]' | while read -r item; do
    # ดึง place_id จาก item
    original_place_id=$(echo $item | jq -r '.place_id')
    
    # แปลง place_id ให้ตรงกับฐานข้อมูล
    new_place_id=$(map_place_id "$original_place_id")
    
    # แก้ไข place_id ใน JSON
    if [ "$new_place_id" == "null" ]; then
        item=$(echo $item | jq "del(.place_id)")
    else
        item=$(echo $item | jq ".place_id = $new_place_id")
    fi
    
    # แก้ไข trip_id ให้ตรงกับ trip ที่เราสร้าง
    item=$(echo $item | jq ".trip_id = $TRIP_ID")
    
    # ส่งข้อมูลไปยัง API
    echo "Importing itinerary item: $(echo $item | jq -r '.title')"
    response=$(curl -s -X POST "$API_URL" \
        -H "Content-Type: application/json" \
        -H "x-username: $USERNAME" \
        -d "$item")
    
    echo "Response: $response"
    echo "-------------------------------------"
    
    # หน่วงเวลาเล็กน้อยเพื่อไม่ให้ส่ง request มากเกินไป
    sleep 0.5
done

echo "Itinerary import completed!"

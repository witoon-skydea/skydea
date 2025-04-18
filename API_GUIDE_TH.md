# คู่มือการใช้งาน Skydea API

## สารบัญ
1. [ข้อมูลทั่วไป](#ข้อมูลทั่วไป)
2. [การรับรองตัวตน](#การรับรองตัวตน)
3. [API Endpoints](#api-endpoints)
4. [ตัวอย่างการใช้งาน](#ตัวอย่างการใช้งาน)
5. [ข้อควรระวังและแนวทางปฏิบัติที่ดี](#ข้อควรระวังและแนวทางปฏิบัติที่ดี)

## ข้อมูลทั่วไป

Skydea API เป็นส่วนติดต่อโปรแกรมประยุกต์ที่ช่วยให้นักพัฒนาสามารถเข้าถึงและจัดการข้อมูลในฐานข้อมูล SQLite ของโปรเจค Skydea ได้ API นี้ใช้สถาปัตยกรรมแบบ RESTful และส่งข้อมูลในรูปแบบ JSON

### Base URL

URL พื้นฐานของ API ขึ้นอยู่กับการตั้งค่าของคุณ:

- ถ้า `APP_BASE_PATH=/`: `http://yourdomain.com/api`
- ถ้า `APP_BASE_PATH=/skydea`: `http://yourdomain.com/skydea/api`

### รูปแบบการตอบกลับ

การตอบกลับทั้งหมดจะอยู่ในรูปแบบ JSON ดังนี้:

```json
{
  "success": true|false,
  "message": "ข้อความอธิบาย (ไม่จำเป็นต้องมี)",
  "data": { /* ข้อมูลที่ตอบกลับ (อาจเป็น object หรือ array) */ },
  "count": 123, // จำนวนรายการ (มีเฉพาะในการแสดงรายการ)
  "error": "ข้อความแสดงข้อผิดพลาด (มีเฉพาะเมื่อเกิดข้อผิดพลาด)"
}
```

## การรับรองตัวตน

API นี้ใช้วิธีการรับรองตัวตนแบบง่ายโดยใช้ชื่อผู้ใช้ (username) แทนการใช้ API keys คุณสามารถระบุชื่อผู้ใช้ด้วยวิธีใดวิธีหนึ่งต่อไปนี้:

1. ในตัวแปร body ของคำขอ: `{ "username": "yourUsername", ... }`
2. ในพารามิเตอร์ query: `?username=yourUsername`
3. ในส่วนหัวของคำขอ: `x-username: yourUsername`

ทุก endpoint ของ API (ยกเว้นที่ระบุว่าเป็น public) ต้องการการรับรองตัวตน

## API Endpoints

### 1. API ผู้ใช้ (User API)

#### 1.1 ดูข้อมูลโปรไฟล์ผู้ใช้
```
GET /api/users/profile
```
ดึงข้อมูลโปรไฟล์ของผู้ใช้ที่ได้รับการรับรองตัวตน

#### 1.2 อัปเดตข้อมูลโปรไฟล์ผู้ใช้
```
PUT /api/users/profile
```
อัปเดตข้อมูลโปรไฟล์ของผู้ใช้ที่ได้รับการรับรองตัวตน

**ตัวอย่างข้อมูลคำขอ:**
```json
{
  "username": "yourUsername",
  "email": "newemail@example.com",
  "google_maps_api_key": "your-api-key"
}
```

#### 1.3 ลงทะเบียนผู้ใช้ใหม่
```
POST /api/users/register
```
ลงทะเบียนบัญชีผู้ใช้ใหม่

**ตัวอย่างข้อมูลคำขอ:**
```json
{
  "username": "newuser",
  "email": "newuser@example.com",
  "password": "securepassword",
  "google_maps_api_key": "your-api-key"
}
```

### 2. API ทริป (Trip API)

#### 2.1 ดูทริปทั้งหมด
```
GET /api/trips
```
ดึงรายการทริปทั้งหมดของผู้ใช้ที่ได้รับการรับรองตัวตน

#### 2.2 ดูทริปตาม ID
```
GET /api/trips/:id
```
ดึงข้อมูลทริปตาม ID ที่ระบุ

#### 2.3 สร้างทริปใหม่
```
POST /api/trips
```
สร้างทริปใหม่

**ตัวอย่างข้อมูลคำขอ:**
```json
{
  "username": "yourUsername",
  "title": "ทริปไปญี่ปุ่น",
  "description": "สองสัปดาห์ในญี่ปุ่น เที่ยวโตเกียวและเกียวโต",
  "start_date": "2025-05-01",
  "end_date": "2025-05-15",
  "is_public": true
}
```

#### 2.4 อัปเดตทริป
```
PUT /api/trips/:id
```
อัปเดตทริปที่มีอยู่

**ตัวอย่างข้อมูลคำขอ:**
```json
{
  "username": "yourUsername",
  "title": "ทริปไปญี่ปุ่น (อัปเดต)",
  "description": "คำอธิบายที่อัปเดต",
  "start_date": "2025-05-02",
  "end_date": "2025-05-16",
  "is_public": false
}
```

#### 2.5 ลบทริป
```
DELETE /api/trips/:id
```
ลบทริปและสถานที่และรายการกำหนดการที่เกี่ยวข้องทั้งหมด

#### 2.6 ดูทริปที่แชร์
```
GET /api/trips/share/:shareCode
```
ดึงทริปตามรหัสแชร์ นี่เป็น endpoint สาธารณะและไม่ต้องการการรับรองตัวตนหากทริปถูกตั้งค่าเป็นสาธารณะ

### 3. API สถานที่ (Place API)

#### 3.1 ดูสถานที่ทั้งหมดสำหรับทริป
```
GET /api/places/trip/:tripId
```
ดึงสถานที่ทั้งหมดที่เกี่ยวข้องกับทริป

#### 3.2 ดูสถานที่ตาม ID
```
GET /api/places/:id
```
ดึงสถานที่ตาม ID ที่ระบุ

#### 3.3 สร้างสถานที่ใหม่
```
POST /api/places
```
สร้างสถานที่ใหม่

**ตัวอย่างข้อมูลคำขอ:**
```json
{
  "username": "yourUsername",
  "trip_id": 123,
  "name": "โตเกียวทาวเวอร์",
  "description": "หอคอยที่มีชื่อเสียงในโตเกียว",
  "latitude": 35.6586,
  "longitude": 139.7454,
  "address": "4 Chome-2-8 Shibakoen, Minato City, Tokyo",
  "place_id": "ChIJCewJkL2LGGAR0wK0xcha9FY",
  "image_url": "https://example.com/image.jpg",
  "category": "attraction"
}
```

#### 3.4 อัปเดตสถานที่
```
PUT /api/places/:id
```
อัปเดตสถานที่ที่มีอยู่

**ตัวอย่างข้อมูลคำขอ:**
```json
{
  "username": "yourUsername",
  "name": "โตเกียวทาวเวอร์ (อัปเดต)",
  "description": "คำอธิบายที่อัปเดต",
  "latitude": 35.6586,
  "longitude": 139.7454,
  "address": "ที่อยู่ที่อัปเดต",
  "place_id": "ChIJCewJkL2LGGAR0wK0xcha9FY",
  "image_url": "https://example.com/new-image.jpg",
  "category": "landmark"
}
```

#### 3.5 ลบสถานที่
```
DELETE /api/places/:id
```
ลบสถานที่

### 4. API กำหนดการ (Itinerary API)

#### 4.1 ดูรายการกำหนดการทั้งหมดสำหรับทริป
```
GET /api/itinerary/trip/:tripId
```
ดึงรายการกำหนดการทั้งหมดสำหรับทริป

#### 4.2 ดูรายการกำหนดการสำหรับวันใดวันหนึ่ง
```
GET /api/itinerary/trip/:tripId/day/:dayNumber
```
ดึงรายการกำหนดการทั้งหมดสำหรับวันเฉพาะของทริป

#### 4.3 ดูรายการกำหนดการตาม ID
```
GET /api/itinerary/:id
```
ดึงรายการกำหนดการตาม ID ที่ระบุ

#### 4.4 สร้างรายการกำหนดการใหม่
```
POST /api/itinerary
```
สร้างรายการกำหนดการใหม่

**ตัวอย่างข้อมูลคำขอ:**
```json
{
  "username": "yourUsername",
  "trip_id": 123,
  "place_id": 456,
  "title": "เยี่ยมชมโตเกียวทาวเวอร์",
  "description": "เพลิดเพลินกับวิวจากดาดฟ้าชมวิว",
  "start_time": "2025-05-02T10:00:00",
  "end_time": "2025-05-02T12:00:00",
  "day_number": 2,
  "order_index": 1,
  "tags": ["sightseeing", "photography"]
}
```

#### 4.5 อัปเดตรายการกำหนดการ
```
PUT /api/itinerary/:id
```
อัปเดตรายการกำหนดการที่มีอยู่

**ตัวอย่างข้อมูลคำขอ:**
```json
{
  "username": "yourUsername",
  "place_id": 456,
  "title": "เยี่ยมชมโตเกียวทาวเวอร์ (อัปเดต)",
  "description": "คำอธิบายที่อัปเดต",
  "start_time": "2025-05-02T11:00:00",
  "end_time": "2025-05-02T13:00:00",
  "day_number": 2,
  "order_index": 2,
  "tags": ["updated", "sightseeing"]
}
```

#### 4.6 อัปเดตลำดับของรายการกำหนดการหลายรายการ
```
PUT /api/itinerary/order
```
อัปเดตลำดับของรายการกำหนดการหลายรายการ (สำหรับการลากและวางเพื่อเรียงลำดับใหม่)

**ตัวอย่างข้อมูลคำขอ:**
```json
{
  "username": "yourUsername",
  "items": [
    { "id": 1, "order_index": 0 },
    { "id": 2, "order_index": 1 },
    { "id": 3, "order_index": 2 }
  ]
}
```

#### 4.7 ย้ายรายการกำหนดการไปยังวันอื่น
```
PUT /api/itinerary/:id/move/:dayNumber
```
ย้ายรายการกำหนดการไปยังวันอื่น

**ตัวอย่างข้อมูลคำขอ:**
```json
{
  "username": "yourUsername",
  "order_index": 0
}
```

#### 4.8 ลบรายการกำหนดการ
```
DELETE /api/itinerary/:id
```
ลบรายการกำหนดการ

## ตัวอย่างการใช้งาน

### ตัวอย่างการใช้ JavaScript และ Fetch API

```javascript
// ตัวอย่างการสร้างทริปใหม่
async function createTrip() {
  const response = await fetch('http://yourdomain.com/api/trips', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-username': 'yourUsername'
    },
    body: JSON.stringify({
      title: 'ทริปไปญี่ปุ่น',
      description: 'สองสัปดาห์ในญี่ปุ่น เที่ยวโตเกียวและเกียวโต',
      start_date: '2025-05-01',
      end_date: '2025-05-15',
      is_public: true
    })
  });
  
  const data = await response.json();
  console.log(data);
}

// ตัวอย่างการดึงรายการทริปทั้งหมด
async function getAllTrips() {
  const response = await fetch('http://yourdomain.com/api/trips?username=yourUsername');
  const data = await response.json();
  console.log(data);
}
```

### ตัวอย่างการใช้ PHP และ cURL

```php
<?php
// ตัวอย่างการสร้างทริปใหม่
$url = 'http://yourdomain.com/api/trips';
$data = array(
  'username' => 'yourUsername',
  'title' => 'ทริปไปญี่ปุ่น',
  'description' => 'สองสัปดาห์ในญี่ปุ่น เที่ยวโตเกียวและเกียวโต',
  'start_date' => '2025-05-01',
  'end_date' => '2025-05-15',
  'is_public' => true
);

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, array(
  'Content-Type: application/json'
));

$response = curl_exec($ch);
curl_close($ch);

echo $response;
?>
```

## ข้อควรระวังและแนวทางปฏิบัติที่ดี

1. **การรับรองตัวตน**
   - ตรวจสอบให้แน่ใจว่าคุณส่งชื่อผู้ใช้ในทุกคำขอที่ต้องการการรับรองตัวตน
   - พิจารณาใช้ header `x-username` เพื่อความสม่ำเสมอ

2. **การจัดการข้อผิดพลาด**
   - ตรวจสอบสถานะการตอบกลับ (success) เสมอก่อนดำเนินการกับข้อมูล
   - จัดการข้อผิดพลาดอย่างเหมาะสมด้วย try-catch หรือโครงสร้างที่คล้ายกัน

3. **การทำงานกับวันที่**
   - ใช้รูปแบบวันที่ที่ถูกต้อง (YYYY-MM-DD) สำหรับวันที่
   - ใช้รูปแบบ ISO 8601 (YYYY-MM-DDThh:mm:ss) สำหรับเวลา

4. **ประสิทธิภาพ**
   - ดึงเฉพาะข้อมูลที่จำเป็นเพื่อลดปริมาณข้อมูลที่ส่ง
   - พิจารณาใช้การแคชเพื่อลดการเรียก API ที่ไม่จำเป็น

5. **ความปลอดภัย**
   - ตรวจสอบและทำความสะอาดข้อมูลนำเข้าก่อนส่งไปยัง API
   - หลีกเลี่ยงการเก็บข้อมูลที่ละเอียดอ่อนในการจัดเก็บท้องถิ่นหรือคุกกี้

หากมีคำถามเพิ่มเติมหรือต้องการความช่วยเหลือ กรุณาติดต่อทีมพัฒนา Skydea หรือดูเอกสารออนไลน์เพิ่มเติมที่ `/api` endpoint
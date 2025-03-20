วิธีรันฝั่งblackend
1. cd backend
2. poetry shell
3. .\scripts\run-api
http://172.27.128.1:8000/docs (FastAPI)

http://localhost:8000 เป็น URL ของ Backend API
http://localhost:3000 เป็น URL ของ Frontend


วิธีรันฝั่งfrontend
1. cd frontend
2. npm start

superadmin = DBUser(
  username="superadmin",
  first_name="Super",
  last_name="Admin",
  password="superadminpassword",
  roles=["superadmin"],
)

================================================
วิธี clone
1. git clone
ในbackend
1. cd backend
2. pip install poetry
3. poetry install
4. poetry shell
5. docker run -d --name D2-server -e POSTGRES_PASSWORD=123456 -p 5432:5432 postgres:16
6. docker run --name D2-PGadmin -p 5050:80 -e PGADMIN_DEFAULT_EMAIL=6410110238@psu.ac.th -e PGADMIN_DEFAULT_PASSWORD=147896325 -d dpage/pgadmin4
7. .\scripts\run-api  

================================================
สำหรับทดสอบ Docker-compose
D:\University\Y4-2\ArduinoProject\Main\wed\try3arduino\backend>docker-compose up --build -d

D:\University\Y4-2\ArduinoProject\Main\wed\try3arduino\backend>docker-compose down

================================================
#include <WiFi.h>
#include <WebSocketsClient.h>
#include <HTTPClient.h>
#include <Adafruit_Sensor.h>
#include <DHT.h>
#include <DHT_U.h>
#include <WiFiUdp.h>
#include <NTPClient.h>
#include <ArduinoJson.h>
//-------------------------------------
#include <HardwareSerial.h>
#include <Wire.h>
#include "Adafruit_CCS811.h"
#include "Adafruit_HDC1000.h"


// WiFi Credentials
const char* ssid = "MIS-SBL";
const char* password = "A12345678";

// WebSocket
WebSocketsClient webSocket;

// Data Server URL
const char* dataServerUrl = "http://192.168.0.10:8000/detects/create";

// Device ID ที่ได้มาจาก AirCheck
String apiKey = "8e408a6997b7b5ae22ee7975697fe514";

// DHT Sensor Config
#define DHTPIN 4
#define DHTTYPE DHT22
DHT dht(DHTPIN, DHTTYPE);

// NTP Client Config
WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP, "pool.ntp.org", 7 * 3600);

// Status Variables
bool isWiFiConnected = false;
bool isWebSocketConnected = false;
bool DisconnectManually = false;

// Timing Config
unsigned long lastSensorRead = 0;
unsigned long readInterval;
const unsigned long oneMinute = 60000;

// Sensor Retry Config
const int maxRetries = 3;
//-------------------------------------
// กำหนดพอร์ต Serial สำหรับ PMS5003
HardwareSerial pmsSerial(1); // ใช้ Serial1

// กำหนดพิน RX และ TX (ปรับตามการเชื่อมต่อของคุณ)
#define PMS_RX_PIN 16 // Pin ที่รับข้อมูลจาก PMS5003
#define PMS_TX_PIN 17 // Pin ที่ส่งข้อมูลไปยัง PMS5003

// Buffer สำหรับจัดเก็บข้อมูลจาก PMS5003
uint8_t pmsBuffer[32];

// สร้างออบเจกต์สำหรับ CCS811 และ HDC1000
Adafruit_CCS811 ccs;
Adafruit_HDC1000 hdc;


void setup() {
  // เริ่มต้น Serial สำหรับ debug
  Serial.begin(115200);
  
  while (!Serial) {
    // รอให้ Serial พร้อมใช้งาน
  }

  // เริ่มต้น Serial1 สำหรับ PMS5003 ด้วย baud rate 9600 (Serial Monitor ต้องเป็น 115200)
  pmsSerial.begin(9600, SERIAL_8N1, PMS_RX_PIN, PMS_TX_PIN);

  // เริ่มต้น I2C และเซ็นเซอร์ CCS811, HDC1000
  ccs.begin();
  hdc.begin();

  // เริ่มต้นการเชื่อมต่อ WiFi
  checkWiFi();

  // เริ่มต้น WebSocket
  checkWebSocket();

  // เริ่มต้น NTP Client และรอจนกว่าการซิงค์เวลาจะสำเร็จ
  timeClient.begin();
  while (!timeClient.update()) {
    timeClient.forceUpdate();
    Serial.println("Retrying NTP sync...");
    delay(500);  // รอ 500ms ก่อน retry
  }

  Serial.println("Device ID: " + apiKey);
}


void loop() {
  timeClient.update();

  // หยุดการทำงานใน loop
  if (DisconnectManually || !isWiFiConnected || !isWebSocketConnected) {
    return;
  }

  //ตรวจสอบการเชื่อมต่อ
  if (WiFi.status() == WL_CONNECTED) {
    if (webSocket.isConnected()) {
      webSocket.loop();
    } else {
      Serial.println("WebSocket is disconnected. Reconnecting...");
      checkWebSocket();
    }
  } else {
    Serial.println("WiFi is disconnected. Reconnecting...");
    checkWiFi();
    checkWebSocket();
  }


  // Sensor Data Reading and Sending
  unsigned long currentMillis = millis();
  if (currentMillis - lastSensorRead >= readInterval) {
    lastSensorRead = currentMillis;

    float sensorData[6];// ประกาศตัวแปรอาร์เรย์ขนาด 6 ช่อง
    if (readMCU8118(&sensorData[2], &sensorData[5], &sensorData[0], &sensorData[1]) && readPMS5003(&sensorData[3], &sensorData[4])) {
      String timestamp = getTimestamp();
      sendDataToServer(sensorData[0], sensorData[1], sensorData[3], sensorData[4], sensorData[2], sensorData[5], timestamp);
      fetchDeviceSetTime();
    } else {
      Serial.println("Sensor read failed. Skipping data send.");
      DisconnectManually = true;
      WiFi.disconnect();
      Serial.println("Disconnected manually from WiFi!");
      Serial.println("Stopped working due to a problem.");
    }
  }
  delay(10);
}


void checkWiFi() {
  WiFi.begin(ssid, password);
  unsigned long startMillis = millis();
  while (WiFi.status() != WL_CONNECTED) {
    if (millis() - startMillis >= oneMinute) {
      Serial.println("WiFi connection timeout!");
      Serial.println("Stopped working due to a problem.");
      isWiFiConnected = false;
      return;
    }
    delay(500);
  }
  isWiFiConnected = true;
  Serial.println("WiFi Connected!");
}


void checkWebSocket() {
  String apiKeyPath = "/ws/devices/" + apiKey;
  webSocket.begin("192.168.0.10", 8000, apiKeyPath.c_str()); 

  unsigned long startMillis = millis();
  while (!webSocket.isConnected()) {
    if (millis() - startMillis >= oneMinute) {
      Serial.println("WebSocket connection timeout!");
      Serial.println("Stopped working due to a problem.");
      isWebSocketConnected = false;
      return;
    }
    webSocket.loop();
    delay(500);
  }
  isWebSocketConnected = true;
  Serial.println("WebSocket Connected!");
}


// ฟังก์ชันอ่านข้อมูลจาก PMS5003
bool readPMS5003(float* pm25, float* pm10) {
  int retries = 0;

  while (retries < maxRetries) {
    // ล้าง buffer ก่อนเริ่มอ่านใหม่
    while (pmsSerial.available()) {
      pmsSerial.read();
    }

    // รอข้อมูลให้มาครบก่อนอ่าน
    unsigned long startTime = millis();
    while (pmsSerial.available() < 32) {
      if (millis() - startTime > 2000) { // รอไม่เกิน 2 วินาที
        Serial.println("Timeout waiting for PMS5003 data.");
        break;
      }
    }

    // ถ้าข้อมูลพร้อมสำหรับการอ่าน 
    if (pmsSerial.available() >= 32) {
      // อ่านข้อมูลจาก PMS5003
      for (int i = 0; i < 32; i++) {
        pmsBuffer[i] = pmsSerial.read();
      }

      // ตรวจสอบการอ่านข้อมูลสำเร็จหรือไม่ โดยเช็ค header ของ PMS5003
      if (pmsBuffer[0] == 0x42 && pmsBuffer[1] == 0x4D) {
        *pm25 = (pmsBuffer[12] << 8) | pmsBuffer[13];
        *pm10 = (pmsBuffer[14] << 8) | pmsBuffer[15];
        return true;
      } else {
        Serial.println("Invalid PMS5003 data header.");
      }
    }

    retries++;
    delay(500); // รอเล็กน้อยก่อน retry
  }

  Serial.println("Failed to read PMS5003(PM2.5,PM10) data after max retries.");
  return false;
}


bool readMCU8118(float* co2, float* tvoc, float* humidity, float* temperature) {
  int retries = 0;
  
  while (retries < maxRetries) {
    if (hdc.begin()) {  // ตรวจสอบ HDC1000 ก่อน
      *temperature = hdc.readTemperature();
      *humidity = hdc.readHumidity();
      
      if (ccs.available()) {  // ตรวจสอบ CCS811 ถัดไป
        ccs.readData();  
        *co2 = ccs.geteCO2();
        *tvoc = ccs.getTVOC();
        return true;
      } else {
        Serial.println("Failed to read CCS811, retrying...");
      }
    } else {
      Serial.println("Failed to initialize HDC1000, retrying...");
    }
    
    retries++;
    delay(500);
  }
  
  Serial.println("Failed to read sensor data after max retries.");
  return false;
}



// ฟังก์ชันสำหรับการส่งข้อมูลไปยังเซิร์ฟเวอร์
void sendDataToServer(float humidity, float temperature, float pm25, float pm10, float co2, float tvoc, String timestamp) {
  HTTPClient http;
  http.begin(dataServerUrl);
  http.addHeader("Content-Type", "application/json");

  String payload = "{\"api_key\":\"" + apiKey +
                   "\",\"humidity\":" + String(humidity) +
                   ",\"temperature\":" + String(temperature) +
                   ",\"pm2_5\":" + String(pm25) +
                   ",\"pm10\":" + String(pm10) +
                   ",\"co2\":" + String(co2) +
                   ",\"tvoc\":" + String(tvoc) +
                   ",\"timestamp\":\"" + timestamp + "\"}";

  http.POST(payload);
  http.end();
}

// ฟังก์ชันสำหรับดึงค่า device_settime 
void fetchDeviceSetTime() {
    HTTPClient http;
    String url = "http://192.168.0.10:8000/devices/get_time/" + apiKey;
    http.begin(url);

    http.GET(); 
    
    String payload = http.getString();
    DynamicJsonDocument doc(1024);
    deserializeJson(doc, payload);
    
    int newInterval = doc["device_settime"].as<int>() * 60000; 
    readInterval = newInterval;
    Serial.println(readInterval);

    http.end();
}


String getTimestamp() {
  time_t rawtime = timeClient.getEpochTime();
  struct tm* timeinfo = localtime(&rawtime);

  char buffer[30];
  sprintf(buffer, "%04d-%02d-%02d %02d:%02d:%02d",
          timeinfo->tm_year + 1900, timeinfo->tm_mon + 1,
          timeinfo->tm_mday, timeinfo->tm_hour,
          timeinfo->tm_min, timeinfo->tm_sec);

  return String(buffer);
}
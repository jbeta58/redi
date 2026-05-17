/*
 * REDI Firmware
 * Adafruit Matrix Portal M4 + 64x32 RGB LED matrix
 *
 * Libraries required (install via Arduino Library Manager):
 *   - Adafruit Protomatter
 *   - Adafruit SPIFlash
 *   - WiFiNINA
 *   - ArduinoJson (v7)
 *   - Adafruit NeoPixel (dependency)
 *   - Adafruit BusIO (dependency)
 */

#include <WiFiNINA.h>
#include <WiFiSSLClient.h>
#include <ArduinoJson.h>
#include <Adafruit_Protomatter.h>
#include "config.h"

// ── Matrix setup ──────────────────────────────────────────────────────────────

uint8_t rgbPins[]  = { R1_PIN, G1_PIN, B1_PIN, R2_PIN, G2_PIN, B2_PIN };
uint8_t addrPins[] = { A_PIN, B_PIN, C_PIN, D_PIN };

Adafruit_Protomatter matrix(
  MATRIX_WIDTH,   // width
  4,              // bit depth
  1,              // number of matrix chains
  rgbPins,
  4,              // number of address pins
  addrPins,
  LAT_PIN, OE_PIN, CLK_PIN,
  true            // double-buffer
);

// ── State ─────────────────────────────────────────────────────────────────────

// App list from last successful poll
#define MAX_APPS 15
JsonDocument appDocs[MAX_APPS];
int          appCount        = 0;
int          currentAppIndex = 0;

// Timing
unsigned long lastPollMs     = 0;
unsigned long appStartMs     = 0;
int           rotationSecs   = DEFAULT_ROTATION_S;
bool          isOffline      = false;

// Local time (updated on each poll)
struct LocalTime {
  int year, month, day;
  int hour, minute, second;
  int weekday;   // 0 = Sunday
  unsigned long syncedAtMs;  // millis() when we received this
} localTime = {};

// ── Forward declarations ──────────────────────────────────────────────────────

void connectWiFi();
bool pollServer();
void parseResponse(JsonDocument& doc);
void renderApp(int index);
void renderOffline();
void updateLocalTime();

// ── Setup ─────────────────────────────────────────────────────────────────────

void setup() {
  Serial.begin(115200);
  while (!Serial && millis() < 3000);   // wait up to 3s for serial monitor
  Serial.println("[REDI] booting...");

  // Init matrix
  ProtomatterStatus status = matrix.begin();
  if (status != PROTOMATTER_OK) {
    Serial.print("[REDI] matrix init failed: ");
    Serial.println((int)status);
    while (1);
  }
  Serial.println("[REDI] matrix OK");

  // Solid colour test — red, green, blue for 500ms each
  matrix.fillScreen(matrix.color565(80, 0, 0));  matrix.show(); delay(500);
  matrix.fillScreen(matrix.color565(0, 80, 0));  matrix.show(); delay(500);
  matrix.fillScreen(matrix.color565(0, 0, 80));  matrix.show(); delay(500);
  matrix.fillScreen(0);                           matrix.show();

  connectWiFi();

  // First poll
  if (pollServer()) {
    lastPollMs = millis();
    isOffline  = false;
  } else {
    isOffline = true;
  }

  appStartMs = millis();
}

// ── Main loop ─────────────────────────────────────────────────────────────────

void loop() {
  unsigned long now = millis();

  // Poll server every 5 minutes (or retry every 30s when offline)
  unsigned long interval = isOffline ? RETRY_INTERVAL_MS : POLL_INTERVAL_MS;
  if (now - lastPollMs >= interval) {
    if (pollServer()) {
      lastPollMs = now;
      isOffline  = false;
    } else {
      lastPollMs = now;   // reset timer even on failure to avoid hammering
      isOffline  = !isOffline ? true : isOffline;
    }
  }

  // Advance app after display duration
  int displaySecs = rotationSecs;  // TODO: per-app overrides in renderApp()
  if (appCount > 0 && (now - appStartMs) >= (unsigned long)(displaySecs * 1000)) {
    currentAppIndex = (currentAppIndex + 1) % appCount;
    appStartMs      = now;
  }

  // Render current frame
  if (appCount == 0 || isOffline) {
    renderOffline();
  } else {
    renderApp(currentAppIndex);
  }

  matrix.show();
  delay(50);   // ~20fps
}

// ── WiFi ──────────────────────────────────────────────────────────────────────

void connectWiFi() {
  Serial.print("[WiFi] connecting to ");
  Serial.println(WIFI_SSID);
  matrix.fillScreen(0);
  matrix.setCursor(1, 1);
  matrix.setTextColor(matrix.color565(255, 200, 0));
  matrix.print("WiFi...");
  matrix.show();

  int attempts = 0;
  while (WiFi.begin(WIFI_SSID, WIFI_PASSWORD) != WL_CONNECTED && attempts < 10) {
    delay(2000);
    attempts++;
    Serial.print(".");
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[WiFi] connected");
    Serial.print("[WiFi] IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n[WiFi] failed — continuing offline");
  }
}

// ── Server poll ───────────────────────────────────────────────────────────────

bool pollServer() {
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
    if (WiFi.status() != WL_CONNECTED) return false;
  }

  WiFiSSLClient client;
  Serial.print("[poll] connecting to ");
  Serial.println(SERVER_HOST);

  if (!client.connect(SERVER_HOST, SERVER_PORT)) {
    Serial.println("[poll] connection failed");
    return false;
  }

  // Send HTTP GET
  client.print("GET ");
  client.print(SERVER_PATH);
  client.println(" HTTP/1.1");
  client.print("Host: ");
  client.println(SERVER_HOST);
  client.print("Authorization: Bearer ");
  client.println(API_KEY);
  client.println("Connection: close");
  client.println();

  // Wait for response
  unsigned long timeout = millis();
  while (!client.available() && millis() - timeout < 10000) delay(10);
  if (!client.available()) {
    Serial.println("[poll] timeout");
    client.stop();
    return false;
  }

  // Skip HTTP headers (read until blank line)
  while (client.connected()) {
    String line = client.readStringUntil('\n');
    if (line == "\r") break;
  }

  // Parse JSON body
  JsonDocument doc;
  DeserializationError err = deserializeJson(doc, client);
  client.stop();

  if (err) {
    Serial.print("[poll] JSON error: ");
    Serial.println(err.c_str());
    return false;
  }

  parseResponse(doc);
  Serial.print("[poll] OK — ");
  Serial.print(appCount);
  Serial.println(" apps");
  return true;
}

// ── Parse render response ─────────────────────────────────────────────────────

void parseResponse(JsonDocument& doc) {
  rotationSecs = doc["rotation_seconds"] | DEFAULT_ROTATION_S;

  // Sync local time
  localTime.year     = doc["local"]["year"]    | 2026;
  localTime.month    = doc["local"]["month"]   | 1;
  localTime.day      = doc["local"]["day"]     | 1;
  localTime.hour     = doc["local"]["hour"]    | 0;
  localTime.minute   = doc["local"]["minute"]  | 0;
  localTime.second   = doc["local"]["second"]  | 0;
  localTime.weekday  = doc["local"]["weekday"] | 0;
  localTime.syncedAtMs = millis();

  // Copy app payloads
  JsonArray apps = doc["apps"].as<JsonArray>();
  appCount = 0;
  for (JsonObject app : apps) {
    if (appCount >= MAX_APPS) break;
    appDocs[appCount] = app;
    appCount++;
  }

  // Reset to first app on fresh poll
  currentAppIndex = 0;
  appStartMs      = millis();
}

// ── Time helpers ──────────────────────────────────────────────────────────────

// Returns current local time, advancing from the synced snapshot using millis()
void updateLocalTime() {
  unsigned long elapsed = (millis() - localTime.syncedAtMs) / 1000UL;
  int totalSecs = localTime.hour * 3600 + localTime.minute * 60 + localTime.second + (int)elapsed;

  localTime.second = totalSecs % 60;
  localTime.minute = (totalSecs / 60) % 60;
  localTime.hour   = (totalSecs / 3600) % 24;
}

// ── App renderer dispatcher ───────────────────────────────────────────────────

void renderApp(int index) {
  if (index < 0 || index >= appCount) return;

  matrix.fillScreen(0);

  const char* appId = appDocs[index]["app"];
  if (!appId) return;

  String id = String(appId);

  if      (id == "clock")             renderClock(appDocs[index]);
  else if (id == "clock_date")        renderClockDate(appDocs[index]);
  else if (id == "word_clock")        renderWordClock(appDocs[index]);
  else if (id == "date_progress")     renderDateProgress(appDocs[index]);
  else if (id == "weather_today")     renderWeatherToday(appDocs[index]);
  else if (id == "weather_three_days")renderWeatherThreeDays(appDocs[index]);
  else if (id == "moon_phase")        renderMoonPhase(appDocs[index]);
  else if (id == "currency_trm")      renderCurrency(appDocs[index]);
  else if (id == "currency_eur")      renderCurrency(appDocs[index]);
  else if (id == "birthday")          renderBirthday(appDocs[index]);
  else if (id == "happy_birthday")    renderHappyBirthday(appDocs[index]);
  else if (id == "quotes")            renderQuotes(appDocs[index]);
  else if (id == "countdown")         renderCountdown(appDocs[index]);
  else if (id == "national_flag")     renderNationalFlag(appDocs[index]);
  else if (id == "three_cities_clock")renderThreeCitiesClock(appDocs[index]);
  else {
    // Unknown app — show app id as debug text
    matrix.setCursor(1, 12);
    matrix.setTextColor(matrix.color565(100, 100, 100));
    matrix.print(appId);
  }
}

// ── Offline screen ────────────────────────────────────────────────────────────

void renderOffline() {
  matrix.fillScreen(0);
  updateLocalTime();

  // Large clock using built-in font (placeholder until large digit font is added)
  char buf[6];
  snprintf(buf, sizeof(buf), "%02d:%02d", localTime.hour, localTime.minute);
  matrix.setCursor(8, 8);
  matrix.setTextColor(matrix.color565(180, 180, 180));
  matrix.setTextSize(1);
  matrix.print(buf);

  // OFFLINE label
  matrix.setCursor(10, 22);
  matrix.setTextColor(matrix.color565(180, 40, 40));
  matrix.print("OFFLINE");
}

// ── App stubs (each will get its own .cpp file) ───────────────────────────────
// These will be replaced with full implementations one by one.

void renderClock(JsonDocument& doc) {
  updateLocalTime();
  char buf[6];
  snprintf(buf, sizeof(buf), "%02d:%02d", localTime.hour, localTime.minute);
  matrix.setCursor(8, 12);
  matrix.setTextColor(matrix.color565(255, 200, 0));
  matrix.setTextSize(1);
  matrix.print(buf);
}

void renderClockDate(JsonDocument& doc)        { matrix.setCursor(1,14); matrix.setTextColor(matrix.color565(100,100,200)); matrix.print("CLOCK DATE"); }
void renderWordClock(JsonDocument& doc)        { matrix.setCursor(1,14); matrix.setTextColor(matrix.color565(100,200,100)); matrix.print("WORD CLOCK"); }
void renderDateProgress(JsonDocument& doc)     { matrix.setCursor(1,14); matrix.setTextColor(matrix.color565(200,100,100)); matrix.print("DATE PROG"); }
void renderWeatherToday(JsonDocument& doc)     { matrix.setCursor(1,14); matrix.setTextColor(matrix.color565(100,200,255)); matrix.print("WEATHER"); }
void renderWeatherThreeDays(JsonDocument& doc) { matrix.setCursor(1,14); matrix.setTextColor(matrix.color565(100,200,255)); matrix.print("3-DAY WX"); }
void renderMoonPhase(JsonDocument& doc)        { matrix.setCursor(1,14); matrix.setTextColor(matrix.color565(200,200,200)); matrix.print("MOON"); }
void renderCurrency(JsonDocument& doc)         { matrix.setCursor(1,14); matrix.setTextColor(matrix.color565(100,255,100)); matrix.print("CURRENCY"); }
void renderBirthday(JsonDocument& doc)         { matrix.setCursor(1,14); matrix.setTextColor(matrix.color565(255,100,200)); matrix.print("BIRTHDAY"); }
void renderHappyBirthday(JsonDocument& doc)    { matrix.setCursor(1,14); matrix.setTextColor(matrix.color565(255,150,50));  matrix.print("HBD!"); }
void renderQuotes(JsonDocument& doc)           { matrix.setCursor(1,14); matrix.setTextColor(matrix.color565(200,200,200)); matrix.print("QUOTE"); }
void renderCountdown(JsonDocument& doc)        { matrix.setCursor(1,14); matrix.setTextColor(matrix.color565(255,100,100)); matrix.print("COUNTDOWN"); }
void renderNationalFlag(JsonDocument& doc)     { matrix.setCursor(1,14); matrix.setTextColor(matrix.color565(200,200,50));  matrix.print("FLAG"); }
void renderThreeCitiesClock(JsonDocument& doc) { matrix.setCursor(1,14); matrix.setTextColor(matrix.color565(100,200,200)); matrix.print("3 CITIES"); }

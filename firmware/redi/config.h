#pragma once

// ── WiFi & server ─────────────────────────────────────────────────────────────
// Filled in at runtime via AP mode captive portal and saved to flash.
// These are compile-time fallbacks for development only.
#define WIFI_SSID     ""
#define WIFI_PASSWORD ""
#define SERVER_HOST   "your-vps-ip-or-domain"
#define SERVER_PORT   443
#define SERVER_PATH   "/api/v1/render"
#define API_KEY       ""

// ── Timing ────────────────────────────────────────────────────────────────────
#define POLL_INTERVAL_MS   (5UL * 60UL * 1000UL)   // 5 minutes
#define RETRY_INTERVAL_MS  (30UL * 1000UL)          // retry after failure
#define DEFAULT_ROTATION_S 10                        // fallback if server omits

// ── Display ───────────────────────────────────────────────────────────────────
#define MATRIX_WIDTH   64
#define MATRIX_HEIGHT  32
#define DEFAULT_BRIGHTNESS 80   // 0–255

// ── Matrix Portal M4 pin assignments ─────────────────────────────────────────
// These match the Matrix Portal M4 hardware — do not change.
#define R1_PIN  2
#define G1_PIN  3
#define B1_PIN  4
#define R2_PIN  5
#define G2_PIN  6
#define B2_PIN  7
#define A_PIN   8
#define B_PIN   9
#define C_PIN   10
#define D_PIN   11
#define LAT_PIN 12
#define OE_PIN  13
#define CLK_PIN 14
#define LDR_PIN A0   // light-dependent resistor for auto-brightness

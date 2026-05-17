# REDI Firmware

Arduino sketch for the Adafruit Matrix Portal M4 + 64×32 RGB LED matrix.

## Hardware

- Adafruit Matrix Portal M4
- Waveshare 64×32 RGB LED matrix panel (HUB75)
- Optional: photoresistor on A0 for auto-brightness

## Required Libraries (Arduino Library Manager)

| Library | Version |
|---------|---------|
| Adafruit Protomatter | latest |
| Adafruit SPIFlash | latest |
| WiFiNINA | latest |
| ArduinoJson | **v7** |
| Adafruit BusIO | latest (dependency) |
| Adafruit NeoPixel | latest (dependency) |

## Board Setup

1. Install board support: **Tools → Board → Board Manager → search "Adafruit SAMD"**
2. Select board: **Adafruit Matrix Portal M4**
3. Port: whichever USB serial port appears when the device is plugged in

## First-time Config

Edit `config.h` with your WiFi credentials, server host, and API key before flashing.
(AP mode captive portal for runtime config is a planned feature — not yet implemented.)

## Flash Instructions

1. Open `firmware/redi/redi.ino` in Arduino IDE
2. Fill in `config.h`
3. **Sketch → Upload** (or Ctrl+U)
4. Open Serial Monitor at 115200 baud to see debug output

## Build Order

See `FIRMWARE.md` in the repo root for the full phased build plan.
Current status: skeleton only — WiFi, polling, JSON parsing, and app stubs.

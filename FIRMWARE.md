# REDI Firmware Plan

## Hardware
- **MCU:** Adafruit Matrix Portal M4 (ATSAMD51, Cortex-M4 @ 120MHz)
- **WiFi:** ESP32 co-processor on Matrix Portal (SPI, AT commands via WiFiNINA)
- **Display:** Waveshare 64×32 RGB LED matrix, driven by Protomatter
- **Flash:** 512KB (MCU) + 2MB QSPI flash on Matrix Portal (for assets + config)
- **RAM:** 192KB

---

## Language & Libraries

| Library | Purpose |
|---------|---------|
| `Adafruit_Protomatter` | RGB matrix driver |
| `WiFiNINA` | WiFi via ESP32 co-processor |
| `ArduinoJson` (v7) | Parse render endpoint JSON |
| `Adafruit_SPIFlash` | Read/write QSPI flash (config storage) |
| `RTClib` or manual | Track time between polls |

---

## Server-side fix needed first
Add `rotation_duration_seconds` to the render endpoint response:
```json
{
  "server_ts": 1234567890,
  "language": "en",
  "timezone": "America/Bogota",
  "rotation_seconds": 10,
  "apps": [...]
}
```
- [ ] Add `rotation_seconds` to `GET /api/v1/render` response

---

## Boot Sequence

```
Power on
  → Init matrix (Protomatter)
  → Init QSPI flash
  → Load config from flash (WiFi SSID, password, server URL, api_key)
  → If no config → AP mode (captive portal, see below)
  → Boot animation
  → Connect to WiFi
  → First poll → receive app list
  → Enter main loop
```

---

## WiFi Config — AP Mode (First-time Setup)

On first boot (or if config is missing/corrupt):
1. Device starts as a WiFi access point: **SSID = `REDI-SETUP`**
2. Serves a simple HTML form at `192.168.4.1`
3. Form fields: WiFi SSID, WiFi password, Server URL, API key
4. On submit: save to QSPI flash, reboot
5. Display shows: "Connect to REDI-SETUP / 192.168.4.1"

---

## Main Loop

```
loop:
  if (now - last_poll_time >= POLL_INTERVAL):    // 5 minutes
    poll /api/v1/render
    if success:
      parse JSON → update app list, rotation_seconds, server_ts
      sync RTC from server_ts
      last_poll_time = now
    else:
      show offline screen, retry in 30s

  current_app = apps[current_app_index]
  render(current_app)

  display_duration = app_duration_override(current_app) ?? rotation_seconds
  wait(display_duration)

  current_app_index = (current_app_index + 1) % apps.length
```

**Poll interval:** 5 minutes (300 seconds), configurable via `#define POLL_INTERVAL_S 300`

---

## Per-app Duration Overrides (device-side)

Most apps use `rotation_seconds` from the server. Exceptions:

| App | Override logic |
|-----|---------------|
| `quotes` | `max(rotation_seconds, lines.count * 4s)` — longer quotes get more time |
| `happy_birthday` | fixed minimum 15s — animation needs time |
| `birthday` | fixed minimum 10s |

---

## App Renderers

Each app renderer receives a `JsonObject` and draws to the matrix frame buffer.

| App | Key display elements |
|-----|---------------------|
| `clock` | Large digit font, HH:MM, 12h/24h, AM/PM indicator |
| `clock_date` | Clock top half, date bottom half (day name + DD/MM) |
| `word_clock` | 10×8 letter grid, highlight active words |
| `three_cities_clock` | 3 rows: city name + time, day/night tint |
| `date_progress` | 3 progress bars: day %, month %, year % |
| `weather_today` | Weather icon (today) + high/low, tomorrow strip |
| `weather_three_days` | 3 columns: icon + day label + high/low |
| `moon_phase` | Moon illustration + phase name |
| `currency_trm` | Current rate large, delta indicator, 30-bar chart |
| `currency_eur` | Same layout as TRM |
| `birthday` | Cake illustration + name + age |
| `happy_birthday` | Balloons/confetti animation + name |
| `quotes` | Scrolling or paged text lines + author |
| `countdown` | Days number large + event icon + event name |
| `national_flag` | Full-screen flag pixel art |

---

## Pixel Art Assets (stored in QSPI flash or PROGMEM)

All assets: 1-bit or indexed color, drawn at 64×32 px unless noted.

| Asset | Count | Notes |
|-------|-------|-------|
| Weather illustrations | 7 | Codes 1–7: sunny, partly cloudy, cloudy, rain, thunder, snow, fog |
| Moon phases | 8 | Full disk illustrations for each phase |
| National flags | 15 | CO, US, AR, ES, IT, FR, DE, GB, CN, JP, BR, MX, CA, KR, RU |
| Birthday cake | 1 | Used by `birthday` app |
| Balloons / confetti | 1–3 frames | Used by `happy_birthday` (simple animation) |
| Countdown icons | 5 | Valentines heart, Halloween pumpkin, Christmas tree, firework, star (Reyes) |
| Day/night overlay | 2 | Tint palette for three_cities_clock |

**Format:** RGB565 or RGB888 byte arrays in PROGMEM. 64×32 RGB565 = 4KB per asset.

---

## Font System

Two fonts needed:

| Font | Usage | Size |
|------|-------|------|
| **Large digits** | clock HH:MM | ~16×24 px per digit |
| **Small mono** | labels, city names, author, day abbreviations | ~5×7 px per char |

Both stored as PROGMEM bitmap arrays (1 bit per pixel, color applied at render time).

---

## Timekeeping

- On each successful poll: set internal software clock from `server_ts` (Unix timestamp)
- Between polls: advance clock using `millis()` delta
- Timezone: firmware applies offset by looking up the timezone string at compile time OR server sends pre-computed local time fields
- **Simpler approach:** server sends `local_time` fields directly in the response (avoids IANA tz database on device):
  ```json
  "local": { "hour": 14, "minute": 32, "second": 8, "day": 16, "month": 5, "year": 2026, "weekday": 6 }
  ```
- [ ] Add `local` time object to render endpoint response

---

## Offline Fallback

When WiFi is unavailable or server unreachable:
- Display: large clock (HH:MM) using last-known time + `millis()` drift
- Bottom strip: "OFFLINE" label in red
- Retry poll every 30 seconds
- If offline > 10 minutes: slow-pulse the display brightness as visual alert

---

## Memory Budget (estimates)

| Item | RAM | Flash/PROGMEM |
|------|-----|---------------|
| Protomatter frame buffer (64×32×3) | 6KB | — |
| ArduinoJson document | 4KB | — |
| WiFiNINA buffers | ~8KB | — |
| App list (15 apps × ~64B) | ~1KB | — |
| Font data | — | ~4KB |
| Weather icons (7 × 4KB) | — | 28KB |
| Moon phases (8 × 4KB) | — | 32KB |
| Flags (15 × 4KB) | — | 60KB |
| Other illustrations | — | ~20KB |
| **Total** | **~19KB RAM** | **~144KB assets** |

RAM headroom is comfortable. Assets fit in QSPI flash (2MB available) with room to spare.

---

## Build Order

1. **[ ] Render endpoint fix** — add `rotation_seconds` + `local` time to response
2. **[ ] Skeleton sketch** — matrix init, solid color test, serial debug
3. **[ ] WiFi + HTTP** — connect, GET request, print raw response
4. **[ ] JSON parsing** — parse render response, log each app payload
5. **[ ] AP mode / config** — QSPI config storage, captive portal HTML form
6. **[ ] Clock renderer** — large digit font, HH:MM, advance with millis()
7. **[ ] Rotation loop** — cycle through app list, duration timing
8. **[ ] Boot animation** — pixel reveal sequence
9. **[ ] Remaining app renderers** — one by one, simplest first
10. **[ ] Pixel art assets** — draw flags, icons, illustrations; convert to PROGMEM arrays
11. **[ ] Offline fallback** — detect failure, show clock + OFFLINE
12. **[ ] Night mode** — check local time, blank display during night_mode window
13. **[ ] LDR auto-brightness** — read analog pin A0 (Matrix Portal), map to brightness
14. **[ ] Field testing** — run for 48h, check memory leaks, WiFi reconnect, edge cases

# REDI — Build Plan

> Living document. Mark items `[x]` as completed. Update PROGRESS.md with key decisions after each phase.

---

## Phase 1 — App Configuration UI (current focus)

Goal: users can enable/disable and configure each of the 14 apps from the dashboard.

### 1.1 App config pages — `/dashboard/apps/[appId]`

Each app gets a config route. Apps with no settings (fully automatic) just show an enable/disable toggle.

| App ID | Settings needed | Status |
|--------|----------------|--------|
| `clock` | timezone, 12h/24h | [ ] |
| `word_clock` | timezone | [ ] |
| `clock_date` | timezone, 12h/24h | [ ] |
| `three_cities_clock` | 3 × city picker, (timezone auto-resolved) | [ ] |
| `date_progress` | none (fully automatic) | [ ] |
| `weather_today` | city, °F/°C | [ ] |
| `weather_three_days` | city, °F/°C | [ ] |
| `moon_phase` | none (fully automatic) | [ ] |
| `currency_trm` | display duration | [ ] |
| `currency_eur` | display duration (disabled — data source TBD) | [ ] |
| `birthday` | birthday entries CRUD | [ ] |
| `happy_birthday` | birthday entries CRUD (shared with above) | [ ] |
| `quotes` | none (managed by admin) | [ ] |
| `countdown` | display duration | [ ] |
| `national_flag` | multi-select countries, display duration | [ ] |

### 1.2 Apps list page — `/dashboard/apps`
- [ ] Drag-and-drop reorder (dnd-kit already installed)
- [ ] Enable/disable toggle per app
- [ ] "Configure" link for apps that have settings
- [ ] Warn + block save if zero apps enabled

### 1.3 Seed the `apps` table
- [ ] Insert all 14 app rows with correct IDs, names, `has_config` flag

---

## Phase 2 — Device Registration Flow

Goal: a new physical device can be linked to a user account.

- [ ] Pairing code displayed by firmware on first boot (already have `pairing_code` column)
- [ ] `/dashboard/home` — "Link a device" button → modal to enter pairing code
- [ ] Server action: find device by pairing code → assign `user_id`, generate `api_key`
- [ ] After linking: device appears in the user's home with name + status
- [ ] Admin can pre-create devices (already done) with a printed pairing code

---

## Phase 3 — Render Endpoint

Goal: firmware can call `GET /api/v1/render` and receive the full payload to display.

### 3.1 Authentication
- [ ] Device authenticates via `Authorization: Bearer <api_key>` header
- [ ] Middleware or route-level check validates key → resolves `device_id`

### 3.2 Render logic per app
The endpoint builds the full JSON response — one object per enabled app — based on:
- Device's enabled apps (ordered by `position`)
- App-specific config from `device_apps.config`
- Current time in device's timezone
- External API data (weather, TRM)

| App | Server work | External API |
|-----|-------------|--------------|
| `clock` | current time in timezone | none |
| `word_clock` | language setting only | none |
| `clock_date` | language setting only | none |
| `three_cities_clock` | time + sunrise/sunset per city | WeatherAPI |
| `date_progress` | current date | none |
| `weather_today` | forecast + condition mapping | WeatherAPI |
| `weather_three_days` | 3-day forecast + condition mapping | WeatherAPI |
| `moon_phase` | phase name → code mapping | WeatherAPI |
| `currency_trm` | normalize history array, compute delta | TRM (cached) |
| `currency_eur` | normalize history array, compute delta | Frankfurter (TBD) |
| `birthday` | filter today's entries, cycle index | none |
| `happy_birthday` | filter today's entries, cycle index | none |
| `quotes` | select next quote by language, advance pointer | none |
| `countdown` | advance event index, compute days remaining | none |
| `national_flag` | check today's national days | none |

### 3.3 Timestamp in response
- [ ] Every response includes a `server_ts` Unix timestamp (device syncs its clock from this)

### 3.4 Caching strategy
- Weather: cache per city, expire after 5 min
- TRM: cache in `currency_history` table, fetch once/day
- Moon phase: part of WeatherAPI astronomy call, cache per location per day

---

## Phase 4 — External API Integrations

### 4.1 WeatherAPI
- [ ] `/api/weather/[city]` internal utility — wraps WeatherAPI calls
- [ ] Map 57 WeatherAPI condition codes → 9 REDI illustration codes
- [ ] Extract: forecast, high/low, sunrise/sunset, moon phase

### 4.2 TRM (COP/USD)
- [ ] Daily cron job: fetch from Superintendencia Financiera de Colombia
- [ ] Store in `currency_history` (30-day rolling window)
- [ ] Normalize history to 0.0–1.0 float array server-side

### 4.3 EUR/COP
- [ ] Evaluate Frankfurter or dolarapi.com
- [ ] Same caching pattern as TRM once source is confirmed

---

## Phase 5 — Admin Improvements

- [ ] Admin device detail page — edit device name, reassign user, force offline
- [ ] Admin quotes page already exists — verify wrap preview works correctly
- [ ] Email notifications: device offline > 1 week, device back online, API errors

---

## Phase 6 — Firmware (Arduino / CircuitPython)

Goal: Matrix Portal M4 firmware that calls the render endpoint and drives the display.

- [ ] WiFi setup AP mode (captive portal for first-time setup)
- [ ] Boot animation sequence (single pixel → line → rect reveal → logo → signature → connecting)
- [ ] Poll `/v1/render` every 1–5 min, parse JSON
- [ ] App rendering engine — one render function per app
- [ ] Pixel art assets in PROGMEM (flags, birthday cake, balloons, countdown icons, weather icons, moon phases)
- [ ] Word clock on-device logic (EN + ES lookup tables)
- [ ] Clock date on-device day/month lookup tables
- [ ] Date progress bars — computed from internal clock every minute
- [ ] LDR auto-brightness
- [ ] Night mode (off between configurable hours)
- [ ] Offline fallback: large clock + "offline" message

---

## Schema changes still needed

- [ ] Add `countdown_event_index` int to `Device` (for countdown app rotation)
- [ ] Add `last_quote_id` uuid to `DeviceApp` or track in `config` json (for quote cycling)
- [ ] Add `flag_cycle_index` int to `DeviceApp` config (for national flag cycling)
- [ ] Add `birthday_cycle_index` int to `DeviceApp` config (for birthday cycling)

---

## Current order of attack

1. Seed `apps` table
2. Apps list page (reorder + toggle)
3. App config pages (start with simple ones: clock, date_progress, moon_phase)
4. Birthday entries CRUD (most complex config UI)
5. Device registration flow
6. Render endpoint skeleton + clock/date apps (no external APIs)
7. WeatherAPI integration + weather apps
8. TRM integration + currency app
9. Firmware

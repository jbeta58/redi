# REDI — Build Plan

> Living document. Mark items `[x]` as completed. Update PROGRESS.md with key decisions after each phase.

---

## Phase 1 — App Configuration UI ✅

### 1.1 App config pages — `/dashboard/apps/[appId]` ✅

| App ID | Settings | Status |
|--------|----------|--------|
| `clock` | 12h/24h | ✅ |
| `word_clock` | none | ✅ |
| `clock_date` | 12h/24h | ✅ |
| `three_cities_clock` | 3 × city input | ✅ |
| `date_progress` | none | ✅ |
| `weather_today` | city, °C/°F | ✅ |
| `weather_three_days` | city, °C/°F | ✅ |
| `moon_phase` | none | ✅ |
| `currency_trm` | display duration | ✅ |
| `currency_eur` | display duration | ✅ |
| `birthday` | CRUD entries | ✅ |
| `happy_birthday` | shared with birthday | ✅ |
| `quotes` | none (admin-managed) | ✅ |
| `countdown` | display duration | ✅ |
| `national_flag` | multi-select countries | ✅ |

### 1.2 Apps list page — `/dashboard/apps` ✅
- [x] Drag-and-drop reorder (dnd-kit)
- [x] Enable/disable toggle per app
- [x] "Configure" gear icon for apps with settings
- [x] Backfill logic for existing devices with no device_apps

### 1.3 Seed the `apps` table ✅
- [x] 15 app rows with IDs, names, `has_config` flag, via `tsx prisma/seed.ts`

---

## Phase 2 — Device Registration Flow ✅

- [x] `/dashboard/home` — three states: no device / unlinked / linked dashboard
- [x] Pairing code entry form → `linkDevice` server action → generates `api_key`
- [x] Admin creates device → `device_apps` auto-seeded for all active apps
- [x] Linked device shows status (online/offline), last seen, rotation, enabled apps

---

## Phase 3 — Render Endpoint ✅

### 3.1 Authentication ✅
- [x] `Authorization: Bearer <api_key>` header validation

### 3.2 Render logic per app

| App | Status |
|-----|--------|
| `clock` | ✅ |
| `word_clock` | ✅ |
| `clock_date` | ✅ |
| `three_cities_clock` | ✅ (WeatherAPI for timezone + is_day) |
| `date_progress` | ✅ |
| `weather_today` | ✅ |
| `weather_three_days` | ✅ |
| `moon_phase` | ✅ |
| `currency_trm` | ✅ (reads currency_history, 30-day normalized chart) |
| `currency_eur` | [ ] stubbed — wire up same as TRM |
| `birthday` | ✅ (today filter + cycle index) |
| `happy_birthday` | ✅ |
| `quotes` | ✅ (sequential cycling, EN/ES) |
| `countdown` | ✅ (5 events round-robin) |
| `national_flag` | ✅ (today's national days) |

### 3.3 Device heartbeat ✅
- [x] `server_ts`, `language`, `timezone` in every response
- [x] `last_seen_at` and `is_online` updated on every render call

### 3.4 Caching strategy ✅
- [x] Weather: 5-min in-memory cache per city
- [x] Cycle state (quotes, birthday, countdown): stored in `device_apps.config` JSON
- [x] Currency: stored in `currency_history`, fetched from DB at render time

---

## Phase 4 — External API Integrations ✅

### 4.1 WeatherAPI ✅
- [x] `src/lib/weather.ts` — fetchWeather with 5-min cache
- [x] 57 condition codes → 7 REDI illustration codes
- [x] Moon phase mapping (8 phases, EN/ES names)
- [x] Day abbreviations (EN/ES, timezone-aware)

### 4.2 TRM (COP/USD) ✅
- [x] `GET /api/cron/trm` — fetches from datos.gov.co (Superfinanciera)
- [x] Upserts by `vigenciadesde` date (handles weekends/holidays correctly)
- [x] Cron: daily at 11:00 UTC (6:00am COT), logs to `logs/cron-trm.log`
- [x] 22 rows backfilled (Apr 16 – May 16)

### 4.3 EUR/COP ✅
- [x] `GET /api/cron/eur` — fetches from fawazahmed0 CDN (ECB data, no key)
- [x] Same upsert pattern as TRM
- [x] Cron: daily at 11:00 UTC (6:00am COT), logs to `logs/cron-eur.log`
- [x] 22 rows backfilled (Apr 16 – May 16)

---

## Phase 5 — Admin Improvements

- [ ] Admin device detail page — edit name, reassign user, force offline
- [ ] Admin quotes page — verify line-wrap preview works correctly
- [ ] Email notifications: device offline > 1 week, device back online, API errors

---

## Phase 6 — Firmware (Arduino / CircuitPython)

- [ ] WiFi setup AP mode (captive portal for first-time setup)
- [ ] Boot animation (pixel → line → rect → logo → signature → connecting)
- [ ] Poll `/v1/render` every 1–5 min, parse JSON
- [ ] App rendering engine — one render function per app
- [ ] Pixel art assets in PROGMEM (flags, cake, balloons, icons, weather, moon)
- [ ] Word clock on-device logic (EN + ES lookup tables)
- [ ] Clock date on-device day/month lookup tables
- [ ] Date progress bars — computed from internal clock every minute
- [ ] LDR auto-brightness
- [ ] Night mode (off between configurable hours)
- [ ] Offline fallback: large clock + "offline" message

---

## Remaining loose ends (before firmware)

- [ ] Wire `currency_eur` renderer in `/api/v1/render` (1-line change, same as TRM)
- [ ] Admin device detail / edit page
- [ ] Decide: do we need a quotes admin UI improvement (wrap preview)?
- [ ] Consider: admin page to view currency_history table

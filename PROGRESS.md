# REDI — Progress Tracker
> Last updated: 2026-04-25
> Companion to [`SPEC.md`](./SPEC.md). This file tracks **what's done, what's next, and why**.

---

## 📍 Where I Am Right Now

**Current milestone:** 🏁 Milestone 1 — Foundations
**Current phase:** Phase 2 — Dashboard shell
**Status:** In progress
**Next up:** Finish dashboard layout components, then move to Phase 3 (Device management).
**Blockers:** None.

---

## 🏁 Milestone Tracker

| # | Milestone | Phases | Status |
|---|-----------|--------|--------|
| 1 | Foundations — logged-in user sees their device in a dashboard | 1–3 | 🟡 In progress |
| 2 | End-to-end "hello world" — physical device renders the Clock app | 4–6 | ⚪ Not started |
| 3 | Core app library — all clock, weather, birthday, and currency apps live | 7–10 | ⚪ Not started |
| 4 | Polish & ship — production deploy, monitoring, first device handed off | 11–12 | ⚪ Not started |

**Legend:** ✅ done · 🟡 in progress · ⚪ not started · 🔴 blocked

---

## 🛠️ Phases

### Milestone 1 — Foundations

#### ✅ Phase 1 — Project setup & schema
*Goal: Supabase, auth, and Next.js scaffold are in place.*

- [x] Supabase project created
- [x] PostgreSQL schema deployed (7 tables: `profiles`, `devices`, `apps`, `device_apps`, `schedules`, `birthday_entries`, `currency_history`)
- [x] 11 app types seeded into `apps` table
- [x] Supabase Auth enabled
- [x] Row Level Security policies configured
- [x] Next.js app scaffolded (App Router)
- [x] Browser + server Supabase clients wired up
- [x] Route protection middleware
- [x] Login page
- [x] Admin user created
- [x] GitHub repo initialized at `github.com/jbeta58/redi`

---

#### 🟡 Phase 2 — Dashboard shell
*Goal: a logged-in user lands in a responsive dashboard layout.*

- [x] Dashboard route group + layout file
- [ ] Sidebar component (desktop)
- [ ] TopBar component
- [ ] BottomNav component (mobile)
- [ ] SignOutButton wired to Supabase Auth
- [ ] Responsive behavior verified on mobile and desktop
- [ ] Empty-state placeholder for "no devices yet"

---

#### ⚪ Phase 3 — Device management (web)
*Goal: a user can claim a device and configure device-level settings.*

- [ ] "Claim device" flow — input device code, link to user
- [ ] Devices list page
- [ ] Device detail page
- [ ] Edit device name
- [ ] City selector (autocomplete from WeatherAPI city list)
- [ ] Timezone (auto-resolved from city, with override)
- [ ] Language toggle (English / Spanish)
- [ ] Temperature unit (°F / °C)
- [ ] Quiet hours (start/end time)
- [ ] Brightness rules (auto via LDR — confirm any user override needed)
- [ ] Form validation + error states

---

### Milestone 2 — End-to-end "hello world"

#### ⚪ Phase 4 — App configuration UI
*Goal: per-device app management is fully functional in the web app.*

- [ ] App list per device (enabled/disabled)
- [ ] Drag-and-drop reordering
- [ ] Per-app duration setting (5/10/15/20s)
- [ ] Per-app schedule (days of week, start/end time)
- [ ] Per-app settings forms (one per app type)
- [ ] Validation: at least one app must be enabled before save
- [ ] Default state: Clock app enabled for new devices

---

#### ⚪ Phase 5 — Render API v1
*Goal: device polls one endpoint and gets back what to display.*

- [ ] `GET /api/v1/render` route created
- [ ] Device authentication via token (header or query param)
- [ ] Active app resolution logic (rotation + schedule + day/time filters)
- [ ] Server timestamp included in every response (for clock sync)
- [ ] Clock app payload
- [ ] Clock and Date app payload
- [ ] Last-seen heartbeat updated on each poll
- [ ] Custom domain mapped: `api.rediapp.app` → Vercel
- [ ] Versioned URL path locked in: `/v1/render`

---

#### ⚪ Phase 6 — Firmware foundations
*Goal: a real Matrix Portal M4 boots, connects, polls, and renders.*

- [ ] Boot sequence animation (center pixel → horizontal line → REDI logo reveal → signature → WiFi screen)
- [ ] WiFi AP-mode setup (device hosts captive portal for credentials)
- [ ] Secure storage of WiFi credentials in flash
- [ ] WiFi reset button handler
- [ ] HTTPS polling loop with retry/backoff
- [ ] JSON parsing (ArduinoJson)
- [ ] Server timestamp → internal clock sync
- [ ] Local timekeeping via `millis()` between polls
- [ ] Render dispatch by `app` field
- [ ] Clock renderer
- [ ] Clock and Date renderer (with on-device day/month lookup tables, EN + ES)
- [ ] LDR-based auto-brightness loop
- [ ] Quiet hours screen-off logic
- [ ] Offline fallback — large clock display

> 🎉 **End of Milestone 2:** REDI displays time on your desk for the first time.

---

### Milestone 3 — Core app library

#### ⚪ Phase 7 — Clock-derived apps
*Goal: all apps that compute purely from the internal clock are working.*

- [ ] Word Clock — EN word table in `PROGMEM`
- [ ] Word Clock — ES word table in `PROGMEM`
- [ ] Word Clock renderer (3-line staircase layout)
- [ ] 3 Cities Clock — server payload (cities + sunrise/sunset per city)
- [ ] 3 Cities Clock renderer (day/night color coding)
- [ ] Date Progress Bars — on-device percentage calculations
- [ ] Date Progress Bars renderer (Y/M/D rows, color-coded)

---

#### ⚪ Phase 8 — Weather integration
*Goal: weather data flows from WeatherAPI → server → device → display.*

- [ ] WeatherAPI account + API key
- [ ] Server-side WeatherAPI client
- [ ] Caching layer (avoid hitting free-tier limits across multiple devices)
- [ ] WeatherAPI condition code → REDI illustration code mapping
- [ ] Day/night variant resolution from sunrise/sunset
- [ ] Weather Today & Tomorrow payload + renderer
- [ ] 3 Days Weather payload + renderer
- [ ] Moon Phase — `astronomy` endpoint integration
- [ ] Moon Phase renderer (8 illustrations)
- [ ] Pixel-art illustrations stored in firmware `PROGMEM`:
  - [ ] 9 weather illustrations (sunny/clear day+night, partly cloudy day+night, cloudy, rainy, thunderstorm, snowy, foggy)
  - [ ] 8 moon phase illustrations

---

#### ⚪ Phase 9 — Birthday apps
*Goal: birthdays show up on the right day, with the right person, in the right language.*

- [ ] `birthday_entries` CRUD UI in web app
- [ ] Server-side date matching (today's month + day)
- [ ] Cycle index logic (one person per rotation cycle, then loops)
- [ ] Birthday app payload + renderer
- [ ] Happy Birthday app payload + renderer
- [ ] Cake illustration in `PROGMEM`
- [ ] Balloons illustration in `PROGMEM`
- [ ] Name truncation logic (ellipsis at ~8–9 chars)
- [ ] EN/ES handling for "years" / "años" and "HAPPY BIRTHDAY" / "FELIZ CUMPLEAÑOS"
- [ ] Skip-when-no-match behavior verified

---

#### ⚪ Phase 10 — Currency, Quotes, Countdown
*Goal: the remaining "data-driven" apps are live.*

- [ ] **TRM (COP/USD)**
  - [ ] Superintendencia Financiera fetch logic
  - [ ] Daily fetch + hourly retry on failure
  - [ ] `currency_history` rolling 30-day storage
  - [ ] Server-side normalization (0.0–1.0 array) + delta calc
  - [ ] Renderer (chart + 3-row info zone)
- [ ] **Quotes**
  - [ ] `quotes` table
  - [ ] Admin `/admin/quotes` page (add/edit/disable, wrap preview)
  - [ ] Server-side line wrapping (≤10 chars per line)
  - [ ] Sequential cycle logic (`last_quote_id` per device)
  - [ ] Scrolling renderer (1px/frame upward)
- [ ] **Countdown**
  - [ ] Server-side round-robin event index (5 events)
  - [ ] Days-remaining calculation (timezone-aware, calendar days)
  - [ ] `TODAY` display when `days = 0`
  - [ ] Renderer (left icon + text + right icon)
  - [ ] 8 event icons in `PROGMEM` (heart, crown, star, pumpkin, ghost, tree, gift, fireworks)

---

### Milestone 4 — Polish & ship

#### ⚪ Phase 11 — Operations & monitoring
*Goal: I find out about problems before friends do.*

- [ ] Last-seen heartbeat field on `devices` (already updated in Phase 5)
- [ ] Online/offline status derivation (e.g. > 15min since last poll = offline)
- [ ] Email notification: device offline > 1 week
- [ ] Email notification: device recovers
- [ ] Email notification: external API failure (WeatherAPI / TRM)
- [ ] Admin "all devices" view with status grid
- [ ] Per-device stats panel (uptime, IP, WiFi network, firmware version)

---

#### ⚪ Phase 12 — Hardware kit & release
*Goal: first physical device handed off to a real user.*

- [ ] Purchase domain `rediapp.app`
- [ ] DNS configured: `api.rediapp.app`, `app.rediapp.app`
- [ ] Vercel custom domains attached
- [ ] Production environment variables locked down
- [ ] Production deploy + smoke test
- [ ] User manual drafted (with device pairing code, WiFi setup instructions, troubleshooting)
- [ ] Wood enclosure assembled
- [ ] Desk stand finalized
- [ ] QA pass on a clean unit (factory reset → unbox → claim → first display)
- [ ] First device handed off 🎁

---

## 📓 Decisions Log

Short, dated notes on architectural choices. Saves you from re-deciding things later.

- **2026-03-14** — Domain locked in: `rediapp.app`. Subdomain split: `api.rediapp.app` for device polling, `app.rediapp.app` for the web dashboard. DNS abstraction means infrastructure changes never require reflashing.
- **2026-03-14** — Hybrid render strategy: server resolves anything time-zone or external-data dependent (weather, currency, birthdays). Device computes anything derivable from internal clock (Word Clock, Date Progress Bars, day/month names). Avoids 5-min poll staleness.
- **2026-03-14** — Word Clock and Clock and Date use on-device EN/ES lookup tables in `PROGMEM` rather than server-resolved text, to keep displayed time always accurate to the minute.
- **2026-03-14** — Weather illustrations stored as pixel arrays in firmware `PROGMEM`. Server maps WeatherAPI's 57 condition codes down to 9 REDI illustration codes. Trade-off: icon updates require firmware reflash, but RAM cost is zero and it works fully offline.
- **2026-03-14** — Currency app payload sends pre-normalized 0.0–1.0 array; device only does `value × chart_height` mapping. Keeps firmware math trivial.
- **2026-03-14** — Countdown app uses server-side round-robin (one event per rotation cycle) rather than rendering all 5 events on one screen. Server tracks `countdown_event_index` per device.

---

## 📦 Done Archive

Completed phases get moved here with a one-line summary and a date.

- *(empty — Phase 1 will move here when Phase 2 is complete)*

---

## 🔗 Related Files

- [`SPEC.md`](./SPEC.md) — full project specification (source of truth for *what* we're building)
- [`README.md`](./README.md) — project overview and dev setup *(TBD)*

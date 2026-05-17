# REDI Build Progress

## What's done

### Infrastructure
- PostgreSQL + Prisma 7 (PrismaPg adapter, ESM-compatible)
- NextAuth v5 beta — email/password, bcryptjs, `is_admin` on profiles
- Next.js 16.2 App Router, Tailwind v4, TypeScript strict
- Deployed on Ubuntu VPS via pm2 (`next start` production build)
- Seeded `apps` table (15 apps) via `tsx prisma/seed.ts`

### Auth & layout
- `/login` — credential auth
- `/dashboard/layout` — Sidebar, TopBar, BottomNav (role-aware, client)
- `/dashboard` — redirects to `/dashboard/home` or `/admin/devices` by role

### Admin pages
- `/admin/devices` — create device (auto-seeds device_apps for all active apps), delete
- `/admin/quotes` — create/delete quotes (EN + ES body, author)
- `/admin/users` — list users

### Dashboard pages
- `/dashboard/home` — three states: no device / unlinked (pairing code entry) / linked (status + app list)
- `/dashboard/apps` — drag-to-reorder (dnd-kit), toggle, gear icon → config; backfills device_apps for legacy devices
- `/dashboard/apps/[appId]` — config UI for all 15 apps (see below)
- `/dashboard/settings` — placeholder

### App config UIs (`/dashboard/apps/[appId]`)
| Config type | Apps |
|-------------|------|
| 12h/24h toggle | `clock`, `clock_date` |
| Display duration (5/10/20s) | `countdown`, `currency_trm`, `currency_eur` |
| City + °C/°F | `weather_today`, `weather_three_days` |
| 3 city inputs | `three_cities_clock` |
| 15-country multi-select | `national_flag` |
| Birthday CRUD | `birthday`, `happy_birthday` (shared table, per-entry toggles) |
| No config | `word_clock`, `date_progress`, `moon_phase`, `quotes` |

### Device registration flow
- Admin pre-creates device with pairing code
- User enters pairing code → `linkDevice` server action → generates `api_key` (2× UUID, no hyphens)
- `api_key` is what firmware uses on every render call

### Render endpoint — `GET /api/v1/render`
- Auth: `Authorization: Bearer <api_key>`
- Returns `{ server_ts, language, timezone, apps[] }`
- Updates `last_seen_at` + `is_online` on every call
- All 14 apps rendered except `currency_eur` (stubbed — data exists, just needs 1-line wire-up)
- Cycle state (quotes, birthday, countdown, national_flag) stored in `device_apps.config` JSON, flushed in parallel after render

### External API integrations
- `src/lib/weather.ts` — WeatherAPI client, 5-min in-memory cache per city
  - 57 condition codes → 7 illustration codes
  - Moon phase mapping (8 phases, EN/ES)
  - Day abbreviations (EN/ES, timezone-aware)
- `GET /api/cron/trm` — datos.gov.co (Superintendencia Financiera), stores `cop_usd` by `vigenciadesde`
- `GET /api/cron/eur` — fawazahmed0 CDN (ECB data), stores `cop_eur` by date
- Both crons: protected by `CRON_SECRET`, run daily at 11:00 UTC (6:00am COT)
- `currency_history` table: 22 rows backfilled Apr 16 – May 16, both columns populated

---

## Key decisions

- **Tailwind v4:** `@import "tailwindcss"` in globals.css, no config file
- **is_admin boolean** on profiles (not a role text column)
- **public.is_admin() security definer** function — avoids RLS recursion
- **rotation_duration_seconds** on device (global, not per-app)
- **device_apps.config jsonb** for all per-app settings including cycle state
- **Cycle state in config JSON** — no extra schema columns needed for quote/birthday/countdown cycling
- **currency_history.date @unique** — upsert by date; TRM uses `vigenciadesde`, EUR uses API-reported date
- **TRM source:** datos.gov.co SODA API (no auth, returns `vigenciadesde`/`vigenciahasta`)
- **EUR source:** fawazahmed0 CDN on jsdelivr (no auth, supports `@YYYY-MM-DD` for historical)
- **Weekend TRM:** different rate from Friday — stored as its own row with `vigenciadesde` = Saturday

---

## Packages added
`lucide-react`, `date-fns`, `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`

---

## What's next

1. Wire `currency_eur` in render endpoint (trivial — same pattern as TRM)
2. Admin device detail/edit page
3. Firmware (Phase 6)

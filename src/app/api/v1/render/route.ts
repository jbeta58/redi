import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  fetchWeather,
  mapConditionCode,
  mapMoonPhase,
  getMoonPhaseName,
  getDayAbbr,
  getDayAbbrFromStr,
  temp,
} from '@/lib/weather'

// ── Types ─────────────────────────────────────────────────────────────────────

type Cfg = Record<string, unknown>
type AppPayload = Record<string, unknown>

interface DateParts {
  year:  number
  month: number
  day:   number
}

interface BirthdayRow {
  birth_month:            number
  birth_day:              number
  birth_year:             number | null
  name:                   string
  show_in_birthday:       boolean
  show_in_happy_birthday: boolean
}

interface DeviceAppRow {
  id:     string
  app_id: string
}

// Pending config writes collected while building payloads, flushed at the end
interface ConfigUpdate {
  deviceAppId: string
  config:      Cfg
}

// ── Constants ─────────────────────────────────────────────────────────────────

const COUNTDOWN_EVENTS = [
  { key: 'valentines', month: 2,  day: 14 },
  { key: 'halloween',  month: 10, day: 31 },
  { key: 'christmas',  month: 12, day: 25 },
  { key: 'new_year',   month: 1,  day: 1  },
  { key: 'reyes',      month: 1,  day: 6  },
] as const

const NATIONAL_DAYS: Record<string, { month: number; day: number }> = {
  CO: { month: 7,  day: 20 }, US: { month: 7,  day: 4  },
  AR: { month: 7,  day: 9  }, ES: { month: 10, day: 12 },
  IT: { month: 6,  day: 2  }, FR: { month: 7,  day: 14 },
  DE: { month: 10, day: 3  }, GB: { month: 4,  day: 23 },
  CN: { month: 10, day: 1  }, JP: { month: 2,  day: 11 },
  BR: { month: 9,  day: 7  }, MX: { month: 9,  day: 16 },
  CA: { month: 7,  day: 1  }, KR: { month: 8,  day: 15 },
  RU: { month: 6,  day: 12 },
}

// ── Utility ───────────────────────────────────────────────────────────────────

function getDateInTimezone(now: Date, timezone: string): DateParts {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric', month: 'numeric', day: 'numeric',
  }).formatToParts(now)

  return {
    year:  parseInt(parts.find(p => p.type === 'year')!.value),
    month: parseInt(parts.find(p => p.type === 'month')!.value),
    day:   parseInt(parts.find(p => p.type === 'day')!.value),
  }
}

function daysUntil(eventMonth: number, eventDay: number, today: DateParts): number {
  const t = new Date(today.year, today.month - 1, today.day)
  let e = new Date(today.year, eventMonth - 1, eventDay)
  if (e < t) e = new Date(today.year + 1, eventMonth - 1, eventDay)
  return Math.round((e.getTime() - t.getTime()) / 86_400_000)
}

// Wraps text into lines of ≤ maxChars uppercase characters for the display
function wrapQuoteText(text: string, maxChars = 10): string[] {
  const words = text.toUpperCase().split(/\s+/)
  const lines: string[] = []
  let line = ''

  for (const word of words) {
    const w = word.length > maxChars ? word.slice(0, maxChars) : word
    if (!line) {
      line = w
    } else if ((line + ' ' + w).length <= maxChars) {
      line += ' ' + w
    } else {
      lines.push(line)
      line = w
    }
  }
  if (line) lines.push(line)
  return lines
}

// ── Renderers ─────────────────────────────────────────────────────────────────

function renderClock(cfg: Cfg): AppPayload {
  return { app: 'clock', format: cfg.format ?? '12h' }
}

function renderClockDate(cfg: Cfg): AppPayload {
  return { app: 'clock_date', format: cfg.format ?? '12h' }
}

function renderWordClock(): AppPayload {
  return { app: 'word_clock' }
}

function renderDateProgress(): AppPayload {
  return { app: 'date_progress' }
}

async function renderQuotes(
  da: DeviceAppRow,
  cfg: Cfg,
  language: string,
  updates: ConfigUpdate[]
): Promise<AppPayload | null> {
  const field = language === 'es' ? 'body_es' : 'body_en'
  const lastId = (cfg.last_quote_id as string | undefined) ?? null

  // Select next quote after last shown, cycling through by id ASC
  let quote = await prisma.quote.findFirst({
    where:   { is_active: true, ...(lastId ? { id: { gt: lastId } } : {}) },
    orderBy: { id: 'asc' },
  })

  // Wrap around if we've exhausted all quotes
  if (!quote && lastId) {
    quote = await prisma.quote.findFirst({ where: { is_active: true }, orderBy: { id: 'asc' } })
  }

  if (!quote) return null

  const body = language === 'es' ? quote.body_es : quote.body_en
  const lines = wrapQuoteText(body)
  const author = quote.author.toUpperCase().slice(0, 20) +
    (quote.author.length > 20 ? '…' : '')

  updates.push({ deviceAppId: da.id, config: { ...cfg, last_quote_id: quote.id } })

  return { app: 'quotes', lines, author }
}

async function renderBirthday(
  da: DeviceAppRow,
  cfg: Cfg,
  entries: BirthdayRow[],
  today: DateParts,
  language: string,
  updates: ConfigUpdate[]
): Promise<AppPayload | null> {
  const matching = entries.filter(
    e => e.show_in_birthday && e.birth_month === today.month && e.birth_day === today.day
  )
  if (matching.length === 0) return null

  const idx = ((cfg.cycle_index as number | undefined) ?? 0) % matching.length
  const entry = matching[idx]

  const age = entry.birth_year ? today.year - entry.birth_year : null

  updates.push({ deviceAppId: da.id, config: { ...cfg, cycle_index: (idx + 1) % matching.length } })

  const label = language === 'es' ? 'años' : 'years'
  return {
    app:  'birthday',
    name: entry.name,
    age,
    age_label: label,
  }
}

async function renderHappyBirthday(
  da: DeviceAppRow,
  cfg: Cfg,
  entries: BirthdayRow[],
  today: DateParts,
  updates: ConfigUpdate[]
): Promise<AppPayload | null> {
  const matching = entries.filter(
    e => e.show_in_happy_birthday && e.birth_month === today.month && e.birth_day === today.day
  )
  if (matching.length === 0) return null

  const idx = ((cfg.cycle_index as number | undefined) ?? 0) % matching.length
  const entry = matching[idx]

  updates.push({ deviceAppId: da.id, config: { ...cfg, cycle_index: (idx + 1) % matching.length } })

  return { app: 'happy_birthday', name: entry.name.toUpperCase() }
}

async function renderCountdown(
  da: DeviceAppRow,
  cfg: Cfg,
  today: DateParts,
  updates: ConfigUpdate[]
): Promise<AppPayload> {
  const currentIdx = ((cfg.countdown_event_index as number | undefined) ?? -1)
  const nextIdx    = (currentIdx + 1) % COUNTDOWN_EVENTS.length
  const event      = COUNTDOWN_EVENTS[nextIdx]

  updates.push({ deviceAppId: da.id, config: { ...cfg, countdown_event_index: nextIdx } })

  return {
    app:   'countdown',
    event: { key: event.key, days: daysUntil(event.month, event.day, today) },
  }
}

function renderNationalFlag(
  cfg: Cfg,
  today: DateParts
): AppPayload | null {
  const countries = (cfg.countries as string[] | undefined) ?? []
  const todayFlags = countries.filter(code => {
    const nd = NATIONAL_DAYS[code]
    return nd && nd.month === today.month && nd.day === today.day
  })

  if (todayFlags.length === 0) return null

  // If multiple countries share today, always show the first enabled one
  // (Multi-country same-day cycling can be added later)
  return { app: 'national_flag', country_code: todayFlags[0] }
}

async function renderCurrencyTrm(): Promise<AppPayload> {
  const rows = await prisma.currencyHistory.findMany({
    where:   { cop_usd: { not: null } },
    orderBy: { date: 'asc' },
    take:    30,
    select:  { cop_usd: true },
  })

  if (rows.length === 0) {
    return { app: 'currency_trm', current_rate: null, delta: null, history_normalized: [] }
  }

  const rates = rows.map(r => parseFloat(r.cop_usd!.toString()))
  const min   = Math.min(...rates)
  const max   = Math.max(...rates)
  const range = max - min || 1

  const history_normalized = rates.map(r =>
    Math.round(((r - min) / range) * 100) / 100
  )
  const current_rate = +rates[rates.length - 1].toFixed(2)
  const delta = rates.length >= 2
    ? +(rates[rates.length - 1] - rates[rates.length - 2]).toFixed(2)
    : null

  return { app: 'currency_trm', current_rate, delta, history_normalized }
}

async function renderCurrencyEur(): Promise<AppPayload> {
  const rows = await prisma.currencyHistory.findMany({
    where:   { cop_eur: { not: null } },
    orderBy: { date: 'asc' },
    take:    30,
    select:  { cop_eur: true },
  })

  if (rows.length === 0) {
    return { app: 'currency_eur', current_rate: null, delta: null, history_normalized: [] }
  }

  const rates = rows.map(r => parseFloat(r.cop_eur!.toString()))
  const min   = Math.min(...rates)
  const max   = Math.max(...rates)
  const range = max - min || 1

  const history_normalized = rates.map(r =>
    Math.round(((r - min) / range) * 100) / 100
  )
  const current_rate = +rates[rates.length - 1].toFixed(2)
  const delta = rates.length >= 2
    ? +(rates[rates.length - 1] - rates[rates.length - 2]).toFixed(2)
    : null

  return { app: 'currency_eur', current_rate, delta, history_normalized }
}

// ── Weather renderers ─────────────────────────────────────────────────────────

async function renderWeatherToday(
  cfg: Cfg,
  timezone: string,
  language: string
): Promise<AppPayload | null> {
  const city = cfg.city as string | undefined
  const unit = (cfg.unit as 'C' | 'F' | undefined) ?? 'C'
  if (!city) return null

  const w = await fetchWeather(city)
  if (!w) return null

  const now      = new Date()
  const days     = w.forecast.forecastday
  const today    = days[0]
  const tomorrow = days[1]
  if (!today || !tomorrow) return null

  return {
    app: 'weather_today',
    today: {
      day:          getDayAbbr(now, timezone, language),
      high:         temp(unit === 'F' ? today.day.maxtemp_f : today.day.maxtemp_c, unit),
      low:          temp(unit === 'F' ? today.day.mintemp_f : today.day.mintemp_c, unit),
      illustration: mapConditionCode(w.current.condition.code),
      is_day:       w.current.is_day === 1,
    },
    tomorrow: {
      day:          getDayAbbrFromStr(tomorrow.date, language),
      high:         temp(unit === 'F' ? tomorrow.day.maxtemp_f : tomorrow.day.maxtemp_c, unit),
      low:          temp(unit === 'F' ? tomorrow.day.mintemp_f : tomorrow.day.mintemp_c, unit),
      illustration: mapConditionCode(tomorrow.day.condition.code),
    },
    unit,
  }
}

async function renderWeatherThreeDays(
  cfg: Cfg,
  timezone: string,
  language: string
): Promise<AppPayload | null> {
  const city = cfg.city as string | undefined
  const unit = (cfg.unit as 'C' | 'F' | undefined) ?? 'C'
  if (!city) return null

  const w = await fetchWeather(city)
  if (!w) return null

  const now  = new Date()
  const days = w.forecast.forecastday
  if (days.length < 3) return null

  const result = days.map((d, i) => ({
    day:          i === 0 ? getDayAbbr(now, timezone, language) : getDayAbbrFromStr(d.date, language),
    high:         temp(unit === 'F' ? d.day.maxtemp_f : d.day.maxtemp_c, unit),
    low:          temp(unit === 'F' ? d.day.mintemp_f : d.day.mintemp_c, unit),
    illustration: i === 0 ? mapConditionCode(w.current.condition.code) : mapConditionCode(d.day.condition.code),
    is_day:       i === 0 ? w.current.is_day === 1 : true,
  }))

  return { app: 'weather_three_days', days: result, unit }
}

async function renderMoonPhase(
  cfg: Cfg,
  language: string
): Promise<AppPayload | null> {
  // Moon phase is global — use a default city if none configured (or device city)
  const city = (cfg.city as string | undefined) ?? 'London'

  const w = await fetchWeather(city)
  if (!w) return null

  const phaseName = w.forecast.forecastday[0]?.astro.moon_phase ?? 'New Moon'
  const code      = mapMoonPhase(phaseName)
  const name      = getMoonPhaseName(code, language)

  return { app: 'moon_phase', phase: code, name }
}

async function renderThreeCitiesClock(cfg: Cfg): Promise<AppPayload | null> {
  const cityKeys = ['city1', 'city2', 'city3'] as const
  const cityNames = cityKeys.map(k => cfg[k] as string | undefined).filter(Boolean) as string[]
  if (cityNames.length < 3) return null

  const results = await Promise.all(
    cityNames.map(async city => {
      const w = await fetchWeather(city)
      return {
        name:     city,
        timezone: w?.location.tz_id ?? null,
        is_day:   w ? w.current.is_day === 1 : true,
      }
    })
  )

  return { app: 'three_cities_clock', cities: results }
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  // Auth — device sends: Authorization: Bearer <api_key>
  const auth   = request.headers.get('authorization') ?? ''
  const apiKey = auth.startsWith('Bearer ') ? auth.slice(7).trim() : null

  if (!apiKey) {
    return NextResponse.json({ error: 'Missing authorization' }, { status: 401 })
  }

  const device = await prisma.device.findFirst({
    where:   { api_key: apiKey },
    include: {
      device_apps: {
        where:   { is_enabled: true },
        include: { app: { select: { id: true, is_active: true } } },
        orderBy: { position: 'asc' },
      },
      birthday_entries: { orderBy: { created_at: 'asc' } },
    },
  })

  if (!device) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
  }

  const now     = new Date()
  const today   = getDateInTimezone(now, device.timezone)
  const updates: ConfigUpdate[] = []
  const apps:    AppPayload[]   = []

  for (const da of device.device_apps) {
    if (!da.app.is_active) continue

    const cfg    = (da.config ?? {}) as Cfg
    const appId  = da.app_id
    let payload: AppPayload | null = null

    switch (appId) {
      case 'clock':           payload = renderClock(cfg);      break
      case 'clock_date':      payload = renderClockDate(cfg);  break
      case 'word_clock':      payload = renderWordClock();      break
      case 'date_progress':   payload = renderDateProgress();   break
      case 'quotes':          payload = await renderQuotes(da, cfg, device.language, updates); break
      case 'birthday':        payload = await renderBirthday(da, cfg, device.birthday_entries, today, device.language, updates); break
      case 'happy_birthday':  payload = await renderHappyBirthday(da, cfg, device.birthday_entries, today, updates); break
      case 'countdown':       payload = await renderCountdown(da, cfg, today, updates); break
      case 'national_flag':   payload = renderNationalFlag(cfg, today); break
      case 'currency_trm':    payload = await renderCurrencyTrm(); break

      case 'weather_today':       payload = await renderWeatherToday(cfg, device.timezone, device.language); break
      case 'weather_three_days':  payload = await renderWeatherThreeDays(cfg, device.timezone, device.language); break
      case 'moon_phase':          payload = await renderMoonPhase(cfg, device.language); break
      case 'three_cities_clock':  payload = await renderThreeCitiesClock(cfg); break
      case 'currency_eur':        payload = await renderCurrencyEur(); break
    }

    if (payload) apps.push(payload)
  }

  // Flush all config updates (cycle indexes, last quote id) in parallel
  if (updates.length > 0) {
    await Promise.all(
      updates.map(u =>
        prisma.deviceApp.update({
          where: { id: u.deviceAppId },
          data:  { config: u.config as object },
        })
      )
    )
  }

  // Update last_seen_at on the device
  await prisma.device.update({
    where: { id: device.id },
    data:  { last_seen_at: now, is_online: true },
  })

  return NextResponse.json({
    server_ts: Math.floor(now.getTime() / 1000),
    language:  device.language,
    timezone:  device.timezone,
    apps,
  })
}

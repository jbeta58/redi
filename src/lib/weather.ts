// WeatherAPI client — https://www.weatherapi.com/docs/
// Single forecast call (3 days) covers weather, astronomy (moon phase, sunrise/sunset).

const API_KEY = process.env.WEATHERAPI_KEY
const BASE    = 'https://api.weatherapi.com/v1/forecast.json'
const TTL_MS  = 5 * 60 * 1000  // 5-minute in-memory cache per city

// ── Types ─────────────────────────────────────────────────────────────────────

export interface WeatherData {
  location: { name: string; tz_id: string; localtime_epoch: number }
  current: {
    is_day:    number   // 1 = day, 0 = night
    temp_c:    number
    temp_f:    number
    condition: { code: number }
  }
  forecast: {
    forecastday: Array<{
      date: string   // "YYYY-MM-DD"
      day: {
        maxtemp_c: number; maxtemp_f: number
        mintemp_c: number; mintemp_f: number
        condition: { code: number }
      }
      astro: { sunrise: string; sunset: string; moon_phase: string }
    }>
  }
}

// ── Cache ─────────────────────────────────────────────────────────────────────

interface CacheEntry { data: WeatherData; at: number }
const cache = new Map<string, CacheEntry>()

export async function fetchWeather(city: string): Promise<WeatherData | null> {
  if (!API_KEY) { console.warn('[weather] WEATHERAPI_KEY not set'); return null }

  const key = city.toLowerCase().trim()
  const hit = cache.get(key)
  if (hit && Date.now() - hit.at < TTL_MS) return hit.data

  try {
    const url = `${BASE}?key=${API_KEY}&q=${encodeURIComponent(city)}&days=3&aqi=no&alerts=no`
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) {
      console.error(`[weather] API ${res.status} for "${city}"`)
      return null
    }
    const data = (await res.json()) as WeatherData
    cache.set(key, { data, at: Date.now() })
    return data
  } catch (err) {
    console.error('[weather] fetch failed:', err)
    return null
  }
}

// ── Condition code → REDI illustration code (1–7) ────────────────────────────

export function mapConditionCode(code: number): number {
  if (code === 1000) return 1
  if (code === 1003) return 2
  if (code === 1006 || code === 1009) return 3
  if (code === 1030 || code === 1135 || code === 1147) return 7
  if ([1273, 1276, 1279, 1282].includes(code)) return 5
  if ([1114, 1117, 1210, 1213, 1216, 1219, 1222, 1225,
       1237, 1255, 1258, 1261, 1264].includes(code)) return 6
  return 4  // rain / drizzle / sleet / showers
}

// ── Moon phase ────────────────────────────────────────────────────────────────

const MOON_CODE: Record<string, number> = {
  'New Moon': 1, 'Waxing Crescent': 2, 'First Quarter': 3, 'Waxing Gibbous': 4,
  'Full Moon': 5, 'Waning Gibbous': 6, 'Last Quarter': 7, 'Waning Crescent': 8,
}

const MOON_NAME_EN: Record<number, string> = {
  1: 'New Moon', 2: 'Waxing Crescent', 3: 'First Quarter', 4: 'Waxing Gibbous',
  5: 'Full Moon', 6: 'Waning Gibbous', 7: 'Last Quarter', 8: 'Waning Crescent',
}

const MOON_NAME_ES: Record<number, string> = {
  1: 'Luna Nueva', 2: 'Luna Creciente', 3: 'Cuarto Creciente', 4: 'Gibosa Creciente',
  5: 'Luna Llena', 6: 'Gibosa Menguante', 7: 'Cuarto Menguante', 8: 'Luna Menguante',
}

export function mapMoonPhase(phaseName: string): number {
  return MOON_CODE[phaseName] ?? 1
}

export function getMoonPhaseName(code: number, language: string): string {
  return (language === 'es' ? MOON_NAME_ES : MOON_NAME_EN)[code] ?? 'New Moon'
}

// ── Day abbreviations ─────────────────────────────────────────────────────────

const DAY_EN = ['SUN','MON','TUE','WED','THU','FRI','SAT']
const DAY_ES = ['DOM','LUN','MAR','MIE','JUE','VIE','SAB']

function dayIndex(date: Date, timezone: string): number {
  const short = new Intl.DateTimeFormat('en-US', { timeZone: timezone, weekday: 'short' })
    .format(date)
  return ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].indexOf(short)
}

export function getDayAbbr(date: Date, timezone: string, language: string): string {
  const idx = dayIndex(date, timezone)
  return language === 'es' ? DAY_ES[idx] : DAY_EN[idx]
}

// dateStr is "YYYY-MM-DD" (local date from WeatherAPI forecast)
export function getDayAbbrFromStr(dateStr: string, language: string): string {
  // Use noon UTC to avoid date-rollover issues in most timezones
  const date = new Date(dateStr + 'T12:00:00Z')
  const idx  = date.getUTCDay()
  return language === 'es' ? DAY_ES[idx] : DAY_EN[idx]
}

// Temperature rounded to nearest integer
export function temp(value: number, unit: 'C' | 'F'): number {
  return Math.round(unit === 'F' ? value : value)
}

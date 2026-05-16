'use client'

import { useState, useTransition } from 'react'
import { Trash2, Plus } from 'lucide-react'
import {
  saveAppConfig,
  addBirthdayEntry,
  deleteBirthdayEntry,
  updateBirthdayEntry,
} from './actions'
import type { BirthdayEntryInput } from './actions'

export interface BirthdayEntryRow {
  id: string
  name: string
  birth_day: number
  birth_month: number
  birth_year: number | null
  show_in_birthday: boolean
  show_in_happy_birthday: boolean
}

interface Props {
  deviceId: string
  appId: string
  appName: string
  config: Record<string, unknown>
  birthdayEntries?: BirthdayEntryRow[]
}

export default function AppConfigForm({
  deviceId,
  appId,
  config,
  birthdayEntries = [],
}: Props) {
  switch (appId) {
    case 'clock':
    case 'clock_date':
      return <FormatConfig deviceId={deviceId} appId={appId} config={config} />
    case 'countdown':
    case 'currency_trm':
    case 'currency_eur':
      return <DurationConfig deviceId={deviceId} appId={appId} config={config} />
    case 'weather_today':
    case 'weather_three_days':
      return <WeatherConfig deviceId={deviceId} appId={appId} config={config} />
    case 'national_flag':
      return <NationalFlagConfig deviceId={deviceId} appId={appId} config={config} />
    case 'three_cities_clock':
      return <ThreeCitiesConfig deviceId={deviceId} appId={appId} config={config} />
    case 'birthday':
    case 'happy_birthday':
      return <BirthdayConfig deviceId={deviceId} appId={appId} entries={birthdayEntries} />
    default:
      return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 text-center">
          <p className="font-mono text-sm text-zinc-500">No settings for this app.</p>
        </div>
      )
  }
}

// ── Shared primitives ─────────────────────────────────────────────────────────

function SaveButton({ isPending }: { isPending: boolean }) {
  return (
    <button
      type="button"
      disabled={isPending}
      className="px-5 py-2.5 rounded-md bg-amber-500 text-black
                 font-mono text-sm font-semibold
                 hover:bg-amber-400 disabled:opacity-50 transition-colors duration-150"
    >
      {isPending ? 'Saving…' : 'Save'}
    </button>
  )
}

function Feedback({ error, success }: { error: string | null; success: boolean }) {
  if (error) return <p className="font-mono text-xs text-red-400 mb-3">{error}</p>
  if (success) return <p className="font-mono text-xs text-green-400 mb-3">Saved</p>
  return null
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider block mb-2">
      {children}
    </label>
  )
}

function OptionButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        px-5 py-2 rounded-md font-mono text-sm border transition-colors duration-150
        ${active
          ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
          : 'bg-zinc-950 border-zinc-700 text-zinc-400 hover:border-zinc-500'
        }
      `}
    >
      {children}
    </button>
  )
}

function Toggle({
  on,
  onChange,
  disabled,
}: {
  on: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      disabled={disabled}
      className={`
        relative w-9 h-5 rounded-full border shrink-0
        transition-colors duration-150 disabled:opacity-40
        ${on ? 'bg-amber-600/70 border-amber-500/70' : 'bg-zinc-800 border-zinc-700'}
      `}
    >
      <span className={`
        absolute top-0.5 w-3.5 h-3.5 rounded-full transition-all duration-150
        ${on ? 'left-[18px] bg-amber-300' : 'left-0.5 bg-zinc-600'}
      `} />
    </button>
  )
}

function TextInput({
  value,
  onChange,
  placeholder,
  autoFocus,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  autoFocus?: boolean
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      autoFocus={autoFocus}
      className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2.5
                 font-mono text-sm text-zinc-200 placeholder-zinc-600
                 focus:outline-none focus:border-zinc-500 transition-colors"
    />
  )
}

// ── FormatConfig — clock, clock_date ─────────────────────────────────────────

function FormatConfig({
  deviceId,
  appId,
  config,
}: {
  deviceId: string
  appId: string
  config: Record<string, unknown>
}) {
  const [format, setFormat]       = useState<'12h' | '24h'>(config.format === '24h' ? '24h' : '12h')
  const [error, setError]         = useState<string | null>(null)
  const [success, setSuccess]     = useState(false)
  const [isPending, start]        = useTransition()

  function handleSave() {
    start(async () => {
      try {
        await saveAppConfig(deviceId, appId, { format })
        setError(null); setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      } catch (e: any) { setError(e.message) }
    })
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
      <div className="mb-6">
        <SectionLabel>Time format</SectionLabel>
        <div className="flex gap-2">
          <OptionButton active={format === '12h'} onClick={() => setFormat('12h')}>12h  (1:30 PM)</OptionButton>
          <OptionButton active={format === '24h'} onClick={() => setFormat('24h')}>24h  (13:30)</OptionButton>
        </div>
      </div>
      <Feedback error={error} success={success} />
      <div onClick={handleSave}><SaveButton isPending={isPending} /></div>
    </div>
  )
}

// ── DurationConfig — countdown, currency_trm, currency_eur ───────────────────

const DURATION_OPTIONS = [5, 10, 20] as const
type Duration = typeof DURATION_OPTIONS[number]

function DurationConfig({
  deviceId,
  appId,
  config,
}: {
  deviceId: string
  appId: string
  config: Record<string, unknown>
}) {
  const raw = config.duration
  const initial: Duration = raw === 5 || raw === 10 || raw === 20 ? raw : 10
  const [duration, setDuration]   = useState<Duration>(initial)
  const [error, setError]         = useState<string | null>(null)
  const [success, setSuccess]     = useState(false)
  const [isPending, start]        = useTransition()

  function handleSave() {
    start(async () => {
      try {
        await saveAppConfig(deviceId, appId, { duration })
        setError(null); setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      } catch (e: any) { setError(e.message) }
    })
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
      <div className="mb-6">
        <SectionLabel>Display duration</SectionLabel>
        <p className="font-mono text-[10px] text-zinc-600 mb-3">
          How long this app stays on screen each rotation
        </p>
        <div className="flex gap-2">
          {DURATION_OPTIONS.map(d => (
            <OptionButton key={d} active={duration === d} onClick={() => setDuration(d)}>
              {d}s
            </OptionButton>
          ))}
        </div>
      </div>
      <Feedback error={error} success={success} />
      <div onClick={handleSave}><SaveButton isPending={isPending} /></div>
    </div>
  )
}

// ── WeatherConfig — weather_today, weather_three_days ────────────────────────

function WeatherConfig({
  deviceId,
  appId,
  config,
}: {
  deviceId: string
  appId: string
  config: Record<string, unknown>
}) {
  const [city, setCity]       = useState((config.city as string) ?? '')
  const [unit, setUnit]       = useState<'C' | 'F'>(config.unit === 'F' ? 'F' : 'C')
  const [error, setError]     = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, start]    = useTransition()

  function handleSave() {
    if (!city.trim()) { setError('City is required'); return }
    start(async () => {
      try {
        await saveAppConfig(deviceId, appId, { city: city.trim(), unit })
        setError(null); setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      } catch (e: any) { setError(e.message) }
    })
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
      <div className="mb-5">
        <SectionLabel>City</SectionLabel>
        <TextInput value={city} onChange={setCity} placeholder="e.g. Bogotá" />
      </div>
      <div className="mb-6">
        <SectionLabel>Temperature unit</SectionLabel>
        <div className="flex gap-2">
          <OptionButton active={unit === 'C'} onClick={() => setUnit('C')}>°C</OptionButton>
          <OptionButton active={unit === 'F'} onClick={() => setUnit('F')}>°F</OptionButton>
        </div>
      </div>
      <Feedback error={error} success={success} />
      <div onClick={handleSave}><SaveButton isPending={isPending} /></div>
    </div>
  )
}

// ── NationalFlagConfig ────────────────────────────────────────────────────────

const COUNTRIES = [
  { code: 'CO', name: 'Colombia',    day: 'Jul 20' },
  { code: 'US', name: 'USA',         day: 'Jul 4'  },
  { code: 'AR', name: 'Argentina',   day: 'Jul 9'  },
  { code: 'ES', name: 'Spain',       day: 'Oct 12' },
  { code: 'IT', name: 'Italy',       day: 'Jun 2'  },
  { code: 'FR', name: 'France',      day: 'Jul 14' },
  { code: 'DE', name: 'Germany',     day: 'Oct 3'  },
  { code: 'GB', name: 'England',     day: 'Apr 23' },
  { code: 'CN', name: 'China',       day: 'Oct 1'  },
  { code: 'JP', name: 'Japan',       day: 'Feb 11' },
  { code: 'BR', name: 'Brazil',      day: 'Sep 7'  },
  { code: 'MX', name: 'Mexico',      day: 'Sep 16' },
  { code: 'CA', name: 'Canada',      day: 'Jul 1'  },
  { code: 'KR', name: 'South Korea', day: 'Aug 15' },
  { code: 'RU', name: 'Russia',      day: 'Jun 12' },
] as const

function NationalFlagConfig({
  deviceId,
  appId,
  config,
}: {
  deviceId: string
  appId: string
  config: Record<string, unknown>
}) {
  const initial = Array.isArray(config.countries) ? (config.countries as string[]) : []
  const [selected, setSelected]   = useState<string[]>(initial)
  const [error, setError]         = useState<string | null>(null)
  const [success, setSuccess]     = useState(false)
  const [isPending, start]        = useTransition()

  function toggle(code: string) {
    setSelected(prev => prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code])
  }

  function handleSave() {
    start(async () => {
      try {
        await saveAppConfig(deviceId, appId, { countries: selected })
        setError(null); setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      } catch (e: any) { setError(e.message) }
    })
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
      <SectionLabel>Countries</SectionLabel>
      <p className="font-mono text-[10px] text-zinc-600 mb-4">
        Flag appears on each country's national day only
      </p>
      <div className="flex flex-col gap-1.5 mb-6">
        {COUNTRIES.map(c => (
          <button
            key={c.code}
            type="button"
            onClick={() => toggle(c.code)}
            className={`
              flex items-center justify-between px-3 py-2.5 rounded-md border
              font-mono text-sm transition-colors duration-150 text-left
              ${selected.includes(c.code)
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
                : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-600'
              }
            `}
          >
            <span>{c.name}</span>
            <span className="text-[10px] text-zinc-600">{c.day}</span>
          </button>
        ))}
      </div>
      <Feedback error={error} success={success} />
      <div onClick={handleSave}><SaveButton isPending={isPending} /></div>
    </div>
  )
}

// ── ThreeCitiesConfig ─────────────────────────────────────────────────────────

function ThreeCitiesConfig({
  deviceId,
  appId,
  config,
}: {
  deviceId: string
  appId: string
  config: Record<string, unknown>
}) {
  const [city1, setCity1]     = useState((config.city1 as string) ?? '')
  const [city2, setCity2]     = useState((config.city2 as string) ?? '')
  const [city3, setCity3]     = useState((config.city3 as string) ?? '')
  const [error, setError]     = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, start]    = useTransition()

  function handleSave() {
    if (!city1.trim() || !city2.trim() || !city3.trim()) {
      setError('All three cities are required'); return
    }
    start(async () => {
      try {
        await saveAppConfig(deviceId, appId, { city1: city1.trim(), city2: city2.trim(), city3: city3.trim() })
        setError(null); setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      } catch (e: any) { setError(e.message) }
    })
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
      <SectionLabel>Cities</SectionLabel>
      <p className="font-mono text-[10px] text-zinc-600 mb-4">
        Timezone is resolved automatically from the city name
      </p>
      <div className="flex flex-col gap-3 mb-6">
        {([
          { label: 'City 1', value: city1, set: setCity1 },
          { label: 'City 2', value: city2, set: setCity2 },
          { label: 'City 3', value: city3, set: setCity3 },
        ] as const).map(({ label, value, set }) => (
          <div key={label}>
            <label className="font-mono text-[10px] text-zinc-600 block mb-1.5">{label}</label>
            <TextInput value={value} onChange={set} placeholder="e.g. New York" />
          </div>
        ))}
      </div>
      <Feedback error={error} success={success} />
      <div onClick={handleSave}><SaveButton isPending={isPending} /></div>
    </div>
  )
}

// ── BirthdayConfig ────────────────────────────────────────────────────────────

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const DAYS_IN_MONTH = [31,29,31,30,31,30,31,31,30,31,30,31]

const EMPTY_FORM: BirthdayEntryInput = {
  name: '',
  birth_month: 1,
  birth_day: 1,
  birth_year: null,
  show_in_birthday: true,
  show_in_happy_birthday: true,
}

function BirthdayConfig({
  deviceId,
  appId,
  entries: initialEntries,
}: {
  deviceId: string
  appId: string
  entries: BirthdayEntryRow[]
}) {
  const [entries, setEntries]     = useState<BirthdayEntryRow[]>(initialEntries)
  const [showForm, setShowForm]   = useState(false)
  const [form, setForm]           = useState<BirthdayEntryInput>(EMPTY_FORM)
  const [error, setError]         = useState<string | null>(null)
  const [isPending, start]        = useTransition()

  function setField<K extends keyof BirthdayEntryInput>(key: K, value: BirthdayEntryInput[K]) {
    setForm(prev => {
      const next = { ...prev, [key]: value }
      if (key === 'birth_month') {
        const maxDay = DAYS_IN_MONTH[(value as number) - 1]
        if (next.birth_day > maxDay) next.birth_day = maxDay
      }
      return next
    })
  }

  function handleAdd() {
    if (!form.name.trim()) { setError('Name is required'); return }
    setError(null)
    start(async () => {
      try {
        await addBirthdayEntry(deviceId, form)
        setEntries(prev => [...prev, { id: crypto.randomUUID(), ...form, name: form.name.trim() }])
        setForm(EMPTY_FORM)
        setShowForm(false)
      } catch (e: any) { setError(e.message) }
    })
  }

  function handleDelete(id: string) {
    start(async () => {
      try {
        await deleteBirthdayEntry(deviceId, id)
        setEntries(prev => prev.filter(e => e.id !== id))
      } catch (e: any) { setError(e.message) }
    })
  }

  function handleToggle(
    id: string,
    field: 'show_in_birthday' | 'show_in_happy_birthday',
    value: boolean
  ) {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e))
    start(async () => {
      try {
        await updateBirthdayEntry(deviceId, id, { [field]: value })
      } catch (e: any) {
        setEntries(prev => prev.map(e => e.id === id ? { ...e, [field]: !value } : e))
        setError(e.message)
      }
    })
  }

  const maxDay = DAYS_IN_MONTH[form.birth_month - 1]

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <div className="px-4 py-3 rounded-lg border border-red-900/50 bg-red-950/20
                        font-mono text-xs text-red-400">
          {error}
        </div>
      )}

      {entries.length === 0 && !showForm && (
        <div className="bg-zinc-900 border border-dashed border-zinc-800 rounded-lg p-8 text-center">
          <p className="font-mono text-sm text-zinc-500">No birthdays added yet</p>
        </div>
      )}

      {entries.map(entry => (
        <div key={entry.id} className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-mono text-sm text-zinc-200">{entry.name}</p>
              <p className="font-mono text-[10px] text-zinc-500 mt-0.5">
                {MONTHS[entry.birth_month - 1]} {entry.birth_day}
                {entry.birth_year ? `, ${entry.birth_year}` : ''}
              </p>
            </div>
            <button
              onClick={() => handleDelete(entry.id)}
              disabled={isPending}
              className="text-zinc-700 hover:text-red-400 transition-colors p-1 disabled:opacity-40"
              aria-label="Delete"
            >
              <Trash2 size={14} />
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {([
              { field: 'show_in_birthday',       label: 'Birthday app' },
              { field: 'show_in_happy_birthday', label: 'Happy Birthday app' },
            ] as const).map(({ field, label }) => (
              <div key={field} className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-zinc-500">{label}</span>
                <Toggle
                  on={entry[field]}
                  onChange={v => handleToggle(entry.id, field, v)}
                  disabled={isPending}
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      {showForm && (
        <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-4 flex flex-col gap-4">
          <div>
            <label className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider block mb-1.5">
              Name
            </label>
            <TextInput
              value={form.name}
              onChange={v => setField('name', v)}
              placeholder="e.g. Maria"
              autoFocus
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider block mb-1.5">
                Month
              </label>
              <select
                value={form.birth_month}
                onChange={e => setField('birth_month', Number(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2.5
                           font-mono text-sm text-zinc-200
                           focus:outline-none focus:border-zinc-500 transition-colors"
              >
                {MONTHS.map((m, i) => (
                  <option key={m} value={i + 1}>{m}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider block mb-1.5">
                Day
              </label>
              <select
                value={form.birth_day}
                onChange={e => setField('birth_day', Number(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2.5
                           font-mono text-sm text-zinc-200
                           focus:outline-none focus:border-zinc-500 transition-colors"
              >
                {Array.from({ length: maxDay }, (_, i) => i + 1).map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider block mb-1.5">
              Year{' '}
              <span className="text-zinc-700 normal-case">(optional — needed to show age)</span>
            </label>
            <input
              type="number"
              value={form.birth_year ?? ''}
              onChange={e => setField('birth_year', e.target.value ? Number(e.target.value) : null)}
              placeholder="e.g. 1990"
              min={1900}
              max={new Date().getFullYear()}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2.5
                         font-mono text-sm text-zinc-200 placeholder-zinc-600
                         focus:outline-none focus:border-zinc-500 transition-colors"
            />
          </div>

          <div className="flex flex-col gap-3">
            {([
              { field: 'show_in_birthday',       label: 'Show in Birthday app' },
              { field: 'show_in_happy_birthday', label: 'Show in Happy Birthday app' },
            ] as const).map(({ field, label }) => (
              <div key={field} className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-zinc-400">{label}</span>
                <Toggle on={form[field]} onChange={v => setField(field, v)} />
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={handleAdd}
              disabled={isPending}
              className="px-5 py-2 rounded-md bg-amber-500 text-black
                         font-mono text-sm font-semibold
                         hover:bg-amber-400 disabled:opacity-50 transition-colors"
            >
              {isPending ? 'Adding…' : 'Add'}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setForm(EMPTY_FORM); setError(null) }}
              className="px-5 py-2 rounded-md border border-zinc-700 text-zinc-400
                         font-mono text-sm hover:border-zinc-500 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {!showForm && (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-md border border-dashed
                     border-zinc-700 text-zinc-500 font-mono text-sm
                     hover:border-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <Plus size={14} />
          Add birthday
        </button>
      )}
    </div>
  )
}

'use client'

/**
 * SettingsForm — client component
 *
 * Two sections:
 *   1. Display settings — language, city, rotation duration, quiet hours
 *   2. Account — change password
 *
 * Both sections save independently with their own save button.
 */

import { useState, useTransition } from 'react'
import { saveDeviceSettings, changePassword, type DeviceSettingsData } from './actions'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Device {
  id: string
  name: string
  language: string
  city: string | null
  timezone: string
  rotation_duration_seconds: number
  night_mode_enabled: boolean
  night_mode_start: string | null
  night_mode_end: string | null
}

interface Props {
  userId: string
  device: Device | null
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function SettingsForm({ userId, device }: Props) {
  return (
    <div className="flex flex-col gap-6">
      {device ? (
        <DisplaySettings device={device} />
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <p className="font-mono text-sm text-zinc-500 text-center">
            No display connected — contact the admin to get set up
          </p>
        </div>
      )}
      <AccountSettings />
    </div>
  )
}

// ── DisplaySettings ───────────────────────────────────────────────────────────

function DisplaySettings({ device }: { device: Device }) {
  const [language, setLanguage]   = useState<'en' | 'es'>(
    device.language === 'es' ? 'es' : 'en'
  )
  const [city, setCity]           = useState(device.city ?? '')
  const [duration, setDuration]   = useState(device.rotation_duration_seconds)
  const [nightMode, setNightMode] = useState(device.night_mode_enabled)
  const [nightStart, setNightStart] = useState(device.night_mode_start ?? '22:00')
  const [nightEnd, setNightEnd]   = useState(device.night_mode_end ?? '07:00')
  const [success, setSuccess]     = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleDurationChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = parseInt(e.target.value, 10)
    if (!isNaN(val)) setDuration(val)
  }

  function handleDurationBlur() {
    // Clamp on blur so the user sees the correction
    setDuration(d => Math.min(20, Math.max(5, d)))
  }

  function handleSave() {
    // Validate duration
    if (duration < 5 || duration > 20) {
      setError('Duration must be between 5 and 20 seconds')
      return
    }

    // Validate quiet hours if enabled
    if (nightMode && (!nightStart || !nightEnd)) {
      setError('Please set both quiet hours times')
      return
    }

    const data: DeviceSettingsData = {
      language,
      city,
      rotation_duration_seconds: duration,
      night_mode_enabled:        nightMode,
      night_mode_start:          nightMode ? nightStart : null,
      night_mode_end:            nightMode ? nightEnd : null,
    }

    startTransition(async () => {
      try {
        await saveDeviceSettings(device.id, data)
        setSuccess(true)
        setError(null)
        setTimeout(() => setSuccess(false), 3000)
      } catch (e: any) {
        setError(e.message)
      }
    })
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
      {/* Section header */}
      <p className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest mb-5">
        Display
      </p>

      {/* Language */}
      <div className="mb-5">
        <label className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider block mb-2">
          Language
        </label>
        <div className="flex gap-2">
          {(['en', 'es'] as const).map(lang => (
            <button
              key={lang}
              onClick={() => setLanguage(lang)}
              className={`
                px-5 py-2 rounded-md font-mono text-sm border
                transition-colors duration-150
                ${language === lang
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
                  : 'bg-zinc-950 border-zinc-700 text-zinc-400 hover:border-zinc-500'
                }
              `}
            >
              {lang === 'en' ? 'English' : 'Español'}
            </button>
          ))}
        </div>
      </div>

      {/* Main city */}
      <div className="mb-5">
        <label className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider block mb-1.5">
          Main city
        </label>
        <p className="font-mono text-[10px] text-zinc-600 mb-2">
          Timezone for all clock apps is inferred from this city
        </p>
        <input
          type="text"
          value={city}
          onChange={e => setCity(e.target.value)}
          placeholder="e.g. Bogotá, Colombia"
          className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2.5
                     font-mono text-sm text-zinc-200 placeholder-zinc-600
                     focus:outline-none focus:border-zinc-500 transition-colors"
        />
      </div>

      {/* Rotation duration */}
      <div className="mb-5">
        <label className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider block mb-1.5">
          Rotation duration
        </label>
        <p className="font-mono text-[10px] text-zinc-600 mb-2">
          How long each app stays on screen · Quotes ignores this
        </p>
        <div className="flex items-center gap-3 bg-zinc-950 border border-zinc-700
                        rounded-md px-3 py-2 w-40">
          <input
            type="number"
            min={5}
            max={20}
            value={duration}
            onChange={handleDurationChange}
            onBlur={handleDurationBlur}
            className="w-12 bg-transparent font-mono text-sm text-zinc-200
                       focus:outline-none text-center"
          />
          <span className="font-mono text-xs text-zinc-500">seconds</span>
        </div>
        <p className="font-mono text-[10px] text-zinc-600 mt-1.5">5 – 20 seconds</p>
      </div>

      {/* Quiet hours */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider">
              Quiet hours
            </p>
            <p className="font-mono text-[10px] text-zinc-600 mt-0.5">
              Turn off screen during set hours
            </p>
          </div>
          {/* Toggle */}
          <button
            onClick={() => setNightMode(n => !n)}
            className={`
              relative w-9 h-5 rounded-full border shrink-0
              transition-colors duration-150
              ${nightMode
                ? 'bg-amber-600/70 border-amber-500/70'
                : 'bg-zinc-800 border-zinc-700'
              }
            `}
          >
            <span className={`
              absolute top-0.5 w-3.5 h-3.5 rounded-full
              transition-all duration-150
              ${nightMode ? 'left-[18px] bg-amber-300' : 'left-0.5 bg-zinc-600'}
            `} />
          </button>
        </div>

        {/* Time inputs — only shown when quiet hours is enabled */}
        {nightMode && (
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="font-mono text-[10px] text-zinc-600 block mb-1.5">
                Off at
              </label>
              <input
                type="time"
                value={nightStart}
                onChange={e => setNightStart(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2
                           font-mono text-sm text-zinc-200
                           focus:outline-none focus:border-zinc-500 transition-colors"
              />
            </div>
            <div className="flex-1">
              <label className="font-mono text-[10px] text-zinc-600 block mb-1.5">
                On at
              </label>
              <input
                type="time"
                value={nightEnd}
                onChange={e => setNightEnd(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2
                           font-mono text-sm text-zinc-200
                           focus:outline-none focus:border-zinc-500 transition-colors"
              />
            </div>
          </div>
        )}
      </div>

      {/* Error / success */}
      {error && (
        <p className="font-mono text-xs text-red-400 mb-3">{error}</p>
      )}
      {success && (
        <p className="font-mono text-xs text-green-400 mb-3">Settings saved</p>
      )}

      <button
        onClick={handleSave}
        disabled={isPending}
        className="px-5 py-2.5 rounded-md bg-amber-500 text-black
                   font-mono text-sm font-semibold
                   hover:bg-amber-400 disabled:opacity-50
                   transition-colors duration-150"
      >
        {isPending ? 'Saving...' : 'Save settings'}
      </button>
    </div>
  )
}

// ── AccountSettings ───────────────────────────────────────────────────────────

function AccountSettings() {
  const [current, setCurrent]   = useState('')
  const [next, setNext]         = useState('')
  const [confirm, setConfirm]   = useState('')
  const [error, setError]       = useState<string | null>(null)
  const [success, setSuccess]   = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleChangePassword() {
    setError(null)
    if (!current) { setError('Enter your current password'); return }
    if (next.length < 8) { setError('New password must be at least 8 characters'); return }
    if (next !== confirm) { setError('Passwords do not match'); return }

    startTransition(async () => {
      try {
        await changePassword(current, next)
        setCurrent('')
        setNext('')
        setConfirm('')
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      } catch (e: any) {
        setError(e.message)
      }
    })
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
      <p className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest mb-5">
        Account
      </p>

      <div className="mb-3">
        <label className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider block mb-1.5">
          Current password
        </label>
        <input
          type="password"
          value={current}
          onChange={e => setCurrent(e.target.value)}
          autoComplete="current-password"
          className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2.5
                     font-mono text-sm text-zinc-200
                     focus:outline-none focus:border-zinc-500 transition-colors"
        />
      </div>

      <div className="mb-3">
        <label className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider block mb-1.5">
          New password
        </label>
        <input
          type="password"
          value={next}
          onChange={e => setNext(e.target.value)}
          autoComplete="new-password"
          className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2.5
                     font-mono text-sm text-zinc-200
                     focus:outline-none focus:border-zinc-500 transition-colors"
        />
      </div>

      <div className="mb-5">
        <label className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider block mb-1.5">
          Confirm new password
        </label>
        <input
          type="password"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          autoComplete="new-password"
          className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2.5
                     font-mono text-sm text-zinc-200
                     focus:outline-none focus:border-zinc-500 transition-colors"
        />
      </div>

      {error && (
        <p className="font-mono text-xs text-red-400 mb-3">{error}</p>
      )}
      {success && (
        <p className="font-mono text-xs text-green-400 mb-3">Password changed</p>
      )}

      <button
        onClick={handleChangePassword}
        disabled={isPending}
        className="px-5 py-2.5 rounded-md bg-zinc-700 text-zinc-200
                   font-mono text-sm font-semibold
                   hover:bg-zinc-600 disabled:opacity-50
                   transition-colors duration-150"
      >
        {isPending ? 'Saving...' : 'Change password'}
      </button>
    </div>
  )
}

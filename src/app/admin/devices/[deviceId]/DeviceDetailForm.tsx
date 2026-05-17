'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, WifiOff, Unlink } from 'lucide-react'
import { updateDevice, forceOffline, unlinkDevice, type UpdateDeviceInput } from './actions'

type Profile = { id: string; full_name: string | null; is_admin: boolean }

type Props = {
  deviceId:  string
  isOnline:  boolean
  isLinked:  boolean
  initial:   UpdateDeviceInput
  profiles:  Profile[]
}

const TIMEZONES = [
  'America/Bogota', 'America/New_York', 'America/Chicago',
  'America/Denver', 'America/Los_Angeles', 'America/Sao_Paulo',
  'America/Argentina/Buenos_Aires', 'America/Mexico_City',
  'Europe/Madrid', 'Europe/London', 'Europe/Paris',
  'Europe/Berlin', 'Europe/Rome',
  'Asia/Tokyo', 'Asia/Seoul', 'Asia/Shanghai', 'UTC',
]

function profileLabel(p: Profile) {
  return p.full_name?.trim() || `User ${p.id.slice(0, 6)}`
}

export default function DeviceDetailForm({ deviceId, isOnline, isLinked, initial, profiles }: Props) {
  const router = useRouter()
  const [isPending, start] = useTransition()
  const [saved, setSaved]   = useState(false)
  const [error, setError]   = useState<string | null>(null)

  const [name, setName]         = useState(initial.name)
  const [userId, setUserId]     = useState(initial.user_id)
  const [timezone, setTimezone] = useState(initial.timezone)
  const [language, setLanguage] = useState<'en' | 'es'>(initial.language)
  const [city, setCity]         = useState(initial.city)

  function handleSave() {
    setError(null)
    setSaved(false)
    start(async () => {
      const result = await updateDevice(deviceId, { name, user_id: userId, timezone, language, city })
      if (result.success) setSaved(true)
      else setError(result.error)
    })
  }

  function handleForceOffline() {
    if (!confirm('Mark this device as offline?')) return
    start(async () => {
      const result = await forceOffline(deviceId)
      if (!result.success) setError(result.error)
    })
  }

  function handleUnlink() {
    if (!confirm('Unlink this device? The firmware will lose access until the user re-pairs it.')) return
    start(async () => {
      const result = await unlinkDevice(deviceId)
      if (!result.success) setError(result.error)
    })
  }

  const labelClass = 'font-mono text-[10px] text-zinc-500 uppercase tracking-wider block mb-1.5'
  const inputClass = 'w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2.5 font-mono text-sm text-zinc-200 focus:outline-none focus:border-zinc-500 transition-colors'

  return (
    <div className="space-y-8">

      {/* Edit form */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-5">
        <p className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">Settings</p>

        {/* Name */}
        <div>
          <label className={labelClass}>Device name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className={inputClass}
          />
        </div>

        {/* Assigned user */}
        <div>
          <label className={labelClass}>Assigned user</label>
          <div className="relative">
            <select
              value={userId}
              onChange={e => setUserId(e.target.value)}
              className={inputClass + ' appearance-none pr-8 cursor-pointer'}
            >
              <option value="">— Unassigned —</option>
              {profiles.map(p => (
                <option key={p.id} value={p.id}>
                  {profileLabel(p)}{p.is_admin ? ' (admin)' : ''}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
          </div>
        </div>

        {/* Timezone */}
        <div>
          <label className={labelClass}>Timezone</label>
          <div className="relative">
            <select
              value={timezone}
              onChange={e => setTimezone(e.target.value)}
              className={inputClass + ' appearance-none pr-8 cursor-pointer'}
            >
              {TIMEZONES.map(tz => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
          </div>
        </div>

        {/* Language */}
        <div>
          <label className={labelClass}>Language</label>
          <div className="flex gap-2">
            {(['en', 'es'] as const).map(lang => (
              <button
                key={lang}
                type="button"
                onClick={() => setLanguage(lang)}
                className={`flex-1 py-2.5 rounded-md border font-mono text-sm font-semibold transition-colors duration-150
                  ${language === lang
                    ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                    : 'bg-zinc-950 border-zinc-700 text-zinc-400 hover:border-zinc-500'}`}
              >
                {lang === 'en' ? 'English' : 'Español'}
              </button>
            ))}
          </div>
        </div>

        {/* City */}
        <div>
          <label className={labelClass}>City <span className="text-zinc-600 normal-case">(optional)</span></label>
          <input
            type="text"
            value={city}
            onChange={e => setCity(e.target.value)}
            placeholder="e.g. Bogotá"
            className={inputClass}
          />
        </div>

        {error && (
          <p className="font-mono text-xs text-red-400 bg-red-950/30 border border-red-800/40 rounded-md px-3 py-2">
            {error}
          </p>
        )}
        {saved && (
          <p className="font-mono text-xs text-green-400">Saved.</p>
        )}

        <div className="flex justify-end pt-1">
          <button
            onClick={handleSave}
            disabled={isPending}
            className="px-5 py-2.5 rounded-md bg-amber-500 text-zinc-950 font-mono text-sm font-bold
                       hover:bg-amber-400 disabled:opacity-50 transition-colors"
          >
            {isPending ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>

      {/* Admin actions */}
      <div className="border border-zinc-800 rounded-xl p-6 space-y-3">
        <p className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest mb-4">Admin actions</p>

        {isOnline && (
          <button
            onClick={handleForceOffline}
            disabled={isPending}
            className="flex items-center gap-2 w-full px-4 py-3 rounded-lg border border-zinc-700
                       font-mono text-sm text-zinc-300 hover:border-zinc-500 hover:text-white
                       transition-colors disabled:opacity-40"
          >
            <WifiOff size={15} className="text-zinc-500" />
            Force offline
          </button>
        )}

        {isLinked && (
          <button
            onClick={handleUnlink}
            disabled={isPending}
            className="flex items-center gap-2 w-full px-4 py-3 rounded-lg border border-zinc-700
                       font-mono text-sm text-zinc-300 hover:border-red-700 hover:text-red-400
                       transition-colors disabled:opacity-40"
          >
            <Unlink size={15} className="text-zinc-500" />
            Unlink device
            <span className="text-zinc-600 text-xs ml-1">(clears api_key)</span>
          </button>
        )}

        {!isOnline && !isLinked && (
          <p className="font-mono text-xs text-zinc-600">No actions available — device is offline and unlinked.</p>
        )}
      </div>
    </div>
  )
}

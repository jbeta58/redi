/**
 * DeviceList — Client Component
 *
 * Renders the admin devices table and handles the "Add Device" modal.
 *
 * Props:
 *   devices  — all device rows fetched by the server page
 *   profiles — all user profiles for the "assign to user" dropdown
 *   currentUserId — the logged-in admin's own user ID
 */

'use client'

import { useState, useTransition } from 'react'
import { Monitor, Plus, Trash2, X, Wifi, WifiOff, ChevronDown } from 'lucide-react'
import { createDevice, deleteDevice } from './actions'

// ─── Types ────────────────────────────────────────────────────────────────────

type Device = {
  id: string
  name: string
  pairing_code: string
  is_online: boolean
  last_seen_at: Date | string | null
  timezone: string
  language: string
  city: string | null
  firmware_version: string | null
  created_at: Date | string
  user_id: string | null
}

type Profile = {
  id: string
  full_name: string | null
  is_admin: boolean
}

type Props = {
  devices: Device[]
  profiles: Profile[]
  currentUserId: string
}

// ─── Timezone list ─────────────────────────────────────────────────────────────
// Common timezones relevant to REDI's audience. Extend as needed.
const TIMEZONES = [
  'America/Bogota',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Sao_Paulo',
  'America/Argentina/Buenos_Aires',
  'America/Mexico_City',
  'Europe/Madrid',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Rome',
  'Asia/Tokyo',
  'Asia/Seoul',
  'Asia/Shanghai',
  'UTC',
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Formats a timestamp into a human-readable relative string.
 * e.g. "2 hours ago", "just now", "3 days ago"
 */
function formatRelative(dateStr: Date | string | null): string {
  if (!dateStr) return 'Never'
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

/**
 * Returns a display label for a profile.
 * Falls back to "User <short-id>" if full_name is empty.
 */
function profileLabel(p: Profile): string {
  if (p.full_name?.trim()) return p.full_name.trim()
  return `User ${p.id.slice(0, 6)}`
}

// ─── Add Device Modal ─────────────────────────────────────────────────────────

type ModalProps = {
  profiles: Profile[]
  onClose: () => void
  onCreated: () => void
}

function AddDeviceModal({ profiles, onClose, onCreated }: ModalProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [name, setName] = useState('')
  const [pairingCode, setPairingCode] = useState('')
  const [userId, setUserId] = useState('')
  const [timezone, setTimezone] = useState('America/Bogota')
  const [language, setLanguage] = useState<'en' | 'es'>('en')
  const [city, setCity] = useState('')

  // Generate a random 8-char alphanumeric pairing code
  function generateCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no I/O/0/1 to avoid confusion
    let code = ''
    for (let i = 0; i < 8; i++) {
      code += chars[Math.floor(Math.random() * chars.length)]
    }
    setPairingCode(code)
  }

  function handleSubmit() {
    setError(null)
    startTransition(async () => {
      const result = await createDevice({ name, pairing_code: pairingCode, user_id: userId, timezone, language, city })
      if (result.success) {
        onCreated()
        onClose()
      } else {
        setError(result.error)
      }
    })
  }

  // Label style reused across all form fields
  const labelClass = 'font-mono text-[10px] text-zinc-500 uppercase tracking-wider block mb-1.5'
  const inputClass = `
    w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2.5
    font-mono text-sm text-zinc-200
    focus:outline-none focus:border-zinc-500 transition-colors
  `

  return (
    // Backdrop — click outside to close
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-md shadow-2xl">

        {/* Modal header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-zinc-800">
          <h2 className="font-mono text-sm font-bold text-zinc-100 uppercase tracking-wider">
            Add Device
          </h2>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form body */}
        <div className="px-6 py-5 space-y-4">

          {/* Device name */}
          <div>
            <label className={labelClass}>Device name</label>
            <input
              type="text"
              placeholder="e.g. Living Room"
              value={name}
              onChange={e => setName(e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Pairing code */}
          <div>
            <label className={labelClass}>Pairing code</label>
            {/*
              The code is what gets "printed in the manual" and typed into
              the firmware's flash storage. It must be unique across all devices.
            */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. REDI-A3X7"
                value={pairingCode}
                onChange={e => setPairingCode(e.target.value.toUpperCase())}
                className={inputClass + ' flex-1'}
                maxLength={20}
              />
              <button
                type="button"
                onClick={generateCode}
                className="px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-md
                           font-mono text-xs text-zinc-400 hover:text-zinc-200
                           hover:bg-zinc-700 transition-colors whitespace-nowrap"
              >
                Generate
              </button>
            </div>
          </div>

          {/* Assign to user */}
          <div>
            <label className={labelClass}>Assign to user</label>
            <div className="relative">
              <select
                value={userId}
                onChange={e => setUserId(e.target.value)}
                className={inputClass + ' appearance-none pr-8 cursor-pointer'}
              >
                <option value="">— Select a user —</option>
                {profiles.map(p => (
                  <option key={p.id} value={p.id}>
                    {profileLabel(p)}{p.is_admin ? ' (admin)' : ''}
                  </option>
                ))}
              </select>
              {/* Custom dropdown arrow */}
              <ChevronDown
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
              />
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
              <ChevronDown
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
              />
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
                  className={`
                    flex-1 py-2.5 rounded-md border font-mono text-sm font-semibold
                    transition-colors duration-150
                    ${language === lang
                      ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                      : 'bg-zinc-950 border-zinc-700 text-zinc-400 hover:border-zinc-500'}
                  `}
                >
                  {lang === 'en' ? 'English' : 'Español'}
                </button>
              ))}
            </div>
          </div>

          {/* City (optional) */}
          <div>
            <label className={labelClass}>City <span className="text-zinc-600 normal-case">(optional)</span></label>
            <input
              type="text"
              placeholder="e.g. Bogotá"
              value={city}
              onChange={e => setCity(e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Error message */}
          {error && (
            <p className="font-mono text-xs text-red-400 bg-red-950/30 border border-red-800/40 rounded-md px-3 py-2">
              {error}
            </p>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-3 px-6 pb-5">
          <button
            onClick={onClose}
            className="px-4 py-2 font-mono text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="px-5 py-2.5 rounded-md bg-amber-500 text-zinc-950
                       font-mono text-sm font-bold
                       hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors duration-150"
          >
            {isPending ? 'Creating...' : 'Create device'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DeviceList({ devices, profiles, currentUserId }: Props) {
  const [showModal, setShowModal] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // Build a quick lookup: user_id → profile label
  const profileMap = Object.fromEntries(profiles.map(p => [p.id, profileLabel(p)]))

  function handleDelete(deviceId: string, deviceName: string) {
    if (!confirm(`Delete "${deviceName}"? This cannot be undone.`)) return
    setDeleteError(null)
    setDeletingId(deviceId)
    startTransition(async () => {
      const result = await deleteDevice(deviceId)
      setDeletingId(null)
      if (!result.success) setDeleteError(result.error)
    })
  }

  return (
    <>
      {/* Add device button */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-md bg-amber-500 text-zinc-950
                     font-mono text-sm font-bold
                     hover:bg-amber-400 transition-colors duration-150"
        >
          <Plus size={16} />
          Add device
        </button>
      </div>

      {/* Error from delete */}
      {deleteError && (
        <p className="font-mono text-xs text-red-400 mb-4">{deleteError}</p>
      )}

      {/* Empty state */}
      {devices.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-zinc-700 rounded-xl">
          <Monitor size={32} className="text-zinc-600 mx-auto mb-3" />
          <p className="font-mono text-sm text-zinc-500">No devices yet.</p>
          <p className="font-mono text-xs text-zinc-600 mt-1">Add the first one above.</p>
        </div>
      ) : (
        /* Devices table */
        <div className="rounded-xl border border-zinc-800 overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-4 py-2.5 bg-zinc-800/50 border-b border-zinc-700">
            {['Device', 'User', 'Status', 'Last seen', ''].map((h, i) => (
              <span key={i} className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider">
                {h}
              </span>
            ))}
          </div>

          {/* Device rows */}
          {devices.map(device => (
            <div
              key={device.id}
              className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 items-center
                         px-4 py-3.5 border-b border-zinc-800 last:border-0
                         hover:bg-zinc-800/30 transition-colors"
            >
              {/* Name + pairing code */}
              <div className="min-w-0">
                <p className="font-mono text-sm text-zinc-200 font-semibold truncate">
                  {device.name}
                </p>
                <p className="font-mono text-[11px] text-zinc-500 mt-0.5">
                  {device.pairing_code}
                  {device.city ? ` · ${device.city}` : ''}
                </p>
              </div>

              {/* Assigned user */}
              <span className="font-mono text-xs text-zinc-400 whitespace-nowrap">
                {device.user_id ? (profileMap[device.user_id] ?? 'Unknown') : '—'}
              </span>

              {/* Online / offline badge */}
              <span className={`
                flex items-center gap-1.5 font-mono text-[11px] whitespace-nowrap
                ${device.is_online ? 'text-green-400' : 'text-zinc-500'}
              `}>
                {device.is_online
                  ? <><Wifi size={12} /> Online</>
                  : <><WifiOff size={12} /> Offline</>
                }
              </span>

              {/* Last seen */}
              <span className="font-mono text-xs text-zinc-500 whitespace-nowrap">
                {formatRelative(device.last_seen_at)}
              </span>

              {/* Delete button */}
              <button
                onClick={() => handleDelete(device.id, device.name)}
                disabled={isPending && deletingId === device.id}
                className="text-zinc-600 hover:text-red-400 transition-colors disabled:opacity-30"
                aria-label={`Delete ${device.name}`}
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Create modal */}
      {showModal && (
        <AddDeviceModal
          profiles={profiles}
          onClose={() => setShowModal(false)}
          onCreated={() => {
            // Page auto-refreshes via revalidatePath in the server action
          }}
        />
      )}
    </>
  )
}

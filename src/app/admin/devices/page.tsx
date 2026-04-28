/**
 * Admin — Devices — /admin/devices
 *
 * Shows all REDI devices across all users.
 * Only reachable by admins — the dashboard layout verifies the role
 * and the middleware blocks unauthenticated access.
 *
 * For each device shows:
 *   - Device name
 *   - Owner (from profiles table)
 *   - Online / offline status + last seen time
 *   - Which apps are currently enabled (as chips)
 *
 * Server component — fetches data at request time, no client JS needed.
 */

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'

export const metadata = { title: 'Devices' }

export default async function AdminDevicesPage() {
  const supabase = await createServerSupabaseClient()

  // Auth + role guard
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) redirect('/dashboard/home')

  // Fetch all devices, joining the owner's profile for their name/email
  const { data: devices } = await supabase
    .from('devices')
    .select(`
      id,
      name,
      last_seen_at,
      ip_address,
      wifi_ssid,
      owner_id,
      profiles (
        full_name
      ),
      device_apps (
        is_enabled,
        apps (
          name,
          slug
        )
      )
    `)
    .order('created_at', { ascending: true })

  return (
    // p-6: comfortable padding on all sides
    // max-w-3xl: keeps content readable on very wide screens
    <div className="p-6 max-w-3xl">

      {/* ── Page header ─────────────────────────────── */}
      <div className="mb-6">
        <h1 className="font-mono text-lg font-semibold tracking-widest text-white uppercase">
          Devices
        </h1>
        <p className="text-zinc-500 text-sm mt-1">
          {devices?.length ?? 0} device{devices?.length !== 1 ? 's' : ''} registered
        </p>
      </div>

      {/* ── Device list ─────────────────────────────── */}
      {!devices || devices.length === 0 ? (
        // Empty state — no devices yet
        <div className="border border-zinc-800 rounded-lg p-8 text-center">
          <p className="text-zinc-500 font-mono text-sm">No devices registered yet</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {devices.map(device => {
            // A device is considered online if it polled within the last 10 minutes
            const lastSeen    = device.last_seen_at ? new Date(device.last_seen_at) : null
            const tenMinsAgo  = new Date(Date.now() - 10 * 60 * 1000)
            const isOnline    = lastSeen ? lastSeen > tenMinsAgo : false

            // Separate enabled and disabled apps for the chip row
            const enabledApps  = device.device_apps?.filter(da => da.is_enabled)  ?? []
            const disabledApps = device.device_apps?.filter(da => !da.is_enabled) ?? []

            // Owner display — prefer full_name, fall back to "—"
            const ownerName = (device.profiles as any)?.full_name ?? '—'

            return (
              <div
                key={device.id}
                // bg-zinc-900: card surface slightly lighter than the page bg
                // border border-zinc-800: subtle card edge
                // hover:border-zinc-700: lifts slightly on hover
                className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700
                           rounded-lg p-4 transition-colors duration-150"
              >
                {/* ── Card top row: name + status ─── */}
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <p className="font-mono font-semibold text-white text-sm tracking-wide">
                      {device.name}
                    </p>
                    <p className="text-zinc-500 text-xs font-mono mt-0.5">
                      {ownerName}
                    </p>
                  </div>

                  {/* Online / offline pill */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/*
                      The status dot:
                      - Green with a subtle ring when online
                      - Muted zinc when offline
                    */}
                    <span className={`
                      w-1.5 h-1.5 rounded-full shrink-0
                      ${isOnline
                        ? 'bg-green-400 ring-2 ring-green-400/20'
                        : 'bg-zinc-600'
                      }
                    `} />
                    <span className={`
                      font-mono text-xs
                      ${isOnline ? 'text-green-400' : 'text-zinc-500'}
                    `}>
                      {isOnline ? 'online' : 'offline'}
                    </span>
                  </div>
                </div>

                {/* ── Meta row: last seen, IP, WiFi ── */}
                <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3">
                  <span className="text-zinc-600 text-xs font-mono">
                    Last seen:{' '}
                    <span className="text-zinc-400">
                      {lastSeen
                        ? formatDistanceToNow(lastSeen, { addSuffix: true })
                        : 'never'
                      }
                    </span>
                  </span>
                  {device.ip_address && (
                    <span className="text-zinc-600 text-xs font-mono">
                      IP: <span className="text-zinc-400">{device.ip_address}</span>
                    </span>
                  )}
                  {device.wifi_ssid && (
                    <span className="text-zinc-600 text-xs font-mono">
                      WiFi: <span className="text-zinc-400">{device.wifi_ssid}</span>
                    </span>
                  )}
                </div>

                {/* ── App chips ───────────────────── */}
                {device.device_apps && device.device_apps.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {/* Enabled apps — amber tint */}
                    {enabledApps.map(da => (
                      <span
                        key={(da.apps as any)?.slug}
                        className="font-mono text-[10px] px-2 py-0.5 rounded
                                   bg-amber-500/10 text-amber-400/80
                                   border border-amber-500/20"
                      >
                        {(da.apps as any)?.name}
                      </span>
                    ))}
                    {/* Disabled apps — muted */}
                    {disabledApps.map(da => (
                      <span
                        key={(da.apps as any)?.slug}
                        className="font-mono text-[10px] px-2 py-0.5 rounded
                                   bg-zinc-800 text-zinc-600
                                   border border-zinc-700/50"
                      >
                        {(da.apps as any)?.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

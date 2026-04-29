/**
 * Dashboard Apps — /dashboard/apps
 *
 * Shows the full app rotation list for the user's device.
 * Each row has a drag handle, app name, config summary, gear icon, and toggle.
 *
 * Server component — fetches device + device_apps data.
 * Passes data to AppsList (client component) which handles
 * drag-to-reorder and toggle interactions.
 */

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import AppsList from './AppsList'
import Link from 'next/link'

export const metadata = { title: 'Apps' }

export default async function DashboardAppsPage() {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch the user's device with all its apps
  const { data: device } = await supabase
    .from('devices')
    .select(`
      id,
      name,
      rotation_duration_seconds,
      device_apps (
        id,
        position,
        is_enabled,
        config,
        apps (
          id,
          name,
          has_config
        )
      )
    `)
    .eq('user_id', user.id)
    .single()

  if (!device) {
    return (
      <div className="p-6 max-w-xl">
        <div className="mb-6">
          <h1 className="font-mono text-lg font-semibold tracking-widest text-white uppercase">
            Apps
          </h1>
        </div>
        <div className="border border-dashed border-zinc-800 rounded-lg p-10 text-center">
          <p className="font-mono text-sm text-zinc-500">No display connected yet</p>
          <p className="text-xs text-zinc-600 mt-2">
            Contact the admin to get your device set up
          </p>
        </div>
      </div>
    )
  }

  // Sort apps by position
  const sortedApps = [...(device.device_apps ?? [])].sort(
    (a, b) => a.position - b.position
  )

  return (
    <div className="p-6 max-w-xl">

      {/* ── Page header ──────────────────────────────── */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="font-mono text-lg font-semibold tracking-widest text-white uppercase">
            Apps
          </h1>
          <p className="text-zinc-500 text-sm mt-1 font-mono">
            {sortedApps.filter(a => a.is_enabled).length} active ·{' '}
            drag to reorder
          </p>
        </div>
      </div>

      {sortedApps.length === 0 ? (
        <div className="border border-dashed border-zinc-800 rounded-lg p-10 text-center">
          <p className="font-mono text-sm text-zinc-500">No apps configured</p>
        </div>
      ) : (
        <AppsList
          deviceId={device.id}
          apps={sortedApps.map(da => ({
            id: da.id,
            position: da.position,
            isEnabled: da.is_enabled,
            config: (da.config ?? {}) as Record<string, any>,
            appId: (da.apps as any)?.id,
            appName: (da.apps as any)?.name,
            hasConfig: (da.apps as any)?.has_config ?? false,
          }))}
        />
      )}

    </div>
  )
}

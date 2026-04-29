/**
 * Dashboard Settings — /dashboard/settings
 *
 * Lets the user configure device-level settings and their account.
 *
 * Device settings:
 *   - Language (EN / ES)
 *   - Main city (infers timezone for all clock apps)
 *   - Rotation duration (5–20 seconds)
 *   - Quiet hours (on/off, start/end time)
 *
 * Account settings:
 *   - Change password
 *
 * Server component — fetches current device settings.
 * SettingsForm handles all the interactive parts.
 */

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import SettingsForm from './SettingsForm'

export const metadata = { title: 'Settings' }

export default async function DashboardSettingsPage() {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch user's device settings
  const { data: device } = await supabase
    .from('devices')
    .select(`
      id,
      name,
      language,
      city,
      timezone,
      rotation_duration_seconds,
      night_mode_enabled,
      night_mode_start,
      night_mode_end
    `)
    .eq('user_id', user.id)
    .single()

  // Fetch profile for display name
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  return (
    <div className="p-6 max-w-lg">
      <div className="mb-6">
        <h1 className="font-mono text-lg font-semibold tracking-widest text-white uppercase">
          Settings
        </h1>
        {profile?.full_name && (
          <p className="text-zinc-500 text-sm mt-1 font-mono">
            {profile.full_name}
          </p>
        )}
      </div>

      <SettingsForm
        userId={user.id}
        device={device ?? null}
      />
    </div>
  )
}

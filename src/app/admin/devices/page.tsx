/**
 * /admin/devices — Device Management Page
 *
 * Server component. Fetches all devices (with their assigned user's email)
 * and all user profiles (for the "assign to user" dropdown in the create modal).
 * Passes data down to DeviceList, which handles the interactive UI.
 */

import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import DeviceList from './DeviceList'

export default async function AdminDevicesPage() {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch all devices, joining the assigned user's email from auth.users
  // We join via profiles since we can't query auth.users directly from client
  const { data: devices, error: devicesError } = await supabase
    .from('devices')
    .select(`
      id,
      name,
      pairing_code,
      is_online,
      last_seen_at,
      timezone,
      language,
      city,
      firmware_version,
      created_at,
      user_id
    `)
    .order('created_at', { ascending: false })

  if (devicesError) {
    console.error('Failed to fetch devices:', devicesError)
  }

  // Fetch all profiles so the admin can assign a device to a user.
  // We use the admin client (service role) to also get the user's email
  // from auth.users — but since we only have the browser client here,
  // we fetch profiles and rely on full_name + id for the dropdown.
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, full_name, is_admin')
    .order('full_name', { ascending: true })

  if (profilesError) {
    console.error('Failed to fetch profiles:', profilesError)
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="font-mono text-xl font-bold text-zinc-100 tracking-tight">
          Devices
        </h1>
        <p className="font-mono text-sm text-zinc-500 mt-1">
          {devices?.length ?? 0} device{devices?.length !== 1 ? 's' : ''} registered
        </p>
      </div>

      {/* DeviceList handles the table + create modal (client component) */}
      <DeviceList
        devices={devices ?? []}
        profiles={profiles ?? []}
        currentUserId={user.id}
      />
    </div>
  )
}

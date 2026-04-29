'use server'

/**
 * Apps Server Actions
 *
 * Handles toggling apps on/off and saving the reordered position list.
 * Both actions write to device_apps and revalidate the apps page.
 */

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

// ── Helper ────────────────────────────────────────────────────────────────────

async function getSupabaseAndVerifyDevice(deviceId: string) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Verify the device belongs to this user
  const { data: device } = await supabase
    .from('devices')
    .select('id')
    .eq('id', deviceId)
    .eq('user_id', user.id)
    .single()

  if (!device) throw new Error('Device not found')
  return supabase
}

// ── Actions ───────────────────────────────────────────────────────────────────

/**
 * Toggle a single app on or off.
 * Validates that at least one app remains enabled after the toggle.
 */
export async function toggleApp(
  deviceId: string,
  deviceAppId: string,
  isEnabled: boolean
) {
  const supabase = await getSupabaseAndVerifyDevice(deviceId)

  // If disabling, make sure at least one other app is still enabled
  if (!isEnabled) {
    const { data: enabledApps } = await supabase
      .from('device_apps')
      .select('id')
      .eq('device_id', deviceId)
      .eq('is_enabled', true)

    if ((enabledApps?.length ?? 0) <= 1) {
      throw new Error('At least one app must remain enabled')
    }
  }

  const { error } = await supabase
    .from('device_apps')
    .update({ is_enabled: isEnabled })
    .eq('id', deviceAppId)

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/apps')
  revalidatePath('/dashboard/home')
}

/**
 * Save a new app order after drag-and-drop reordering.
 * Receives an array of device_app ids in their new order
 * and writes the position index for each one.
 */
export async function reorderApps(
  deviceId: string,
  orderedIds: string[]
) {
  const supabase = await getSupabaseAndVerifyDevice(deviceId)

  // Update each app's position based on its index in the new order
  // Run all updates in parallel for speed
  await Promise.all(
    orderedIds.map((id, index) =>
      supabase
        .from('device_apps')
        .update({ position: index })
        .eq('id', id)
    )
  )

  revalidatePath('/dashboard/apps')
  revalidatePath('/dashboard/home')
}

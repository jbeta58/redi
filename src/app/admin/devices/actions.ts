/**
 * Server Actions — Admin Device Management
 *
 * createDevice: creates a new device row and assigns it to a user
 * deleteDevice: removes a device (cascades to device_apps, schedules, etc.)
 *
 * Both actions verify the caller is an admin before doing anything.
 */

'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/lib/supabase-server'

// ─── Types ────────────────────────────────────────────────────────────────────

export type CreateDeviceInput = {
  name: string
  pairing_code: string
  user_id: string
  timezone: string
  language: 'en' | 'es'
  city?: string
}

export type ActionResult =
  | { success: true }
  | { success: false; error: string }

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns the calling user's profile, or throws if unauthenticated / not admin.
 */
async function requireAdmin() {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) throw new Error('Not authorized')

  return supabase
}

// ─── Actions ──────────────────────────────────────────────────────────────────

/**
 * createDevice
 *
 * Creates a new device and assigns it to the selected user.
 * Pairing code must be unique — the DB has a unique constraint on it.
 */
export async function createDevice(input: CreateDeviceInput): Promise<ActionResult> {
  try {
    const supabase = await requireAdmin()

    // Validate required fields
    if (!input.name.trim()) return { success: false, error: 'Device name is required.' }
    if (!input.pairing_code.trim()) return { success: false, error: 'Pairing code is required.' }
    if (!input.user_id) return { success: false, error: 'A user must be selected.' }
    if (!input.timezone) return { success: false, error: 'Timezone is required.' }

    // Normalize pairing code to uppercase — firmware sends it in uppercase too
    const pairingCode = input.pairing_code.trim().toUpperCase()

    const { error } = await supabase
      .from('devices')
      .insert({
        name: input.name.trim(),
        pairing_code: pairingCode,
        user_id: input.user_id,
        timezone: input.timezone,
        language: input.language,
        city: input.city?.trim() || null,
      })

    if (error) {
      // Unique constraint violation on pairing_code
      if (error.code === '23505') {
        return { success: false, error: `Pairing code "${pairingCode}" is already in use.` }
      }
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/devices')
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

/**
 * deleteDevice
 *
 * Deletes a device by ID. Foreign key cascades handle child rows
 * (device_apps, schedules, birthday_entries, etc.) if your schema uses
 * ON DELETE CASCADE. If not, Supabase will return a FK violation error.
 */
export async function deleteDevice(deviceId: string): Promise<ActionResult> {
  try {
    const supabase = await requireAdmin()

    if (!deviceId) return { success: false, error: 'Device ID is required.' }

    const { error } = await supabase
      .from('devices')
      .delete()
      .eq('id', deviceId)

    if (error) return { success: false, error: error.message }

    revalidatePath('/admin/devices')
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

'use server'

/**
 * Settings Server Actions
 *
 * Handles saving device settings and changing the user's password.
 * Password change uses the service role key since it needs to update
 * auth.users directly.
 */

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// ── Device settings ───────────────────────────────────────────────────────────

export interface DeviceSettingsData {
  language: 'en' | 'es'
  city: string
  rotation_duration_seconds: number
  night_mode_enabled: boolean
  night_mode_start: string | null  // "HH:MM" or null
  night_mode_end: string | null    // "HH:MM" or null
}

export async function saveDeviceSettings(
  deviceId: string,
  data: DeviceSettingsData
) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Clamp duration between 5 and 20
  const duration = Math.min(20, Math.max(5, data.rotation_duration_seconds))

  const { error } = await supabase
    .from('devices')
    .update({
      language:                  data.language,
      city:                      data.city.trim() || null,
      rotation_duration_seconds: duration,
      night_mode_enabled:        data.night_mode_enabled,
      night_mode_start:          data.night_mode_enabled ? data.night_mode_start : null,
      night_mode_end:            data.night_mode_enabled ? data.night_mode_end : null,
    })
    .eq('id', deviceId)
    .eq('user_id', user.id)  // ensures user can only update their own device

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard/home')
}

// ── Password change ───────────────────────────────────────────────────────────

export async function changePassword(
  currentPassword: string,
  newPassword: string
) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  if (newPassword.length < 8) {
    throw new Error('Password must be at least 8 characters')
  }

  // Verify current password by attempting sign in
  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email:    user.email!,
    password: currentPassword,
  })

  if (verifyError) throw new Error('Current password is incorrect')

  // Update via admin client
  const admin = createAdminClient()
  const { error } = await admin.auth.admin.updateUserById(user.id, {
    password: newPassword,
  })

  if (error) throw new Error(error.message)
}

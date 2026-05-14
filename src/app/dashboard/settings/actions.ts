'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs'

export interface DeviceSettingsData {
  language: 'en' | 'es'
  city: string
  rotation_duration_seconds: number
  night_mode_enabled: boolean
  night_mode_start: string | null
  night_mode_end: string | null
}

export async function saveDeviceSettings(
  deviceId: string,
  data: DeviceSettingsData
) {
  const session = await auth()
  if (!session?.user) throw new Error('Not authenticated')

  const duration = Math.min(20, Math.max(5, data.rotation_duration_seconds))

  await prisma.device.updateMany({
    where: { id: deviceId, user_id: session.user.id },
    data: {
      language:                  data.language,
      city:                      data.city.trim() || null,
      rotation_duration_seconds: duration,
      night_mode_enabled:        data.night_mode_enabled,
      night_mode_start:          data.night_mode_enabled ? data.night_mode_start : null,
      night_mode_end:            data.night_mode_enabled ? data.night_mode_end : null,
    },
  })

  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard/home')
}

export async function changePassword(
  currentPassword: string,
  newPassword: string
) {
  const session = await auth()
  if (!session?.user) throw new Error('Not authenticated')

  if (newPassword.length < 8) {
    throw new Error('Password must be at least 8 characters')
  }

  const profile = await prisma.profile.findUnique({
    where:  { id: session.user.id },
    select: { password_hash: true },
  })

  if (!profile) throw new Error('Profile not found')

  const valid = await bcrypt.compare(currentPassword, profile.password_hash)
  if (!valid) throw new Error('Current password is incorrect')

  const hash = await bcrypt.hash(newPassword, 10)
  await prisma.profile.update({
    where: { id: session.user.id },
    data:  { password_hash: hash },
  })
}

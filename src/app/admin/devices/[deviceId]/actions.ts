'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export type ActionResult = { success: true } | { success: false; error: string }

async function requireAdmin() {
  const session = await auth()
  if (!session?.user) throw new Error('Not authenticated')
  const profile = await prisma.profile.findUnique({
    where:  { id: session.user.id },
    select: { is_admin: true },
  })
  if (!profile?.is_admin) throw new Error('Not authorized')
}

export type UpdateDeviceInput = {
  name:     string
  user_id:  string
  timezone: string
  language: 'en' | 'es'
  city:     string
}

export async function updateDevice(
  deviceId: string,
  input: UpdateDeviceInput
): Promise<ActionResult> {
  try {
    await requireAdmin()

    if (!input.name.trim())    return { success: false, error: 'Device name is required.' }
    if (!input.user_id)        return { success: false, error: 'A user must be selected.' }
    if (!input.timezone)       return { success: false, error: 'Timezone is required.' }

    await prisma.device.update({
      where: { id: deviceId },
      data: {
        name:     input.name.trim(),
        user_id:  input.user_id,
        timezone: input.timezone,
        language: input.language,
        city:     input.city.trim() || null,
      },
    })

    revalidatePath(`/admin/devices/${deviceId}`)
    revalidatePath('/admin/devices')
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

export async function forceOffline(deviceId: string): Promise<ActionResult> {
  try {
    await requireAdmin()
    await prisma.device.update({
      where: { id: deviceId },
      data:  { is_online: false },
    })
    revalidatePath(`/admin/devices/${deviceId}`)
    revalidatePath('/admin/devices')
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

export async function unlinkDevice(deviceId: string): Promise<ActionResult> {
  try {
    await requireAdmin()
    await prisma.device.update({
      where: { id: deviceId },
      data:  { api_key: null },
    })
    revalidatePath(`/admin/devices/${deviceId}`)
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

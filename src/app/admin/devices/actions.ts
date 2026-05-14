'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

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

async function requireAdmin() {
  const session = await auth()
  if (!session?.user) throw new Error('Not authenticated')

  const profile = await prisma.profile.findUnique({
    where:  { id: session.user.id },
    select: { is_admin: true },
  })

  if (!profile?.is_admin) throw new Error('Not authorized')
}

export async function createDevice(input: CreateDeviceInput): Promise<ActionResult> {
  try {
    await requireAdmin()

    if (!input.name.trim())         return { success: false, error: 'Device name is required.' }
    if (!input.pairing_code.trim()) return { success: false, error: 'Pairing code is required.' }
    if (!input.user_id)             return { success: false, error: 'A user must be selected.' }
    if (!input.timezone)            return { success: false, error: 'Timezone is required.' }

    const pairingCode = input.pairing_code.trim().toUpperCase()

    await prisma.device.create({
      data: {
        name:         input.name.trim(),
        pairing_code: pairingCode,
        user_id:      input.user_id,
        timezone:     input.timezone,
        language:     input.language,
        city:         input.city?.trim() || null,
      },
    })

    revalidatePath('/admin/devices')
    return { success: true }
  } catch (err: any) {
    if (err?.code === 'P2002') {
      const pairingCode = input.pairing_code.trim().toUpperCase()
      return { success: false, error: `Pairing code "${pairingCode}" is already in use.` }
    }
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

export async function deleteDevice(deviceId: string): Promise<ActionResult> {
  try {
    await requireAdmin()

    if (!deviceId) return { success: false, error: 'Device ID is required.' }

    await prisma.device.delete({ where: { id: deviceId } })

    revalidatePath('/admin/devices')
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

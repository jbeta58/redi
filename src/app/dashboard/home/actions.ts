'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function linkDevice(
  pairingCode: string
): Promise<{ success: true } | { success: false; error: string }> {
  const session = await auth()
  if (!session?.user) return { success: false, error: 'Not authenticated' }

  const code = pairingCode.trim().toUpperCase()
  if (!code) return { success: false, error: 'Enter your pairing code' }

  const device = await prisma.device.findFirst({
    where: { user_id: session.user.id, pairing_code: code },
    select: { id: true, api_key: true },
  })

  if (!device) return { success: false, error: 'Pairing code not found — check the code and try again' }
  if (device.api_key) return { success: false, error: 'Device is already linked' }

  // Generate a secure API key the firmware will use on every request
  const apiKey = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '')

  await prisma.device.update({
    where: { id: device.id },
    data:  { api_key: apiKey },
  })

  revalidatePath('/dashboard/home')
  return { success: true }
}

'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

async function verifyDeviceOwner(deviceId: string) {
  const session = await auth()
  if (!session?.user) throw new Error('Not authenticated')

  const device = await prisma.device.findFirst({
    where: { id: deviceId, user_id: session.user.id },
    select: { id: true },
  })

  if (!device) throw new Error('Device not found')
}

export async function toggleApp(
  deviceId: string,
  deviceAppId: string,
  isEnabled: boolean
) {
  await verifyDeviceOwner(deviceId)

  if (!isEnabled) {
    const enabledCount = await prisma.deviceApp.count({
      where: { device_id: deviceId, is_enabled: true },
    })
    if (enabledCount <= 1) {
      throw new Error('At least one app must remain enabled')
    }
  }

  await prisma.deviceApp.update({
    where: { id: deviceAppId },
    data:  { is_enabled: isEnabled },
  })

  revalidatePath('/dashboard/apps')
  revalidatePath('/dashboard/home')
}

export async function reorderApps(deviceId: string, orderedIds: string[]) {
  await verifyDeviceOwner(deviceId)

  await Promise.all(
    orderedIds.map((id, index) =>
      prisma.deviceApp.update({ where: { id }, data: { position: index } })
    )
  )

  revalidatePath('/dashboard/apps')
  revalidatePath('/dashboard/home')
}

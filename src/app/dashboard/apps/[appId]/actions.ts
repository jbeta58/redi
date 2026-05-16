'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

async function getVerifiedDevice(deviceId: string) {
  const session = await auth()
  if (!session?.user) throw new Error('Not authenticated')
  const device = await prisma.device.findFirst({
    where: { id: deviceId, user_id: session.user.id },
    select: { id: true },
  })
  if (!device) throw new Error('Device not found')
  return device
}

export async function saveAppConfig(
  deviceId: string,
  appId: string,
  config: Record<string, unknown>
): Promise<void> {
  await getVerifiedDevice(deviceId)

  await prisma.deviceApp.updateMany({
    where: { device_id: deviceId, app_id: appId },
    data: { config: config as object },
  })

  revalidatePath('/dashboard/apps')
  revalidatePath(`/dashboard/apps/${appId}`)
}

// ── Birthday entries ──────────────────────────────────────────────────────────

export interface BirthdayEntryInput {
  name: string
  birth_month: number
  birth_day: number
  birth_year: number | null
  show_in_birthday: boolean
  show_in_happy_birthday: boolean
}

export async function addBirthdayEntry(
  deviceId: string,
  data: BirthdayEntryInput
): Promise<void> {
  await getVerifiedDevice(deviceId)

  if (!data.name.trim()) throw new Error('Name is required')
  if (data.birth_month < 1 || data.birth_month > 12) throw new Error('Invalid month')
  if (data.birth_day < 1 || data.birth_day > 31) throw new Error('Invalid day')

  await prisma.birthdayEntry.create({
    data: {
      device_id:              deviceId,
      name:                   data.name.trim(),
      birth_month:            data.birth_month,
      birth_day:              data.birth_day,
      birth_year:             data.birth_year,
      show_in_birthday:       data.show_in_birthday,
      show_in_happy_birthday: data.show_in_happy_birthday,
    },
  })

  revalidatePath('/dashboard/apps/birthday')
  revalidatePath('/dashboard/apps/happy_birthday')
}

export async function deleteBirthdayEntry(
  deviceId: string,
  entryId: string
): Promise<void> {
  await getVerifiedDevice(deviceId)

  await prisma.birthdayEntry.deleteMany({
    where: { id: entryId, device_id: deviceId },
  })

  revalidatePath('/dashboard/apps/birthday')
  revalidatePath('/dashboard/apps/happy_birthday')
}

export async function updateBirthdayEntry(
  deviceId: string,
  entryId: string,
  data: Partial<BirthdayEntryInput>
): Promise<void> {
  await getVerifiedDevice(deviceId)

  await prisma.birthdayEntry.updateMany({
    where: { id: entryId, device_id: deviceId },
    data,
  })

  revalidatePath('/dashboard/apps/birthday')
  revalidatePath('/dashboard/apps/happy_birthday')
}

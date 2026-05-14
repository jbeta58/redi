'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs'

async function requireAdmin() {
  const session = await auth()
  if (!session?.user) throw new Error('Not authenticated')

  const profile = await prisma.profile.findUnique({
    where:  { id: session.user.id },
    select: { is_admin: true },
  })

  if (!profile?.is_admin) throw new Error('Not authorized')
}

export async function createUser(data: {
  email: string
  password: string
  full_name: string
}) {
  await requireAdmin()

  const password_hash = await bcrypt.hash(data.password, 10)

  await prisma.profile.create({
    data: {
      email:         data.email.trim().toLowerCase(),
      password_hash,
      full_name:     data.full_name.trim(),
      is_admin:      false,
    },
  })

  revalidatePath('/admin/users')
}

export async function updateUserName(userId: string, full_name: string) {
  await requireAdmin()

  await prisma.profile.update({
    where: { id: userId },
    data:  { full_name: full_name.trim() },
  })

  revalidatePath('/admin/users')
}

export async function resetUserPassword(userId: string, newPassword: string) {
  await requireAdmin()

  const password_hash = await bcrypt.hash(newPassword, 10)

  await prisma.profile.update({
    where: { id: userId },
    data:  { password_hash },
  })
}

'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export interface QuoteFormData {
  body_en:   string
  body_es:   string
  author:    string
  is_active: boolean
}

async function requireAdmin() {
  const session = await auth()
  if (!session?.user) throw new Error('Not authenticated')

  const profile = await prisma.profile.findUnique({
    where:  { id: session.user.id },
    select: { is_admin: true },
  })

  if (!profile?.is_admin) throw new Error('Not authorized')
}

export async function createQuote(data: QuoteFormData) {
  await requireAdmin()

  await prisma.quote.create({
    data: {
      body_en:   data.body_en.trim(),
      body_es:   data.body_es.trim(),
      author:    data.author.trim().toUpperCase(),
      is_active: data.is_active,
    },
  })

  revalidatePath('/admin/quotes')
}

export async function updateQuote(id: string, data: QuoteFormData) {
  await requireAdmin()

  await prisma.quote.update({
    where: { id },
    data: {
      body_en:   data.body_en.trim(),
      body_es:   data.body_es.trim(),
      author:    data.author.trim().toUpperCase(),
      is_active: data.is_active,
    },
  })

  revalidatePath('/admin/quotes')
}

export async function toggleQuoteActive(id: string, is_active: boolean) {
  await requireAdmin()

  await prisma.quote.update({ where: { id }, data: { is_active } })

  revalidatePath('/admin/quotes')
}

export async function deleteQuote(id: string) {
  await requireAdmin()

  await prisma.quote.delete({ where: { id } })

  revalidatePath('/admin/quotes')
}

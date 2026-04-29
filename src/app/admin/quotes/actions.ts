'use server'

/**
 * Quotes Server Actions
 *
 * These functions run on the server when called from the QuotesList
 * client component. They handle all database writes for quotes.
 *
 * 'use server' at the top means every exported function in this file
 * is a Server Action — callable from client components like a regular
 * async function, but executed securely on the server.
 */

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface QuoteFormData {
  body_en: string
  body_es: string
  author: string
  is_active: boolean
}

// ── Helpers ───────────────────────────────────────────────────────────────────

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

// ── Actions ───────────────────────────────────────────────────────────────────

export async function createQuote(data: QuoteFormData) {
  const supabase = await requireAdmin()

  const { error } = await supabase
    .from('quotes')
    .insert({
      body_en:   data.body_en.trim(),
      body_es:   data.body_es.trim(),
      author:    data.author.trim().toUpperCase(),
      is_active: data.is_active,
    })

  if (error) throw new Error(error.message)
  revalidatePath('/admin/quotes')
}

export async function updateQuote(id: string, data: QuoteFormData) {
  const supabase = await requireAdmin()

  const { error } = await supabase
    .from('quotes')
    .update({
      body_en:   data.body_en.trim(),
      body_es:   data.body_es.trim(),
      author:    data.author.trim().toUpperCase(),
      is_active: data.is_active,
    })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/admin/quotes')
}

export async function toggleQuoteActive(id: string, is_active: boolean) {
  const supabase = await requireAdmin()

  const { error } = await supabase
    .from('quotes')
    .update({ is_active })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/admin/quotes')
}

export async function deleteQuote(id: string) {
  const supabase = await requireAdmin()

  const { error } = await supabase
    .from('quotes')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/admin/quotes')
}

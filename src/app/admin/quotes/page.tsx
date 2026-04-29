/**
 * Admin — Quotes — /admin/quotes
 *
 * Lists all quotes with their EN/ES content, author, and active status.
 * Admins can add, edit, toggle active, and delete quotes.
 *
 * The page itself is a server component that fetches the list.
 * The add/edit/delete actions are handled by client components and
 * Server Actions defined at the bottom of this file.
 */

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import QuotesList from './QuotesList'

export const metadata = { title: 'Quotes' }

export default async function AdminQuotesPage() {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) redirect('/dashboard/home')

  const { data: quotes } = await supabase
    .from('quotes')
    .select('*')
    .order('created_at', { ascending: true })

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="font-mono text-lg font-semibold tracking-widest text-white uppercase">
          Quotes
        </h1>
        <p className="text-zinc-500 text-sm mt-1">
          {quotes?.length ?? 0} quote{quotes?.length !== 1 ? 's' : ''} · shown in rotation sequentially
        </p>
      </div>

      <QuotesList quotes={quotes ?? []} />
    </div>
  )
}

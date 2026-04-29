/**
 * Dashboard root — /dashboard
 *
 * Checks the user's role and redirects immediately to the right place:
 *   admin → /admin/devices   (all devices overview)
 *   user  → /dashboard/home  (their display summary)
 *
 * This page never renders any UI — it's a pure redirect gate.
 * The actual content lives in the role-specific routes.
 */

import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  console.log('profile lookup:', { profile, error, userId: user.id })

  if (profile?.is_admin === true) {
    redirect('/admin/devices')
  } else {
    redirect('/dashboard/home')
  }
}

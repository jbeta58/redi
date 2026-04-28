/**
 * Admin Layout — /admin and all sub-routes
 *
 * Identical shell to the dashboard layout — Sidebar, TopBar, BottomNav.
 * The role is always 'admin' here since only admins can reach /admin/*.
 * The middleware redirects non-admins before this layout even runs,
 * but we double-check with a Supabase auth call anyway.
 */

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import Sidebar from '@/components/Sidebar'
import TopBar from '@/components/TopBar'
import BottomNav from '@/components/BottomNav'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Verify admin — redirect non-admins away
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) redirect('/dashboard/home')

  // Read current pathname for active nav highlighting in Sidebar
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') ?? '/admin/devices'

  return (
    <div className="min-h-screen bg-zinc-900 flex">
      <Sidebar role="admin" pathname={pathname} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          {children}
        </main>
      </div>
      <BottomNav role="admin" />
    </div>
  )
}

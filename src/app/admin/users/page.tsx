/**
 * Admin — Users — /admin/users
 *
 * Lists all users (from profiles + auth.users).
 * Admin can:
 *   - See all users and their roles
 *   - Create new users (email + password + full name)
 *   - Edit a user's full name
 *   - Reset a user's password
 *
 * Creating users and resetting passwords requires the Supabase
 * Service Role key — these actions run in Server Actions only,
 * never in client-side code.
 */

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import UsersList from './UsersList'

export const metadata = { title: 'Users' }

export default async function AdminUsersPage() {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) redirect('/dashboard/home')

  // Fetch all profiles — admins can read all via the RLS policy we added
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, is_admin, created_at')
    .order('created_at', { ascending: true })

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="font-mono text-lg font-semibold tracking-widest text-white uppercase">
          Users
        </h1>
        <p className="text-zinc-500 text-sm mt-1">
          {profiles?.length ?? 0} user{profiles?.length !== 1 ? 's' : ''} registered
        </p>
      </div>

      <UsersList profiles={profiles ?? []} currentUserId={user.id} />
    </div>
  )
}

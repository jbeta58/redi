/**
 * Dashboard Page — /dashboard
 *
 * This is a server component (no 'use client' at the top).
 * It runs on the server, fetches data, and sends fully rendered
 * HTML to the browser — faster and more secure than loading data
 * in the browser after the page appears.
 *
 * The middleware already blocks unauthenticated users from reaching
 * this page, but we check auth here too as a second layer of defense.
 * Never rely on a single point of security.
 *
 * This is currently a placeholder — we'll build the real dashboard
 * UI in the next step.
 */

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  // Create the server-side Supabase client and get the current user.
  // This reads the session cookie set during login.
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Second auth check — if somehow no user, send to login.
  // redirect() in a server component immediately stops rendering
  // and sends the browser to the new URL.
  if (!user) redirect('/login')

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <h1 className="text-2xl font-bold tracking-widest">REDI</h1>
      {/* Show the logged-in user's email as a basic sanity check */}
      <p className="text-zinc-500 mt-1">Welcome, {user.email}</p>
    </main>
  )
}
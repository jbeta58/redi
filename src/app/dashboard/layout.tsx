/**
 * Dashboard Layout — /dashboard and all sub-routes
 *
 * Next.js automatically wraps every page under /dashboard with this layout.
 * It renders once and persists across navigation — only the page content
 * (children) re-renders when the user moves between routes.
 *
 * Responsibilities:
 *   1. Verify the user is authenticated (second check after middleware)
 *   2. Read the user's role from the profiles table
 *   3. Pass the role to Sidebar and BottomNav so they show the right nav items
 *   4. Assemble the full-screen shell: Sidebar (desktop) + TopBar + content + BottomNav (mobile)
 *
 * This is a server component — it runs on the server and has access to
 * Supabase directly. The child nav components receive role as a plain prop.
 *
 * Layout structure:
 *
 *   Desktop (md+):
 *   ┌──────────┬─────────────────────────┐
 *   │          │  TopBar (hidden)        │
 *   │ Sidebar  ├─────────────────────────┤
 *   │          │                         │
 *   │          │  <page content>         │
 *   │          │                         │
 *   └──────────┴─────────────────────────┘
 *
 *   Mobile:
 *   ┌─────────────────────────┐
 *   │  TopBar                 │  ← sticky
 *   ├─────────────────────────┤
 *   │                         │
 *   │  <page content>         │
 *   │                         │
 *   ├─────────────────────────┤
 *   │  BottomNav              │  ← fixed
 *   └─────────────────────────┘
 */

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import Sidebar from '@/components/Sidebar'
import TopBar from '@/components/TopBar'
import BottomNav from '@/components/BottomNav'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // ── Auth check ────────────────────────────────────────────────────────────
  // The middleware already redirects unauthenticated users, but we check here
  // too as a second layer. Defense in depth — never trust a single gate.
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // ── Role lookup ───────────────────────────────────────────────────────────
  // The profiles table has a `role` column set to 'admin' or 'user'.
  // We fetch it once here so both Sidebar and BottomNav get the same value
  // without each making their own database call.
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  // Default to 'user' if the profile row is missing — safe fallback
  const role: 'admin' | 'user' = profile?.is_admin === true ? 'admin' : 'user'

  // ── Current pathname ──────────────────────────────────────────────────────
  // We read the pathname server-side so Sidebar can highlight the active nav
  // item without needing usePathname() (which would force it to be a client
  // component). next/headers gives us the request URL on the server.
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') ?? '/dashboard'
  // Note: x-pathname is a custom header we add in middleware.ts (see below).
  // If it's missing for any reason, we fall back to /dashboard safely.

  return (
    // min-h-screen: the layout always fills the full viewport height
    // bg-zinc-900: the main content background — slightly lighter than the
    //   sidebar's zinc-950 so the sidebar reads as a distinct panel
    <div className="min-h-screen bg-zinc-900 flex">

      {/* ── Desktop sidebar ─────────────────────────────────────────────── */}
      {/*
        Sidebar is a server component that receives role + pathname as props.
        It's hidden on mobile via its own internal hidden md:flex classes.
      */}
      <Sidebar role={role} pathname={pathname} />

      {/* ── Right side: TopBar + content + BottomNav ──────────────────── */}
      {/*
        flex-1: this column takes all remaining width after the sidebar.
        flex flex-col: stacks TopBar, content, and the space for BottomNav vertically.
        min-w-0: prevents flex children from overflowing on narrow screens.
      */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Mobile top bar — hidden on desktop */}
        <TopBar />

        {/* ── Page content ──────────────────────────────────────────────── */}
        {/*
          flex-1: the content area grows to fill all remaining vertical space.
          overflow-y-auto: page content scrolls independently of the sidebar.
          pb-20 md:pb-0: on mobile, add bottom padding so content isn't hidden
            behind the fixed BottomNav (BottomNav is ~64px tall + safe area).
            On desktop there's no BottomNav so no padding needed.
        */}
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          {children}
        </main>

      </div>

      {/* ── Mobile bottom nav ─────────────────────────────────────────── */}
      {/*
        BottomNav is a client component (needs usePathname) but receives
        role as a plain prop from this server component.
        It positions itself with fixed bottom-0 internally.
      */}
      <BottomNav role={role} />

    </div>
  )
}

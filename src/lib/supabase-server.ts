/**
 * Server-side Supabase client
 *
 * This client runs on the server only — never in the browser. It is used
 * in server components, API routes, and middleware.
 *
 * The key difference from the browser client is how it handles cookies.
 * On the server we don't have access to document.cookie like a browser does.
 * Instead we use Next.js's cookies() API to read and write HTTP cookies,
 * which is how Supabase tracks who is logged in between page loads.
 */


import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createServerSupabaseClient() {
    // Get a handle to the current request's cookies.
    // This is async in newer versions of Next.js.
    const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
        // Teach Supabase how to read and write cookies in this environment.
        // Supabase doesn't know it's running inside Next.js so we provide
        // these two functions as an adapter.
        cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        // Called by Supabase when it needs to read the current session
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll can be called from a Server Component where cookies
            // are read-only. The try/catch silently ignores that case —
            // the middleware handles refreshing sessions in those situations.
          }
        },
      },
    }
  )
}
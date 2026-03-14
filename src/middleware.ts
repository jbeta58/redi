/**
 * Next.js Middleware — Route Protection
 *
 * This file is special — Next.js runs it automatically on every request
 * before the page loads. Think of it as a security guard at the entrance.
 *
 * It does two things:
 *   1. Redirects unauthenticated users away from protected pages
 *   2. Redirects already-logged-in users away from the login page
 *
 * It also refreshes the Supabase session on every request, which keeps
 * the user logged in as long as they're actively using the app.
 *
 * IMPORTANT: This file must live at src/middleware.ts — Next.js looks
 * for it specifically at the root of the src/ folder.
 */

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) { 
  // Start by assuming we'll let the request through normally.
  // We'll replace this with a redirect if auth checks fail.
  let supabaseResponse = NextResponse.next({ request })

  // Create a Supabase client adapted for middleware.
  // Middleware has its own request/response cycle so it needs
  // a slightly different cookie setup than the server client.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          // Read cookies from the incoming request
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Write cookies to both the request and the response.
          // Both need updating so the session stays consistent
          // throughout the rest of the request lifecycle.
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set({name, value, ...options})
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Check if there is a logged-in user for this request.
  // Supabase reads the session cookie set during login to determine this.
  // The unusual destructuring { data: { user } } just pulls the user
  // object out of Supabase's nested response shape.
  const { data: { user } } = await supabase.auth.getUser()

  // Identify what kind of page is being requested
  const isAuthPage = request.nextUrl.pathname.startsWith('/login')
  const isDashboard = request.nextUrl.pathname.startsWith('/dashboard')

  // Rule 1: Not logged in and trying to reach a protected page → go to login
  if (!user && isDashboard) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Rule 2: Already logged in and trying to reach the login page → go to dashboard
  // (no point showing the login page to someone already authenticated)
  if (user && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // All checks passed — let the request through
  return supabaseResponse
}

// Tell Next.js which URL paths should trigger this middleware.
// Without this, middleware would run on every request including
// static files, images, fonts, and API calls — very wasteful.
//
// '/dashboard/:path*' matches /dashboard and anything under it
// e.g. /dashboard/devices, /dashboard/settings, etc.
export const config = {
  matcher: ['/dashboard/:path*', '/login'],
}
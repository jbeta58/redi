/**
 * Next.js Middleware — Route Protection + Pathname Header
 *
 * Runs automatically on every matched request before the page loads.
 *
 * Does three things:
 *   1. Refreshes the Supabase session cookie on every request
 *   2. Redirects unauthenticated users away from protected pages → /login
 *   3. Redirects logged-in users away from /login → /dashboard
 *   4. Forwards the current pathname as x-pathname header so server
 *      components (like the dashboard layout) can read it without
 *      needing usePathname() — which only works in client components.
 */

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Start by cloning the request headers so we can add our custom header
  // while still passing everything else through unchanged.
  const requestHeaders = new Headers(request.headers)

  // Forward the pathname so server components can read it via next/headers.
  // This avoids forcing layout components to be client components just to
  // know which route is currently active.
  requestHeaders.set('x-pathname', request.nextUrl.pathname)

  let supabaseResponse = NextResponse.next({
    request: { headers: requestHeaders },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Write cookies to both request and response so the session stays
          // consistent throughout the full request lifecycle.
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set({ name, value, ...options })
          )
          supabaseResponse = NextResponse.next({
            request: { headers: requestHeaders },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh the session — this keeps the user logged in as long as they're
  // actively using the app. Must be called before any redirect checks.
  const { data: { user } } = await supabase.auth.getUser()

  const isAuthPage  = request.nextUrl.pathname.startsWith('/login')
  const isDashboard = request.nextUrl.pathname.startsWith('/dashboard')
  const isAdmin     = request.nextUrl.pathname.startsWith('/admin')
  const isProtected = isDashboard || isAdmin

  // Rule 1: Not logged in, trying to reach a protected route → send to login
  if (!user && isProtected) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Rule 2: Already logged in, trying to reach the login page → send to dashboard
  if (user && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // All checks passed — let the request through with our extra header attached
  return supabaseResponse
}

export const config = {
  // Run middleware on dashboard routes, admin routes, and the login page.
  // Excludes static files, images, fonts, and _next internals automatically.
  matcher: ['/dashboard/:path*', '/admin/:path*', '/login'],
}

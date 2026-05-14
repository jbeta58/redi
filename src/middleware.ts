import NextAuth from 'next-auth'
import { authConfig } from '@/lib/auth.config'
import { NextResponse } from 'next/server'

const { auth } = NextAuth(authConfig)

export default auth((request) => {
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', request.nextUrl.pathname)

  const user = request.auth?.user ?? null

  const isAuthPage  = request.nextUrl.pathname.startsWith('/login')
  const isDashboard = request.nextUrl.pathname.startsWith('/dashboard')
  const isAdmin     = request.nextUrl.pathname.startsWith('/admin')
  const isProtected = isDashboard || isAdmin

  if (!user && isProtected) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next({ request: { headers: requestHeaders } })
})

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/login'],
}

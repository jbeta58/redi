/**
 * Auth Callback Route — /auth/callback
 *
 * Supabase redirects here after email confirmation and password reset links.
 * It receives a `code` query parameter, exchanges it for a session cookie,
 * then sends the user to the right place.
 */

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createServerSupabaseClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(`${origin}${next}`)
}
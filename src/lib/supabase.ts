/**
 * Browser-side Supabase client
 *
 * This client runs in the user's browser and is used in client components
 * (files with 'use client' at the top). It handles things like login forms
 * where the user is interacting directly with the page.
 *
 * It uses the public anon key which is safe to expose in the browser —
 * Supabase's Row Level Security policies are what actually protect the data.
 */

import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    // These values come from .env.local
    // NEXT_PUBLIC_ prefix means Next.js will expose them to the browser
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
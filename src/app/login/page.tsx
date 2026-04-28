/**
 * Login Page — /login
 *
 * Client component — handles user input and calls Supabase Auth.
 *
 * The login flow:
 *   1. User enters email + password and submits the form
 *   2. We call Supabase Auth directly from the browser
 *   3. On success: Next.js navigates to /dashboard
 *   4. On failure: show a generic error message
 */

'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)

  const router   = useRouter()
  const supabase = createClient()

  async function handleLogin() {
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      // Generic message — never reveal whether the email or password was wrong
      setError('Invalid email or password')
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-black">
      <div className="w-full max-w-sm px-6">

        {/* Branding */}
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold tracking-widest text-white font-mono">
            REDI
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            RGB LED Display Infrastructure
          </p>
        </div>

        {/*
          Using a real <form> element so that:
          - The browser recognises the password field correctly (no console warning)
          - Pressing Enter in either field submits the form naturally
          - e.preventDefault() stops the browser doing a full page reload
        */}
        <form
          onSubmit={e => { e.preventDefault(); handleLogin() }}
          className="flex flex-col gap-4"
        >
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoComplete="email"
            required
            className="w-full px-4 py-3 rounded-lg bg-zinc-900 border border-zinc-700
                       text-white placeholder-zinc-500 focus:outline-none
                       focus:border-zinc-400 transition"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            className="w-full px-4 py-3 rounded-lg bg-zinc-900 border border-zinc-700
                       text-white placeholder-zinc-500 focus:outline-none
                       focus:border-zinc-400 transition"
          />

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-white text-black font-semibold
                       hover:bg-zinc-200 transition disabled:opacity-50
                       disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

      </div>
    </main>
  )
}
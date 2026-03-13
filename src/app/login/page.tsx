/**
 * Login Page — /login
 *
 * This is a client component because it needs to respond to user
 * interactions (typing, button clicks) and manage form state.
 * Server components can't do any of that.
 *
 * The login flow:
 *   1. User enters email + password and clicks Sign in
 *   2. We call Supabase Auth directly from the browser
 *   3. Supabase checks the credentials and returns a session or an error
 *   4. On success: navigate to /dashboard
 *   5. On failure: show a generic error message
 */

'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  // Form field values — update as the user types
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  
  // Error message to show if login fails (null = no error)
  const [error, setError] = useState<string | null>(null)
  
  // Tracks whether a login request is in progress.
  // Used to disable the button and show "Signing in..." to prevent
  // the user from submitting the form multiple times.
  const [loading, setLoading] = useState(false)
  
  // Next.js hook for programmatic navigation (like a smart redirect)
  const router = useRouter()
  
  // Browser-side Supabase client — safe to use here in a client component
  const supabase = createClient()

  async function handleLogin() {
    setLoading(true)
    setError(null) // Clear any previous error before trying again

    // Ask Supabase to verify the credentials.
    // On success it sets a session cookie automatically.
    // On failure it returns an error object.
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      // Always show a generic message — never reveal whether the email
      // exists or the password was wrong, as that helps attackers.
      setError('Invalid email or password')
      setLoading(false)
      return
    }

    // Login succeeded — navigate to the dashboard.
    // The middleware will allow this now that a session cookie exists.
    router.push('/dashboard')
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-black">
      <div className="w-full max-w-sm px-6">

        {/* Logo / branding */}
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold tracking-widest text-white">REDI</h1>
          <p className="text-zinc-500 text-sm mt-1">RGB LED Display Infrastructure</p>
        </div>

        {/* Login form */}
        <div className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            // onChange fires on every keystroke and updates the email state
            onChange={e => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-zinc-900 border border-zinc-700 
                       text-white placeholder-zinc-500 focus:outline-none 
                       focus:border-zinc-400 transition"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            // Allow submitting the form by pressing Enter — better UX
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            className="w-full px-4 py-3 rounded-lg bg-zinc-900 border border-zinc-700 
                       text-white placeholder-zinc-500 focus:outline-none 
                       focus:border-zinc-400 transition"
          />

          {/* Only renders if there is an error to show */}
          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <button
            onClick={handleLogin}
            // Disabled while loading to prevent duplicate requests
            disabled={loading}
            className="w-full py-3 rounded-lg bg-white text-black font-semibold 
                       hover:bg-zinc-200 transition disabled:opacity-50 
                       disabled:cursor-not-allowed"
          >
            {/* Button label changes to give the user feedback */}
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </div>

      </div>
    </main>
  )
}
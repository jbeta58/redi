'use server'

/**
 * Users Server Actions
 *
 * Creating users and resetting passwords requires the Supabase Admin client
 * which uses the SERVICE_ROLE_KEY — a secret key that bypasses RLS and can
 * manage auth.users directly. This key must NEVER be used in client components
 * or exposed to the browser. Server Actions are the safe place for this.
 *
 * NEXT_PUBLIC_* env vars are visible in the browser.
 * SUPABASE_SERVICE_ROLE_KEY has no NEXT_PUBLIC_ prefix — server only.
 */

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

// ── Admin client (service role) ───────────────────────────────────────────────

/**
 * Creates a Supabase client with the service role key.
 * This client bypasses RLS and can manage auth.users.
 * Only used server-side inside Server Actions.
 */
function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function requireAdmin() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) throw new Error('Not authorized')
}

// ── Actions ───────────────────────────────────────────────────────────────────

export async function createUser(data: {
  email: string
  password: string
  full_name: string
}) {
  await requireAdmin()
  const admin = createAdminClient()

  // Create the auth.users record
  const { data: created, error: authError } = await admin.auth.admin.createUser({
    email:           data.email,
    password:        data.password,
    email_confirm:   true, // skip email confirmation — admin is creating the account
  })

  if (authError) throw new Error(authError.message)
  if (!created.user) throw new Error('User creation failed')

  // Create the matching profiles record
  // (Supabase doesn't do this automatically — we manage it ourselves)
  const { error: profileError } = await admin
    .from('profiles')
    .insert({
      id:        created.user.id,
      full_name: data.full_name.trim(),
      is_admin:  false,
    })

  if (profileError) throw new Error(profileError.message)

  revalidatePath('/admin/users')
}

export async function updateUserName(userId: string, full_name: string) {
  await requireAdmin()
  const supabase = await createServerSupabaseClient()

  const { error } = await supabase
    .from('profiles')
    .update({ full_name: full_name.trim() })
    .eq('id', userId)

  if (error) throw new Error(error.message)
  revalidatePath('/admin/users')
}

export async function resetUserPassword(userId: string, newPassword: string) {
  await requireAdmin()
  const admin = createAdminClient()

  const { error } = await admin.auth.admin.updateUserById(userId, {
    password: newPassword,
  })

  if (error) throw new Error(error.message)
  // No revalidatePath needed — password change doesn't affect the UI list
}

/**
 * SignOutButton
 *
 * Signs the user out via Supabase Auth and redirects to /login.
 *
 * Must be 'use client' because it responds to a click event.
 *
 * Props:
 *   variant='full'  — icon + label (used in Sidebar)
 *   variant='icon'  — icon only (used in TopBar on mobile)
 */

'use client'

import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'

interface Props {
  variant?: 'icon' | 'full'
}

export default function SignOutButton({ variant = 'full' }: Props) {
  const supabase = createClient()
  const router = useRouter()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (variant === 'icon') {
    return (
      <button
        onClick={handleSignOut}
        title="Sign out"
        // p-2: touch-friendly tap area
        // hover:text-red-400: red tint signals a destructive action
        className="p-2 text-zinc-500 hover:text-red-400 transition-colors duration-150"
      >
        <LogOut size={16} />
      </button>
    )
  }

  return (
    <button
      onClick={handleSignOut}
      // w-full so it fills the sidebar nav column like the other nav items
      // group lets child elements react to hover via group-hover:
      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-md
                 text-zinc-500 hover:text-red-400 hover:bg-red-950/20
                 transition-all duration-150 text-sm group"
    >
      <LogOut size={15} className="shrink-0" />
      <span className="font-mono tracking-wide">Sign out</span>
    </button>
  )
}

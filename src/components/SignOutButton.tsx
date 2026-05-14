'use client'

import { signOut } from 'next-auth/react'
import { LogOut } from 'lucide-react'

interface Props {
  variant?: 'icon' | 'full'
}

export default function SignOutButton({ variant = 'full' }: Props) {
  function handleSignOut() {
    signOut({ callbackUrl: '/login' })
  }

  if (variant === 'icon') {
    return (
      <button
        onClick={handleSignOut}
        title="Sign out"
        className="p-2 text-zinc-500 hover:text-red-400 transition-colors duration-150"
      >
        <LogOut size={16} />
      </button>
    )
  }

  return (
    <button
      onClick={handleSignOut}
      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-md
                 text-zinc-500 hover:text-red-400 hover:bg-red-950/20
                 transition-all duration-150 text-sm group"
    >
      <LogOut size={15} className="shrink-0" />
      <span className="font-mono tracking-wide">Sign out</span>
    </button>
  )
}

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import SignOutButton from '@/components/SignOutButton'
import {
  Monitor,
  MessageSquare,
  Users,
  Home,
  LayoutGrid,
  Settings,
} from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
}

const adminNav: NavItem[] = [
  { label: 'Devices', href: '/admin/devices',  icon: Monitor },
  { label: 'Quotes',  href: '/admin/quotes',   icon: MessageSquare },
  { label: 'Users',   href: '/admin/users',    icon: Users },
]

const userNav: NavItem[] = [
  { label: 'Home',     href: '/dashboard',          icon: Home },
  { label: 'Apps',     href: '/dashboard/apps',     icon: LayoutGrid },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
]

interface Props {
  role: 'admin' | 'user'
}

export default function Sidebar({ role }: Props) {
  const pathname = usePathname()
  const nav = role === 'admin' ? adminNav : userNav

  return (
    <aside className="hidden md:flex flex-col w-52 shrink-0 min-h-screen
                      bg-zinc-950 border-r border-zinc-800/50">

      {/* ── Wordmark ──────────────────────────────── */}
      <div className="px-5 py-5 border-b border-zinc-800/50">
        <p className="font-mono text-lg font-bold tracking-[0.3em] text-white leading-none">
          REDI
        </p>
        <p className="font-mono text-[9px] text-amber-500/60 tracking-[0.2em] uppercase mt-1">
          Display Control
        </p>
      </div>

      {/* ── Nav items ─────────────────────────────── */}
      <nav className="flex-1 px-2 py-3 flex flex-col gap-0.5">
        {nav.map(({ label, href, icon: Icon }) => {
          const isActive = href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname.startsWith(href)

          return (
            <Link
              key={href}
              href={href}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-md
                text-sm font-mono tracking-wide
                transition-all duration-150
                ${isActive
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 border border-transparent'
                }
              `}
            >
              <Icon
                size={15}
                className={`shrink-0 transition-colors duration-150 ${
                  isActive ? 'text-amber-400' : 'text-zinc-500'
                }`}
              />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* ── Sign out ──────────────────────────────── */}
      <div className="px-2 py-3 border-t border-zinc-800/50">
        <SignOutButton variant="full" />
      </div>

    </aside>
  )
}

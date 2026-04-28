/**
 * BottomNav — mobile tab bar
 *
 * Only visible on mobile (md:hidden).
 * Fixed to the bottom of the viewport — always reachable by thumb.
 *
 * Shows different nav items depending on the user's role:
 *   Admin: Devices · Quotes · Users
 *   User:  Home · Apps · Settings
 *
 * Must be 'use client' because usePathname() only works on the client.
 * The role prop is passed down from the dashboard layout (a server component
 * that already knows the role from the Supabase session).
 */

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
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

export default function BottomNav({ role }: Props) {
  // usePathname returns the current URL path — used to highlight the active tab
  const pathname = usePathname()
  const nav = role === 'admin' ? adminNav : userNav

  return (
    // md:hidden: disappears on desktop
    // fixed bottom-0: pinned to the bottom of the viewport at all times
    // z-40: above regular content, below modals/toasts
    // safe-area: pb-safe would need Tailwind plugin; inline style handles iPhone notch
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40
                 bg-zinc-950/90 backdrop-blur-sm
                 border-t border-zinc-800/50"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {/*
        grid with one equal column per nav item.
        Three items → grid-cols-3.
        Using a dynamic className here is fine because Tailwind purges
        based on static strings — but since we always have exactly 3 items,
        grid-cols-3 is always correct.
      */}
      <div className="grid grid-cols-3">
        {nav.map(({ label, href, icon: Icon }) => {
          // Same active logic as Sidebar — exact match for root, prefix for sub-routes
          const isActive = href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname.startsWith(href)

          return (
            <Link
              key={href}
              href={href}
              // flex-col: icon stacked above label
              // py-3: tall enough for comfortable thumb tapping (min 44px target)
              className="flex flex-col items-center justify-center py-3 gap-1"
            >
              <Icon
                size={20}
                // Active = amber accent, inactive = muted zinc
                className={`transition-colors duration-150 ${
                  isActive ? 'text-amber-400' : 'text-zinc-500'
                }`}
              />
              <span
                className={`font-mono text-[10px] tracking-wide transition-colors duration-150 ${
                  isActive ? 'text-amber-400' : 'text-zinc-500'
                }`}
              >
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

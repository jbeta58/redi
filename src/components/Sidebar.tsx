/**
 * Sidebar — desktop navigation
 *
 * Only visible on md+ screens (hidden on mobile — BottomNav handles mobile).
 * Receives the user's role so it can show the correct nav items.
 *
 * Admin nav:    Devices · Quotes · Users
 * User nav:     Home · Apps · Settings
 *
 * Structure:
 *   ┌──────────────┐
 *   │  REDI        │  ← wordmark + tagline
 *   │  Display...  │
 *   ├──────────────┤
 *   │  [nav items] │  ← grows to fill height
 *   ├──────────────┤
 *   │  Sign out    │  ← pinned to bottom
 *   └──────────────┘
 *
 * Server component — no interactivity here.
 * SignOutButton handles its own client-side click.
 */

import Link from 'next/link'
import SignOutButton from '@/components/SignOutButton'
import {
  Monitor,      // Devices (admin)
  MessageSquare,// Quotes (admin)
  Users,        // Users (admin)
  Home,         // Home (user)
  LayoutGrid,   // Apps (user)
  Settings,     // Settings (user)
} from 'lucide-react'

// Nav item shape
interface NavItem {
  label: string
  href: string
  icon: React.ElementType
}

// Admin sees all devices, manages quotes and users — no device of their own
const adminNav: NavItem[] = [
  { label: 'Devices', href: '/admin/devices',  icon: Monitor },
  { label: 'Quotes',  href: '/admin/quotes',   icon: MessageSquare },
  { label: 'Users',   href: '/admin/users',    icon: Users },
]

// Regular user sees their display summary, manages apps, and account settings
const userNav: NavItem[] = [
  { label: 'Home',     href: '/dashboard',          icon: Home },
  { label: 'Apps',     href: '/dashboard/apps',     icon: LayoutGrid },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
]

interface Props {
  role: 'admin' | 'user'
  // The current pathname is passed in from the layout (a server component)
  // so we can highlight the active nav item without usePathname() here
  pathname: string
}

export default function Sidebar({ role, pathname }: Props) {
  const nav = role === 'admin' ? adminNav : userNav

  return (
    // hidden: invisible on mobile — BottomNav takes over there
    // md:flex: visible as a vertical column on medium+ screens
    // w-52: 208px — wide enough for icon + label, narrow enough not to crowd content
    // shrink-0: never squish the sidebar when the content area is wide
    // min-h-screen: always fills the full viewport height
    <aside className="hidden md:flex flex-col w-52 shrink-0 min-h-screen
                      bg-zinc-950 border-r border-zinc-800/50">

      {/* ── Wordmark ──────────────────────────────── */}
      <div className="px-5 py-5 border-b border-zinc-800/50">
        {/*
          REDI in wide-tracked monospace — mirrors the physical dot-matrix display.
          tracking-[0.3em] = exaggerated letter-spacing for the retro LED feel.
        */}
        <p className="font-mono text-lg font-bold tracking-[0.3em] text-white leading-none">
          REDI
        </p>
        {/*
          Amber tagline — amber chosen to evoke vintage LED/CRT glow.
          opacity-60 so it's present but doesn't compete with nav items.
        */}
        <p className="font-mono text-[9px] text-amber-500/60 tracking-[0.2em] uppercase mt-1">
          Display Control
        </p>
      </div>

      {/* ── Nav items ─────────────────────────────── */}
      {/*
        flex-1 pushes the sign-out footer to the bottom no matter how few items there are.
        gap-0.5 gives each item just enough breathing room without feeling loose.
      */}
      <nav className="flex-1 px-2 py-3 flex flex-col gap-0.5">
        {nav.map(({ label, href, icon: Icon }) => {
          /*
           * Active detection:
           * - For /dashboard (Home), match exactly — otherwise /dashboard/apps
           *   would also highlight Home.
           * - For all other routes, match if the pathname starts with the href.
           */
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
                // Active icon uses amber; inactive uses muted zinc
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

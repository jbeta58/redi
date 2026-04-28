/**
 * TopBar — mobile header
 *
 * Only visible on mobile (md:hidden).
 * Shows the REDI wordmark on the left and a sign-out icon on the right.
 *
 * Sticky so it stays pinned as the user scrolls content beneath it.
 * backdrop-blur gives a frosted glass effect — content scrolls under it.
 *
 * Server component — SignOutButton handles its own interactivity.
 */

import SignOutButton from '@/components/SignOutButton'

export default function TopBar() {
  return (
    // md:hidden: disappears on desktop where the Sidebar is visible
    // sticky top-0 z-40: pinned to the top of the viewport, above content
    // bg-zinc-950/90 backdrop-blur-sm: semi-transparent frosted glass
    // border-b: subtle bottom edge to separate header from page content
    <header className="md:hidden sticky top-0 z-40
                       bg-zinc-950/90 backdrop-blur-sm
                       border-b border-zinc-800/50
                       px-4 py-3
                       flex items-center justify-between">

      {/* Left: REDI wordmark, same style as sidebar */}
      <div>
        <p className="font-mono text-base font-bold tracking-[0.3em] text-white leading-none">
          REDI
        </p>
        <p className="font-mono text-[8px] text-amber-500/60 tracking-[0.2em] uppercase mt-0.5">
          Display Control
        </p>
      </div>

      {/* Right: compact sign-out — icon only, no label (space is tight on mobile) */}
      <SignOutButton variant="icon" />

    </header>
  )
}

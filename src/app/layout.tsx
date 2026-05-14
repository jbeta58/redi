/**
 * Root Layout — wraps every page in the app
 *
 * This is the outermost layout. It renders exactly once and never
 * re-renders between navigations. It sets up:
 *   - Page metadata (title, description)
 *   - Font loading via next/font (zero layout shift, self-hosted)
 *   - The html and body elements that every page lives inside
 *
 * next/font/google downloads the fonts at build time and serves them
 * from our own domain — no third-party font requests at runtime,
 * no GDPR issues, no flash of unstyled text.
 */

import type { Metadata } from 'next'
import { JetBrains_Mono, Inter } from 'next/font/google'
import './globals.css'
import Providers from '@/components/Providers'

/*
 * JetBrains Mono — used for all UI labels, nav items, codes, and
 * anything that should echo the dot-matrix display aesthetic.
 * variable: '--font-mono' makes it available as a CSS variable
 * so we can use font-mono in Tailwind classes.
 */
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  // weight: 'variable' loads the full variable font — supports any weight
  // from 100–800 without separate weight files.
  weight: ['400', '500', '600', '700'],
  display: 'swap', // show fallback font while loading — prevents invisible text
})

/*
 * Inter — used for body text, descriptions, and form labels where
 * readability matters more than the retro-terminal aesthetic.
 * variable: '--font-sans' maps to Tailwind's font-sans utility.
 */
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    // template: used for sub-pages — e.g. "Apps — REDI"
    template: '%s — REDI',
    // default: shown when no page-level title is set (e.g. the root)
    default: 'REDI',
  },
  description: 'RGB LED Display Control — manage your REDI devices',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    /*
     * lang="en": tells browsers and screen readers the document language.
     * className: applies both font CSS variables to :root so Tailwind's
     *   font-mono and font-sans utilities resolve to our custom fonts.
     *   Without this, Tailwind would fall back to system fonts.
     */
    <html lang="en" className={`${jetbrainsMono.variable} ${inter.variable}`}>
      {/*
       * antialiased: Tailwind utility that sets -webkit-font-smoothing: antialiased.
       *   Makes text look sharper on retina displays.
       * bg-zinc-900: base background for the whole app.
       *   Pages and layouts layer their own backgrounds on top of this.
       * text-zinc-100: default text color — light on dark.
       * font-sans: Inter as the default body font.
       *   Components that want monospace use font-mono explicitly.
       */}
      <body className="antialiased bg-zinc-900 text-zinc-100 font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

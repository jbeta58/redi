/**
 * Root page — /
 *
 * There is no content at the root URL. We simply redirect
 * to the dashboard, and the middleware will handle sending
 * unauthenticated users to the login page from there.
 */

import { redirect } from 'next/navigation'

export default function RootPage() {
  redirect('/dashboard')
}

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import QuotesList from './QuotesList'

export const metadata = { title: 'Quotes' }

export default async function AdminQuotesPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const profile = await prisma.profile.findUnique({
    where:  { id: session.user.id },
    select: { is_admin: true },
  })

  if (!profile?.is_admin) redirect('/dashboard/home')

  const quotes = await prisma.quote.findMany({
    orderBy: { created_at: 'asc' },
  })

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="font-mono text-lg font-semibold tracking-widest text-white uppercase">
          Quotes
        </h1>
        <p className="text-zinc-500 text-sm mt-1">
          {quotes.length} quote{quotes.length !== 1 ? 's' : ''} · shown in rotation sequentially
        </p>
      </div>

      <QuotesList quotes={quotes} />
    </div>
  )
}

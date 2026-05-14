import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import UsersList from './UsersList'

export const metadata = { title: 'Users' }

export default async function AdminUsersPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const currentProfile = await prisma.profile.findUnique({
    where:  { id: session.user.id },
    select: { is_admin: true },
  })

  if (!currentProfile?.is_admin) redirect('/dashboard/home')

  const profiles = await prisma.profile.findMany({
    orderBy: { created_at: 'asc' },
    select:  { id: true, email: true, full_name: true, is_admin: true, created_at: true },
  })

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="font-mono text-lg font-semibold tracking-widest text-white uppercase">
          Users
        </h1>
        <p className="text-zinc-500 text-sm mt-1">
          {profiles.length} user{profiles.length !== 1 ? 's' : ''} registered
        </p>
      </div>

      <UsersList profiles={profiles} currentUserId={session.user.id} />
    </div>
  )
}

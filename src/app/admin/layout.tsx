import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Sidebar from '@/components/Sidebar'
import TopBar from '@/components/TopBar'
import BottomNav from '@/components/BottomNav'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const profile = await prisma.profile.findUnique({
    where:  { id: session.user.id },
    select: { is_admin: true },
  })

  if (!profile?.is_admin) redirect('/dashboard/home')

  return (
    <div className="min-h-screen bg-zinc-900 flex">
      <Sidebar role="admin" />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          {children}
        </main>
      </div>
      <BottomNav role="admin" />
    </div>
  )
}

import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const profile = await prisma.profile.findUnique({
    where:  { id: session.user.id },
    select: { is_admin: true },
  })

  if (profile?.is_admin === true) {
    redirect('/admin/devices')
  } else {
    redirect('/dashboard/home')
  }
}

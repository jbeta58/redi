import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import AppConfigForm from './AppConfigForm'

interface Props {
  params: Promise<{ appId: string }>
}

export async function generateMetadata({ params }: Props) {
  const { appId } = await params
  return { title: `Configure · ${appId}` }
}

export default async function AppConfigPage({ params }: Props) {
  const { appId } = await params

  const session = await auth()
  if (!session?.user) redirect('/login')

  const device = await prisma.device.findFirst({
    where: { user_id: session.user.id },
    select: { id: true },
  })
  if (!device) redirect('/dashboard/apps')

  const deviceApp = await prisma.deviceApp.findFirst({
    where: { device_id: device.id, app_id: appId },
    include: { app: { select: { name: true, has_config: true, is_active: true } } },
  })

  if (!deviceApp || !deviceApp.app.has_config) notFound()

  const isBirthdayApp = appId === 'birthday' || appId === 'happy_birthday'

  const birthdayEntries = isBirthdayApp
    ? await prisma.birthdayEntry.findMany({
        where: { device_id: device.id },
        orderBy: { created_at: 'asc' },
        select: {
          id: true,
          name: true,
          birth_day: true,
          birth_month: true,
          birth_year: true,
          show_in_birthday: true,
          show_in_happy_birthday: true,
        },
      })
    : []

  return (
    <div className="p-6 max-w-xl">
      <Link
        href="/dashboard/apps"
        className="inline-flex items-center gap-1 font-mono text-xs text-zinc-500
                   hover:text-zinc-300 transition-colors mb-6"
      >
        <ChevronLeft size={14} />
        Apps
      </Link>

      <h1 className="font-mono text-lg font-semibold tracking-widest text-white uppercase mb-6">
        {deviceApp.app.name}
      </h1>

      <AppConfigForm
        deviceId={device.id}
        appId={appId}
        appName={deviceApp.app.name}
        config={(deviceApp.config ?? {}) as Record<string, unknown>}
        birthdayEntries={birthdayEntries}
      />
    </div>
  )
}

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import AppsList from './AppsList'

export const metadata = { title: 'Apps' }

export default async function DashboardAppsPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const device = await prisma.device.findFirst({
    where: { user_id: session.user.id },
    include: {
      device_apps: {
        include: { app: true },
        orderBy: { position: 'asc' },
      },
    },
  })

  // Backfill device_apps for devices created before seeding
  if (device && device.device_apps.length === 0) {
    const allApps = await prisma.app.findMany({
      where: { is_active: true },
      orderBy: { id: 'asc' },
      select: { id: true },
    })
    await prisma.deviceApp.createMany({
      data: allApps.map((app, index) => ({
        device_id:  device.id,
        app_id:     app.id,
        position:   index,
        is_enabled: app.id === 'clock',
        config:     {},
      })),
    })
    redirect('/dashboard/apps')
  }

  if (!device) {
    return (
      <div className="p-6 max-w-xl">
        <div className="mb-6">
          <h1 className="font-mono text-lg font-semibold tracking-widest text-white uppercase">
            Apps
          </h1>
        </div>
        <div className="border border-dashed border-zinc-800 rounded-lg p-10 text-center">
          <p className="font-mono text-sm text-zinc-500">No display connected yet</p>
          <p className="text-xs text-zinc-600 mt-2">
            Contact the admin to get your device set up
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-xl">

      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="font-mono text-lg font-semibold tracking-widest text-white uppercase">
            Apps
          </h1>
          <p className="text-zinc-500 text-sm mt-1 font-mono">
            {device.device_apps.filter(a => a.is_enabled).length} active ·{' '}
            drag to reorder
          </p>
        </div>
      </div>

      {device.device_apps.length === 0 ? (
        <div className="border border-dashed border-zinc-800 rounded-lg p-10 text-center">
          <p className="font-mono text-sm text-zinc-500">No apps configured</p>
        </div>
      ) : (
        <AppsList
          deviceId={device.id}
          apps={device.device_apps.map(da => ({
            id:       da.id,
            position: da.position,
            isEnabled: da.is_enabled,
            config:   (da.config ?? {}) as Record<string, any>,
            appId:    da.app.id,
            appName:  da.app.name,
            hasConfig: da.app.has_config,
          }))}
        />
      )}

    </div>
  )
}

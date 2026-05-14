import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import DeviceList from './DeviceList'

export default async function AdminDevicesPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const [devices, profiles] = await Promise.all([
    prisma.device.findMany({
      orderBy: { created_at: 'desc' },
      select: {
        id:               true,
        name:             true,
        pairing_code:     true,
        is_online:        true,
        last_seen_at:     true,
        timezone:         true,
        language:         true,
        city:             true,
        firmware_version: true,
        created_at:       true,
        user_id:          true,
      },
    }),
    prisma.profile.findMany({
      orderBy: { full_name: 'asc' },
      select: { id: true, full_name: true, is_admin: true },
    }),
  ])

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="font-mono text-xl font-bold text-zinc-100 tracking-tight">
          Devices
        </h1>
        <p className="font-mono text-sm text-zinc-500 mt-1">
          {devices.length} device{devices.length !== 1 ? 's' : ''} registered
        </p>
      </div>

      <DeviceList
        devices={devices}
        profiles={profiles}
        currentUserId={session.user.id}
      />
    </div>
  )
}

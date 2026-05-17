import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ArrowLeft, Wifi, WifiOff } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import DeviceDetailForm from './DeviceDetailForm'

export async function generateMetadata({ params }: { params: Promise<{ deviceId: string }> }) {
  const { deviceId } = await params
  const device = await prisma.device.findUnique({ where: { id: deviceId }, select: { name: true } })
  return { title: device?.name ?? 'Device' }
}

export default async function AdminDeviceDetailPage({
  params,
}: {
  params: Promise<{ deviceId: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const { deviceId } = await params

  const [device, profiles] = await Promise.all([
    prisma.device.findUnique({
      where: { id: deviceId },
      include: {
        device_apps: {
          include: { app: { select: { name: true } } },
          orderBy: { position: 'asc' },
        },
      },
    }),
    prisma.profile.findMany({
      orderBy: { full_name: 'asc' },
      select:  { id: true, full_name: true, is_admin: true },
    }),
  ])

  if (!device) notFound()

  const lastSeen   = device.last_seen_at ? new Date(device.last_seen_at) : null
  const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000)
  const isOnline   = device.is_online || (lastSeen ? lastSeen > tenMinsAgo : false)
  const isLinked   = !!device.api_key

  const enabledApps  = device.device_apps.filter(da => da.is_enabled)
  const disabledApps = device.device_apps.filter(da => !da.is_enabled)

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">

      {/* Back + header */}
      <div className="mb-8">
        <Link
          href="/admin/devices"
          className="flex items-center gap-1.5 font-mono text-xs text-zinc-500 hover:text-zinc-300 transition-colors mb-4"
        >
          <ArrowLeft size={13} />
          All devices
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-mono text-xl font-bold text-zinc-100 tracking-tight">
              {device.name}
            </h1>
            <p className="font-mono text-xs text-zinc-500 mt-1">{device.pairing_code}</p>
          </div>
          <span className={`flex items-center gap-1.5 font-mono text-xs px-3 py-1.5 rounded-full border shrink-0 mt-1
            ${isOnline
              ? 'text-green-400 border-green-800 bg-green-950/30'
              : 'text-zinc-500 border-zinc-700 bg-zinc-800/30'}`}
          >
            {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Read-only info */}
      <div className="border border-zinc-800/50 rounded-xl p-5 mb-6">
        <p className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest mb-3">Device info</p>
        <div className="grid grid-cols-2 gap-x-8 gap-y-2">
          <Row label="Linked"        value={isLinked ? 'Yes' : 'No'} />
          <Row label="Last seen"     value={lastSeen ? formatDistanceToNow(lastSeen, { addSuffix: true }) : 'Never'} />
          {device.ip_address      && <Row label="IP"        value={device.ip_address} />}
          {device.wifi_ssid       && <Row label="WiFi"      value={device.wifi_ssid} />}
          {device.firmware_version && <Row label="Firmware"  value={device.firmware_version} />}
          <Row label="Rotation" value={`${device.rotation_duration_seconds}s / app`} />
          <Row label="Brightness"  value={`${device.brightness}%`} />
        </div>
      </div>

      {/* Edit form + admin actions */}
      <DeviceDetailForm
        deviceId={deviceId}
        isOnline={isOnline}
        isLinked={isLinked}
        initial={{
          name:     device.name,
          user_id:  device.user_id ?? '',
          timezone: device.timezone,
          language: device.language as 'en' | 'es',
          city:     device.city ?? '',
        }}
        profiles={profiles}
      />

      {/* App rotation summary */}
      <div className="mt-8 border border-zinc-800/50 rounded-xl p-5">
        <p className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest mb-3">
          App rotation — {enabledApps.length} enabled
        </p>
        <div className="space-y-1.5">
          {enabledApps.map((da, i) => (
            <div key={da.id} className="flex items-center gap-3">
              <span className="font-mono text-[10px] text-zinc-600 w-4 shrink-0">{i + 1}</span>
              <span className="font-mono text-xs text-zinc-300">{da.app.name}</span>
            </div>
          ))}
          {disabledApps.length > 0 && (
            <p className="font-mono text-[10px] text-zinc-600 pt-2">
              + {disabledApps.length} disabled app{disabledApps.length !== 1 ? 's' : ''}
            </p>
          )}
          {enabledApps.length === 0 && (
            <p className="font-mono text-xs text-zinc-600">No apps enabled.</p>
          )}
        </div>
      </div>

    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="font-mono text-[10px] text-zinc-600">{label}</span>
      <span className="font-mono text-xs text-zinc-400">{value}</span>
    </div>
  )
}

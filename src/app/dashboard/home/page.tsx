import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { Wifi, WifiOff } from 'lucide-react'
import LinkDeviceForm from './LinkDeviceForm'

export const metadata = { title: 'Home' }

export default async function DashboardHomePage() {
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

  // ── State 1: No device assigned yet ──────────────────────────────────────────
  if (!device) {
    return (
      <div className="p-6 max-w-xl">
        <h1 className="font-mono text-lg font-semibold tracking-widest text-white uppercase mb-6">
          My Display
        </h1>
        <div className="border border-dashed border-zinc-800 rounded-lg p-10 text-center">
          <p className="font-mono text-sm text-zinc-500">No display assigned yet</p>
          <p className="font-mono text-xs text-zinc-600 mt-2">
            Contact the admin to get your device set up
          </p>
        </div>
      </div>
    )
  }

  // ── State 2: Device assigned but not yet linked (no api_key) ─────────────────
  if (!device.api_key) {
    return (
      <div className="p-6 max-w-xl">
        <h1 className="font-mono text-lg font-semibold tracking-widest text-white uppercase mb-2">
          Link your display
        </h1>
        <p className="font-mono text-xs text-zinc-500 mb-8">
          Your REDI display has been assigned to you. Power it on and enter the
          pairing code shown on screen to complete setup.
        </p>

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <LinkDeviceForm />
        </div>

        <div className="mt-6 border border-zinc-800/50 rounded-lg p-4">
          <p className="font-mono text-[10px] text-zinc-600 uppercase tracking-wider mb-3">
            Device info
          </p>
          <div className="flex flex-col gap-1.5">
            <Row label="Name" value={device.name} />
            <Row label="Pairing code" value={device.pairing_code} />
            <Row label="Timezone" value={device.timezone} />
            <Row label="Language" value={device.language === 'es' ? 'Español' : 'English'} />
          </div>
        </div>
      </div>
    )
  }

  // ── State 3: Fully linked — show dashboard ────────────────────────────────────
  const lastSeen    = device.last_seen_at ? new Date(device.last_seen_at) : null
  const tenMinsAgo  = new Date(Date.now() - 10 * 60 * 1000)
  const isOnline    = device.is_online || (lastSeen ? lastSeen > tenMinsAgo : false)
  const enabledApps = device.device_apps.filter(da => da.is_enabled)
  const disabledApps = device.device_apps.filter(da => !da.is_enabled)

  return (
    <div className="p-6 max-w-xl">
      <div className="mb-6">
        <h1 className="font-mono text-lg font-semibold tracking-widest text-white uppercase">
          My Display
        </h1>
        <p className="font-mono text-sm text-zinc-500 mt-1">{device.name}</p>
      </div>

      {/* Status card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 mb-6
                      flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isOnline
            ? <Wifi size={18} className="text-green-400 shrink-0" />
            : <WifiOff size={18} className="text-zinc-600 shrink-0" />
          }
          <div>
            <p className={`font-mono text-sm font-medium ${isOnline ? 'text-green-400' : 'text-zinc-500'}`}>
              {isOnline ? 'Online' : 'Offline'}
            </p>
            <p className="font-mono text-xs text-zinc-600 mt-0.5">
              {lastSeen
                ? `Last seen ${formatDistanceToNow(lastSeen, { addSuffix: true })}`
                : 'Never connected'
              }
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-mono text-[10px] text-zinc-600 uppercase tracking-wider">Rotation</p>
          <p className="font-mono text-sm text-zinc-400 mt-0.5">
            {device.rotation_duration_seconds}s per app
          </p>
        </div>
      </div>

      {/* Device details */}
      <div className="border border-zinc-800/50 rounded-lg p-4 mb-6">
        <p className="font-mono text-[10px] text-zinc-600 uppercase tracking-wider mb-3">
          Device info
        </p>
        <div className="flex flex-col gap-1.5">
          <Row label="City" value={device.city ?? '—'} />
          <Row label="Timezone" value={device.timezone} />
          <Row label="Language" value={device.language === 'es' ? 'Español' : 'English'} />
          {device.wifi_ssid && <Row label="WiFi" value={device.wifi_ssid} />}
          {device.ip_address && <Row label="IP" value={device.ip_address} />}
          {device.firmware_version && <Row label="Firmware" value={device.firmware_version} />}
        </div>
      </div>

      {/* Active apps */}
      <p className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest mb-3">
        Active rotation — {enabledApps.length} app{enabledApps.length !== 1 ? 's' : ''}
      </p>

      {enabledApps.length === 0 ? (
        <div className="border border-dashed border-zinc-800 rounded-lg p-6 text-center mb-4">
          <p className="font-mono text-xs text-zinc-600">No apps enabled</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2 mb-6">
          {enabledApps.map((da, index) => (
            <div
              key={da.id}
              className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3
                         flex items-center gap-4"
            >
              <span className="font-mono text-xs text-zinc-600 w-4 shrink-0">{index + 1}</span>
              <span className="font-mono text-sm text-zinc-200 flex-1">{da.app.name}</span>
              <ConfigSummary appId={da.app_id} config={(da.config ?? {}) as Record<string, unknown>} />
            </div>
          ))}
        </div>
      )}

      {/* Disabled apps */}
      {disabledApps.length > 0 && (
        <>
          <p className="font-mono text-[10px] text-zinc-600 uppercase tracking-widest mb-3">
            Disabled — {disabledApps.length} app{disabledApps.length !== 1 ? 's' : ''}
          </p>
          <div className="flex flex-col gap-2">
            {disabledApps.map(da => (
              <div
                key={da.id}
                className="border border-zinc-800/50 rounded-lg px-4 py-3
                           flex items-center gap-4 opacity-40"
              >
                <span className="font-mono text-xs text-zinc-600 w-4 shrink-0">—</span>
                <span className="font-mono text-sm text-zinc-500">{da.app.name}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="font-mono text-[10px] text-zinc-600">{label}</span>
      <span className="font-mono text-xs text-zinc-400">{value}</span>
    </div>
  )
}

function ConfigSummary({ appId, config }: { appId: string; config: Record<string, unknown> }) {
  if (!config || Object.keys(config).length === 0) return null

  let summary: string | null = null

  switch (appId) {
    case 'clock':
    case 'clock_date':
      summary = config.format ? `${config.format}` : null
      break
    case 'three_cities_clock': {
      const cities = [config.city1, config.city2, config.city3].filter(Boolean)
      summary = cities.length > 0 ? (cities as string[]).join(' · ') : null
      break
    }
    case 'weather_today':
    case 'weather_three_days':
      summary = config.city ? `${config.city} · °${config.unit ?? 'C'}` : null
      break
    case 'national_flag': {
      const countries = config.countries as string[] | undefined
      summary = countries?.length ? countries.slice(0, 3).join(', ') + (countries.length > 3 ? '…' : '') : null
      break
    }
    default:
      return null
  }

  if (!summary) return null
  return (
    <span className="font-mono text-[10px] text-zinc-500 text-right shrink-0 max-w-[140px] truncate">
      {summary}
    </span>
  )
}

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { Wifi, WifiOff } from 'lucide-react'

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

  if (!device) {
    return (
      <div className="p-6 max-w-xl">
        <div className="mb-6">
          <h1 className="font-mono text-lg font-semibold tracking-widest text-white uppercase">
            My Display
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

  const lastSeen   = device.last_seen_at ? new Date(device.last_seen_at) : null
  const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000)
  const isOnline   = device.is_online || (lastSeen ? lastSeen > tenMinsAgo : false)

  const enabledApps  = device.device_apps.filter(da => da.is_enabled)
  const disabledApps = device.device_apps.filter(da => !da.is_enabled)

  return (
    <div className="p-6 max-w-xl">

      <div className="mb-6">
        <h1 className="font-mono text-lg font-semibold tracking-widest text-white uppercase">
          My Display
        </h1>
        <p className="text-zinc-500 text-sm mt-1 font-mono">{device.name}</p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 mb-6
                      flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isOnline ? (
            <Wifi size={18} className="text-green-400 shrink-0" />
          ) : (
            <WifiOff size={18} className="text-zinc-600 shrink-0" />
          )}
          <div>
            <p className={`font-mono text-sm font-medium ${
              isOnline ? 'text-green-400' : 'text-zinc-500'
            }`}>
              {isOnline ? 'Online' : 'Offline'}
            </p>
            <p className="text-zinc-600 text-xs font-mono mt-0.5">
              {lastSeen
                ? `Last connected ${formatDistanceToNow(lastSeen, { addSuffix: true })}`
                : 'Never connected'
              }
            </p>
          </div>
        </div>

        <div className="text-right">
          <p className="font-mono text-xs text-zinc-600 uppercase tracking-wider">
            Rotation
          </p>
          <p className="font-mono text-sm text-zinc-400 mt-0.5">
            {device.rotation_duration_seconds}s per app
          </p>
        </div>
      </div>

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
              <span className="font-mono text-xs text-zinc-600 w-4 shrink-0">
                {index + 1}
              </span>
              <span className="font-mono text-sm text-zinc-200 flex-1">
                {da.app.name}
              </span>
              <ConfigSummary
                appId={da.app_id}
                config={(da.config ?? {}) as Record<string, any>}
              />
            </div>
          ))}
        </div>
      )}

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
                <span className="font-mono text-sm text-zinc-500">
                  {da.app.name}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

    </div>
  )
}

function ConfigSummary({
  appId,
  config,
}: {
  appId: string
  config: Record<string, any>
}) {
  if (!config || Object.keys(config).length === 0) return null

  let summary: string | null = null

  switch (appId) {
    case 'clock':
    case 'clock_date':
    case 'word_clock':
      summary = config.timezone ?? null
      break
    case 'three_city_clock': {
      const cities = [config.city1, config.city2, config.city3].filter(Boolean)
      summary = cities.length > 0 ? cities.join(' · ') : null
      break
    }
    case 'weather':
    case 'weather_3day':
      summary = config.city ? `${config.city} · ${config.unit ?? '°C'}` : null
      break
    case 'countdown': {
      const events = config.enabled_events ?? []
      summary = events.length > 0 ? `${events.length} events` : null
      break
    }
    case 'national_flag': {
      const countries = config.countries ?? []
      summary = countries.length > 0 ? countries.join(', ') : null
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

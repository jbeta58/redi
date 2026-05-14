import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import SettingsForm from './SettingsForm'

export const metadata = { title: 'Settings' }

export default async function DashboardSettingsPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const [device, profile] = await Promise.all([
    prisma.device.findFirst({
      where: { user_id: session.user.id },
      select: {
        id:                        true,
        name:                      true,
        language:                  true,
        city:                      true,
        timezone:                  true,
        rotation_duration_seconds: true,
        night_mode_enabled:        true,
        night_mode_start:          true,
        night_mode_end:            true,
      },
    }),
    prisma.profile.findUnique({
      where:  { id: session.user.id },
      select: { full_name: true },
    }),
  ])

  return (
    <div className="p-6 max-w-lg">
      <div className="mb-6">
        <h1 className="font-mono text-lg font-semibold tracking-widest text-white uppercase">
          Settings
        </h1>
        {profile?.full_name && (
          <p className="text-zinc-500 text-sm mt-1 font-mono">
            {profile.full_name}
          </p>
        )}
      </div>

      <SettingsForm
        userId={session.user.id}
        device={device ?? null}
      />
    </div>
  )
}

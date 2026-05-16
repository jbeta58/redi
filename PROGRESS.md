# REDI Build Progress

## Completed
- Seeded `apps` table (15 apps, `tsx` + `prisma.config.ts` seed setup)

## Pages completed
- /login, /auth/callback
- /admin/layout, /admin/devices, /admin/quotes, /admin/users
- /dashboard/layout (Sidebar/TopBar/BottomNav, role-aware)
- /dashboard/page (redirects by role)
- /dashboard/home, /dashboard/apps, /dashboard/settings

## Components
- Sidebar, TopBar, BottomNav, SignOutButton

## Key decisions
- Tailwind v4: @import "tailwindcss" in globals.css, no config file
- is_admin boolean on profiles (not role text)
- public.is_admin() security definer function (avoids RLS recursion)
- rotation_duration_seconds on devices (global, not per-app)
- device_apps.config jsonb for all per-app settings
- Sidebar is a client component using usePathname() for active nav state
- birthday_entries: device_id, birth_day, birth_month, birth_year (nullable),
  show_in_birthday, show_in_happy_birthday

## Packages added
lucide-react, date-fns, @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities

## Next steps
1. Apps list page — reorder + toggle + "Configure" link
2. /dashboard/apps/[appId] — config pages for all 15 apps
3. Device registration flow
4. /api/v1/render endpoint
5. WeatherAPI, TRM, Frankfurter integrations

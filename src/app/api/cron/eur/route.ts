import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// fawazahmed0 CDN — free, no key, supports @latest and @YYYY-MM-DD
const EUR_URL = 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/eur.json'

export async function GET(request: NextRequest) {
  const secret = request.headers.get('x-cron-secret')
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const res = await fetch(EUR_URL, { cache: 'no-store' })
    if (!res.ok) throw new Error(`currency-api CDN returned ${res.status}`)

    const data = await res.json() as { date: string; eur: Record<string, number> }

    const rate = data.eur['cop']
    if (!rate) throw new Error('COP rate not found in response')

    const dateStr = data.date                           // "YYYY-MM-DD"
    const date    = new Date(dateStr + 'T12:00:00Z')
    const rounded = Math.round(rate * 100) / 100

    await prisma.currencyHistory.upsert({
      where:  { date },
      update: { cop_eur: rounded },
      create: { date, cop_eur: rounded },
    })

    console.log(`[cron/eur] upserted ${rounded} for ${dateStr}`)
    return NextResponse.json({ ok: true, date: dateStr, rate: rounded })
  } catch (err) {
    console.error('[cron/eur] failed:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

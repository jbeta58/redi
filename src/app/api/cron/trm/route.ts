import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const TRM_URL = 'https://www.datos.gov.co/resource/32sa-8pi3.json?$limit=1&$order=vigenciadesde+DESC'

export async function GET(request: NextRequest) {
  const secret = request.headers.get('x-cron-secret')
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const res = await fetch(TRM_URL, { cache: 'no-store' })
    if (!res.ok) throw new Error(`datos.gov.co returned ${res.status}`)

    const rows = await res.json() as Array<{ valor: string; vigenciadesde: string }>
    if (!rows.length) throw new Error('Empty response from TRM API')

    const { valor, vigenciadesde } = rows[0]
    const rate = parseFloat(valor)
    if (isNaN(rate)) throw new Error(`Invalid rate value: "${valor}"`)

    // vigenciadesde is "2026-05-16T00:00:00.000" — keep only the date part
    const date = new Date(vigenciadesde.slice(0, 10) + 'T12:00:00Z')

    await prisma.currencyHistory.upsert({
      where:  { date },
      update: { cop_usd: rate },
      create: { date, cop_usd: rate },
    })

    console.log(`[cron/trm] upserted ${rate} for ${vigenciadesde.slice(0, 10)}`)
    return NextResponse.json({ ok: true, date: vigenciadesde.slice(0, 10), rate })
  } catch (err) {
    console.error('[cron/trm] failed:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

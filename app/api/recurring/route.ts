import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabaseServer'
import { rowToRecurring } from '@/lib/types'

export async function GET() {
  const sb = createServerClient()
  const { data, error } = await sb.from('dc_recurring_rules').select('*').order('id')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data.map(rowToRecurring))
}

export async function POST(req: Request) {
  const sb   = createServerClient()
  const body = await req.json()
  const row  = toRow(body)
  const { data, error } = await sb.from('dc_recurring_rules').insert(row).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(rowToRecurring(data), { status: 201 })
}

function toRow(b: any) {
  return {
    id:                  b.id,
    title:               b.title,
    title_template:      b.titleTemplate,
    freq:                b.freq,
    week_day:            b.weekDay ?? null,
    month_day:           b.monthDay ?? null,
    time:                b.time,
    duration:            b.duration,
    platforms:           b.platforms,
    tags:                b.tags,
    active:              b.active,
    start_date:          b.startDate,
    counter:             b.counter,
    default_template_id: b.defaultTemplateId ?? null,
  }
}

import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabaseServer'
import { rowToRecurring } from '@/lib/types'

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const sb  = createServerClient()
  const body = await req.json()
  const row  = toRow(body)
  const { data, error } = await sb.from('dc_recurring_rules').update(row).eq('id', params.id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(rowToRecurring(data))
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const sb = createServerClient()
  const { error } = await sb.from('dc_recurring_rules').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

function toRow(b: any) {
  return {
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

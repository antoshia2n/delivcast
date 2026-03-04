import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabaseServer'
import { rowToTemplate } from '@/lib/types'

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const sb   = createServerClient()
  const body = await req.json()
  const { id: _id, ...rest } = body
  const { data, error } = await sb.from('dc_templates').update(rest).eq('id', params.id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(rowToTemplate(data))
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const sb = createServerClient()
  const { error } = await sb.from('dc_templates').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

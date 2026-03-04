import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabaseServer'
import { rowToTemplate } from '@/lib/types'

export async function GET() {
  const sb = createServerClient()
  const { data, error } = await sb.from('dc_templates').select('*').order('id')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data.map(rowToTemplate))
}

export async function POST(req: Request) {
  const sb   = createServerClient()
  const body = await req.json()
  const { id: _id, ...rest } = body
  const { data, error } = await sb.from('dc_templates').insert(rest).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(rowToTemplate(data), { status: 201 })
}

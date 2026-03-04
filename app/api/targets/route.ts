import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabaseServer'

export async function GET() {
  const sb = createServerClient()
  const { data, error } = await sb.from('dc_targets').select('*')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const sb   = createServerClient()
  const body = await req.json()
  const { error } = await sb
    .from('dc_targets')
    .upsert({ id: body.id, name: body.name, color: body.color, icon: body.icon, active: body.active, account_url: body.account_url, memo: body.memo })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

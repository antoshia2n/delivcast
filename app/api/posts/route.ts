import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabaseServer'
import { rowToPost } from '@/lib/types'

export async function GET() {
  const sb = createServerClient()
  const { data, error } = await sb
    .from('dc_posts')
    .select('*, post_targets(*)')
    .order('date', { ascending: true })
    .order('time', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data.map(rowToPost))
}

export async function POST(req: Request) {
  const sb   = createServerClient()
  const body = await req.json()

  // 1. post_targets を分離
  const { postTargets, id: _id, isGenerated: _ig, ...postRow } = body

  // 2. camelCase → snake_case
  const row = {
    title:        postRow.title,
    date:         postRow.date,
    time:         postRow.time,
    duration:     postRow.duration,
    status:       postRow.status,
    platforms:    postRow.platforms,
    tags:         postRow.tags,
    body:         postRow.body,
    note:         postRow.note,
    recurring_id: postRow.recurringId ?? null,
  }

  const { data, error } = await sb.from('dc_posts').insert(row).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // 3. post_targets を upsert
  if (postTargets?.length) {
    const targets = postTargets.map((pt: any) => ({
      post_id:   data.id,
      target_id: pt.targetId,
      url:       pt.url ?? '',
    }))
    await sb.from('dc_post_targets').insert(targets)
  }

  // 4. 再取得して返す
  const { data: full } = await sb
    .from('dc_posts').select('*, post_targets(*)')
    .eq('id', data.id).single()
  return NextResponse.json(rowToPost(full), { status: 201 })
}

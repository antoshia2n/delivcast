import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabaseServer'
import { rowToPost } from '@/lib/types'

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const sb   = createServerClient()
  const body = await req.json()
  const { postTargets, id: _id, isGenerated: _ig, ...postRow } = body

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

  const { error } = await sb.from('dc_posts').update(row).eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // post_targets: 一旦全削除して再挿入（シンプルな方法）
  await sb.from('dc_post_targets').delete().eq('post_id', params.id)
  if (postTargets?.length) {
    const targets = postTargets.map((pt: any) => ({
      post_id:   Number(params.id),
      target_id: pt.targetId,
      url:       pt.url ?? '',
    }))
    await sb.from('dc_post_targets').insert(targets)
  }

  const { data: full } = await sb
    .from('dc_posts').select('*, dc_post_targets(*)')
    .eq('id', params.id).single()
  return NextResponse.json(rowToPost(full))
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const sb = createServerClient()
  const { error } = await sb.from('dc_posts').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

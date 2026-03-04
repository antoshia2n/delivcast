import { createServerClient } from '@/lib/supabaseServer'
import { rowToPost, rowToTemplate, rowToRecurring } from '@/lib/types'
import DelivCast from '@/components/DelivCast'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const sb = createServerClient()

  const [postsRes, targetsRes, templatesRes, recurringRes] = await Promise.all([
    sb.from('dc_posts').select('*').order('date').order('time'),
    sb.from('dc_post_targets').select('*'),
    sb.from('dc_templates').select('*').order('id'),
    sb.from('dc_recurring_rules').select('*').order('id'),
  ])

  // エラーログ
  if (postsRes.error)     console.error('[DC] posts error:', postsRes.error.message)
  if (targetsRes.error)   console.error('[DC] targets error:', targetsRes.error.message)
  if (templatesRes.error) console.error('[DC] templates error:', templatesRes.error.message)
  if (recurringRes.error) console.error('[DC] recurring error:', recurringRes.error.message)

  const allTargets = targetsRes.data ?? []
  const posts = (postsRes.data ?? []).map(row => rowToPost({
    ...row,
    dc_post_targets: allTargets.filter(t => t.post_id === row.id)
  }))

  const templates = (templatesRes.data ?? []).map(rowToTemplate)
  const recurring = (recurringRes.data ?? []).map(rowToRecurring)

  console.log('[DC] loaded:', posts.length, 'posts,', templates.length, 'templates,', recurring.length, 'recurring')

  return <DelivCast initialPosts={posts} initialTemplates={templates} initialRecurring={recurring} />
}

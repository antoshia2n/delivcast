import { createServerClient } from '@/lib/supabaseServer'
import { rowToPost, rowToTemplate, rowToRecurring } from '@/lib/types'
import DelivCast from '@/components/DelivCast'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const sb = createServerClient()

  const [postsRes, templatesRes, recurringRes] = await Promise.all([
    sb.from('dc_posts').select('*, post_targets(*)').order('date').order('time'),
    sb.from('dc_templates').select('*').order('id'),
    sb.from('dc_recurring_rules').select('*').order('id'),
  ])

  const posts     = (postsRes.data     ?? []).map(rowToPost)
  const templates = (templatesRes.data ?? []).map(rowToTemplate)
  const recurring = (recurringRes.data ?? []).map(rowToRecurring)

  return <DelivCast initialPosts={posts} initialTemplates={templates} initialRecurring={recurring} />
}

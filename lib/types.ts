export type Status = 'draft' | 'wip' | 'done' | 'scheduled' | 'live'
export type Freq   = 'daily' | 'weekly' | 'biweekly' | 'monthly'

export interface PostTarget {
  targetId: string
  url: string
}

export interface Post {
  id: number | string
  title: string
  date: string
  time: string
  duration: number
  status: Status
  platforms: string[]
  tags: string[]
  body: string
  note: string
  recurringId: string | null
  isGenerated?: boolean
  postTargets: PostTarget[]
  defaultTemplateId?: number | null
}

export interface Template {
  id: number
  title: string
  folder: string
  tags: string[]
  body: string
}

export interface RecurringRule {
  id: string
  title: string
  titleTemplate: string
  freq: Freq
  weekDay?: number
  monthDay?: number
  time: string
  duration: number
  platforms: string[]
  tags: string[]
  active: boolean
  startDate: string
  counter: number
  defaultTemplateId?: number | null
}

// Supabase row → app型への変換
export function rowToPost(row: any): Post {
  return {
    id: row.id,
    title: row.title,
    date: row.date,
    time: row.time,
    duration: row.duration,
    status: row.status,
    platforms: row.platforms ?? [],
    tags: row.tags ?? [],
    body: row.body,
    note: row.note,
    recurringId: row.recurring_id ?? null,
    isGenerated: false,
    postTargets: (row.post_targets ?? []).map((pt: any) => ({
      targetId: pt.target_id,
      url: pt.url,
    })),
  }
}

export function rowToTemplate(row: any): Template {
  return {
    id: row.id,
    title: row.title,
    folder: row.folder,
    tags: row.tags ?? [],
    body: row.body,
  }
}

export function rowToRecurring(row: any): RecurringRule {
  return {
    id: row.id,
    title: row.title,
    titleTemplate: row.title_template,
    freq: row.freq,
    weekDay: row.week_day ?? undefined,
    monthDay: row.month_day ?? undefined,
    time: row.time,
    duration: row.duration,
    platforms: row.platforms ?? [],
    tags: row.tags ?? [],
    active: row.active,
    startDate: row.start_date,
    counter: row.counter,
    defaultTemplateId: row.default_template_id ?? null,
  }
}

import { createClient } from '@supabase/supabase-js'

// サーバーサイド（API Routes）用 — service_role key を使う場合はここを変更
export function createServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

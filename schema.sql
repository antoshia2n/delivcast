-- ============================================================
-- DelivCast — Supabase DDL
-- Supabase Dashboard → SQL Editor に貼り付けて実行
-- ============================================================

-- 1. posts（配信スケジュール本体）
create table if not exists dc_posts (
  id            bigint primary key generated always as identity,
  title         text not null default '',
  date          date not null,
  time          text not null default '10:00',
  duration      int  not null default 60,
  status        text not null default 'draft'
                  check (status in ('draft','wip','done','scheduled','live')),
  platforms     text[] not null default '{}',
  tags          text[] not null default '{}',
  body          text not null default '',
  note          text not null default '',
  recurring_id  text,
  is_generated  boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- 2. post_targets（投稿ごとの配信先 + URL）
create table if not exists dc_post_targets (
  id         bigint primary key generated always as identity,
  post_id    bigint not null references dc_posts(id) on delete cascade,
  target_id  text not null,
  url        text not null default '',
  unique(post_id, target_id)
);

-- 3. templates（テンプレート）
create table if not exists dc_templates (
  id         bigint primary key generated always as identity,
  title      text not null default '',
  folder     text not null default '',
  tags       text[] not null default '{}',
  body       text not null default '',
  created_at timestamptz not null default now()
);

-- 4. recurring_rules（定期繰り返しルール）
create table if not exists dc_recurring_rules (
  id                  text primary key,
  title               text not null default '',
  title_template      text not null default '',
  freq                text not null default 'weekly'
                        check (freq in ('daily','weekly','biweekly','monthly')),
  week_day            int,
  month_day           int,
  time                text not null default '10:00',
  duration            int  not null default 60,
  platforms           text[] not null default '{}',
  tags                text[] not null default '{}',
  active              boolean not null default true,
  start_date          date not null,
  counter             int  not null default 1,
  default_template_id bigint references dc_templates(id) on delete set null,
  created_at          timestamptz not null default now()
);

-- 5. targets（配信管理対象マスター）
create table if not exists dc_targets (
  id          text primary key,
  name        text not null,
  color       text not null,
  icon        text not null,
  active      boolean not null default true,
  account_url text not null default '',
  memo        text not null default ''
);

-- updated_at 自動更新トリガー
create or replace function dc_update_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists dc_posts_updated_at on dc_posts;
create trigger dc_posts_updated_at
  before update on dc_posts
  for each row execute procedure dc_update_updated_at();

-- RLS（Row Level Security）— 必要に応じて設定
-- 今は全アクセス許可（プロトタイプ用）
alter table dc_posts          enable row level security;
alter table dc_post_targets   enable row level security;
alter table dc_templates      enable row level security;
alter table dc_recurring_rules enable row level security;
alter table dc_targets        enable row level security;

create policy "allow all" on dc_posts          for all using (true) with check (true);
create policy "allow all" on dc_post_targets   for all using (true) with check (true);
create policy "allow all" on dc_templates      for all using (true) with check (true);
create policy "allow all" on dc_recurring_rules for all using (true) with check (true);
create policy "allow all" on dc_targets        for all using (true) with check (true);

-- ============================================================
-- シードデータ（初期投入 — 任意）
-- ============================================================
insert into dc_templates (title, folder, tags, body) values
  ('標準動画テンプレート', 'YouTube', array['動画'], '【タイトル】\n\n【説明文】\n\n【タイムスタンプ】\n0:00 イントロ\n\n【ハッシュタグ】\n\n【関連動画】'),
  ('ショート動画',         'Shorts',  array['ショート'], '【タイトル（30字以内）】\n\n【キャプション】\n\n【ハッシュタグ】\n\n【BGM】\n\n【尺】秒'),
  ('ライブ告知ツイート',   'SNS',     array['Twitter','告知'], '【配信タイトル】\n\n【開始日時】 曜日 時〜\n\n🔗 URL\n\n#YouTubeライブ'),
  ('コミュニティ投稿',     'Community', array['コミュニティ'], '【今週の更新】\n✅\n✅\n\n【来週の予定】\n📹\n\n【お知らせ】')
on conflict do nothing;

insert into dc_targets (id, name, color, icon, active) values
  ('shia',     'しあらぼ', '#EC4899', '✦', true),
  ('raica',    'ライカレ', '#10B981', '◈', true),
  ('yuru',     'ゆるラボ', '#3B82F6', '◎', true),
  ('note',     'note',    '#41C9B0', 'n', true),
  ('x',        'X',       '#1D9BF0', '𝕏', true),
  ('line',     'LINE',    '#06C755', 'L', true),
  ('merumaga', 'メルマガ', '#F59E0B', '✉', true),
  ('other',    'その他',  '#94A3B8', '…', true)
on conflict do nothing;

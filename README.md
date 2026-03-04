# DelivCast — セットアップ手順

## 全体の流れ（30〜40分）

```
Supabase DDL実行 → ローカルで動作確認 → GitHub push → Vercel環境変数設定 → 完了
```

---

## Step 1 — Supabaseでテーブルを作る（5分）

1. [Supabase](https://supabase.com) でプロジェクトを開く
2. 左メニュー **SQL Editor** → **New query**
3. `schema.sql` の中身を貼り付けて **Run**
4. `posts` `post_targets` `templates` `recurring_rules` `targets` の5テーブルが作成される

---

## Step 2 — ローカルプロジェクトを作る（5分）

```bash
# 新しいNext.jsプロジェクトを作成
npx create-next-app@latest delivcast --typescript --app --no-tailwind --no-src-dir
cd delivcast

# Supabaseクライアントをインストール
npm install @supabase/supabase-js
```

---

## Step 3 — ファイルをコピーする（5分）

このフォルダのファイルをすべて `delivcast/` 以下にコピーする。
既存ファイル（`app/page.tsx` など）は上書きでOK。

```
delivcast/
├── app/
│   ├── layout.tsx          ← コピー
│   ├── page.tsx            ← コピー（上書き）
│   └── api/
│       ├── posts/
│       │   ├── route.ts    ← コピー
│       │   └── [id]/route.ts
│       ├── templates/
│       │   ├── route.ts
│       │   └── [id]/route.ts
│       ├── recurring/
│       │   ├── route.ts
│       │   └── [id]/route.ts
│       └── notion/
│           └── route.ts
├── components/
│   └── DelivCast.tsx       ← コピー
├── lib/
│   ├── supabase.ts         ← コピー
│   ├── supabaseServer.ts   ← コピー
│   └── types.ts            ← コピー
└── .env.local              ← 次のステップで作成
```

---

## Step 4 — 環境変数を設定する（2分）

`.env.local.example` をコピーして `.env.local` を作成：

```bash
cp .env.local.example .env.local
```

`.env.local` を開いて、Supabaseの値を入力：

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
NOTION_TOKEN=secret_xxx  # Notionを使う場合のみ
```

Supabaseの値は：
- Dashboard → プロジェクトを選択 → **Settings → API**
- `URL` と `anon public` キーをコピー

---

## Step 5 — ローカルで動作確認（2分）

```bash
npm run dev
```

`http://localhost:3000` を開いて動けばOK。

---

## Step 6 — GitHubにpush（3分）

```bash
git init
git add .
git commit -m "feat: DelivCast initial"
git remote add origin https://github.com/YOUR_NAME/delivcast.git
git push -u origin main
```

---

## Step 7 — Vercelにデプロイ（5分）

1. [Vercel](https://vercel.com) → **Add New Project**
2. GitHubの `delivcast` リポジトリを選択
3. **Environment Variables** に以下を追加：
   ```
   NEXT_PUBLIC_SUPABASE_URL    = （SupabaseのURL）
   NEXT_PUBLIC_SUPABASE_ANON_KEY = （SupabaseのANON KEY）
   NOTION_TOKEN                = （NotionトークンあればOK）
   ```
4. **Deploy** → 完了

---

## ファイル構成の説明

| ファイル | 役割 |
|---|---|
| `app/page.tsx` | サーバーでSupabaseからデータ取得 → コンポーネントに渡す |
| `components/DelivCast.tsx` | UIの全体（v13から移植） |
| `app/api/posts/` | 投稿のCRUD API |
| `app/api/templates/` | テンプレートのCRUD API |
| `app/api/recurring/` | 定期ルールのCRUD API |
| `app/api/notion/` | NotionのCORSを回避するプロキシ |
| `lib/types.ts` | 型定義 + Supabase行→アプリ型の変換 |
| `lib/supabase.ts` | ブラウザ用Supabaseクライアント |
| `lib/supabaseServer.ts` | APIルート用Supabaseクライアント |

---

## トラブルシューティング

**`NEXT_PUBLIC_SUPABASE_URL` が undefined エラー**
→ `.env.local` が正しく作られているか確認。`npm run dev` を再起動。

**データが表示されない**
→ Supabaseダッシュボードの **Table Editor** でテーブルが作成されているか確認。

**Notion取り込みが動かない**
→ `.env.local` の `NOTION_TOKEN` が設定されているか確認。
→ Notionで該当ページに「インテグレーションを接続」しているか確認。

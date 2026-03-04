import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'DelivCast',
  description: '配信スケジュール管理ツール',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  )
}

import { NextResponse } from 'next/server'

const NOTION_VERSION = '2022-06-28'
const TOKEN = process.env.NOTION_TOKEN ?? ''

// POST /api/notion  { action: 'search' | 'blocks', query?, pageId? }
export async function POST(req: Request) {
  const body = await req.json()

  if (body.action === 'search') {
    const res = await fetch('https://api.notion.com/v1/search', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'Notion-Version': NOTION_VERSION,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: body.query,
        filter: { value: 'page', property: 'object' },
        page_size: 10,
      }),
    })
    const data = await res.json()
    if (!res.ok) return NextResponse.json({ error: data.message }, { status: res.status })
    return NextResponse.json(data)
  }

  if (body.action === 'blocks') {
    const res = await fetch(
      `https://api.notion.com/v1/blocks/${body.pageId}/children?page_size=50`,
      {
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          'Notion-Version': NOTION_VERSION,
        },
      }
    )
    const data = await res.json()
    if (!res.ok) return NextResponse.json({ error: data.message }, { status: res.status })
    return NextResponse.json(data)
  }

  return NextResponse.json({ error: 'unknown action' }, { status: 400 })
}

const FEED = 'https://www.espn.com/espn/rss/nfl/news'
// Same names the board scopes on in venue-markets.ts. ESPN's NFL feed is already
// the VENUE_QUERY; team terms float matching headlines to the front of the wire.
const WIRE_TERMS = ['NFL', 'Kansas City Chiefs', 'Pittsburgh Steelers']
const TTL_MS = 5 * 60 * 1000
const MAX_ITEMS = 16

type Headline = { title: string; href: string; source: string }

type CacheEntry = { at: number; items: Headline[] }

let cache: CacheEntry | null = null
let inflight: Promise<Headline[]> | null = null

function tag(block: string, name: string): string {
  const re = new RegExp(`<${name}[^>]*>(?:<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>|([^<]*))</${name}>`, 'i')
  const m = block.match(re)
  return (m?.[1] ?? m?.[2] ?? '').replace(/\s+/g, ' ').trim()
}

function parseRss(xml: string): Headline[] {
  const out: Headline[] = []
  const seen = new Set<string>()
  for (const chunk of xml.split(/<item[\s>]/i).slice(1)) {
    const title = tag(chunk, 'title')
    const href = tag(chunk, 'link')
    if (!title || !href || seen.has(href)) continue
    seen.add(href)
    out.push({ title, href, source: 'ESPN' })
  }
  return out
}

function rank(items: Headline[]): Headline[] {
  const keyed = items.map((item, i) => {
    const hay = item.title.toLowerCase()
    const hits = WIRE_TERMS.reduce((n, term) => n + (hay.includes(term.toLowerCase()) ? 1 : 0), 0)
    return { item, hits, i }
  })
  keyed.sort((a, b) => b.hits - a.hits || a.i - b.i)
  return keyed.map((row) => row.item)
}

async function loadFeed(): Promise<Headline[]> {
  const res = await fetch(FEED, {
    headers: {
      Accept: 'application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8',
      'User-Agent': 'TheBooth/1.0 (+https://the-booth.venues.prophecyhosting.com)',
    },
  })
  if (!res.ok) throw new Error(`wire ${res.status}`)
  const xml = await res.text()
  const parsed = parseRss(xml)
  return rank(parsed).slice(0, MAX_ITEMS)
}

async function headlines(): Promise<Headline[]> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.items
  if (!inflight) {
    inflight = loadFeed()
      .then((items) => {
        cache = { at: Date.now(), items }
        return items
      })
      .finally(() => {
        inflight = null
      })
  }
  try {
    return await inflight
  } catch {
    return cache?.items ?? []
  }
}

export async function GET() {
  const items = await headlines()
  return Response.json(
    { source: 'ESPN', items },
    {
      headers: {
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
      },
    },
  )
}

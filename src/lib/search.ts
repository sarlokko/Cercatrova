import { type Category, type Deal, categoryLabel, deals } from '../data/deals'

export type SearchMode = 'generico' | 'specifico'

export type SearchFilters = {
  query: string
  mode: SearchMode
  category: 'all' | Category
  maxPrice: number | null
  onlyFree: boolean
}

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .trim()
}

function tokens(s: string) {
  return normalize(s)
    .split(/[^a-z0-9+]+/i)
    .filter((t) => t.length > 1)
}

function haystack(deal: Deal) {
  return normalize(
    [
      deal.title,
      deal.subtitle,
      categoryLabel[deal.category],
      deal.category,
      ...deal.tags,
      ...deal.merchants.map((m) => m.name),
    ].join(' '),
  )
}

/** Generic: any token match in title/tags/category. Specific: most tokens must hit the title. */
export function matchesDeal(deal: Deal, filters: SearchFilters): boolean {
  if (filters.category !== 'all' && deal.category !== filters.category) return false
  if (filters.onlyFree && !deal.isFree) return false
  if (filters.maxPrice != null && deal.currentPrice > filters.maxPrice) return false

  const q = filters.query.trim()
  if (!q) return true

  const qTokens = tokens(q)
  if (qTokens.length === 0) return true

  const title = normalize(deal.title)
  const all = haystack(deal)

  if (filters.mode === 'specifico') {
    const hit = qTokens.filter((t) => title.includes(t)).length
    return hit >= Math.ceil(qTokens.length * 0.7)
  }

  // generico: category-ish / keyword search across tags + subtitle
  return qTokens.some((t) => all.includes(t))
}

export function searchDeals(filters: SearchFilters, source: Deal[] = deals): Deal[] {
  return source
    .filter((d) => matchesDeal(d, filters))
    .sort((a, b) => {
      if (a.currentPrice !== b.currentPrice) return a.currentPrice - b.currentPrice
      return b.discountPct - a.discountPct
    })
}

export const genericSuggestions = [
  { label: 'HDD NAS', query: 'HDD NAS', category: 'nas' as const },
  { label: 'SSD NVMe', query: 'SSD NVMe', category: 'nas' as const },
  { label: 'RAM SODIMM', query: 'RAM', category: 'nas' as const },
  { label: 'Software gratis', query: 'gratis', category: 'software' as const },
  { label: 'Lifetime deal', query: 'lifetime', category: 'software' as const },
  { label: 'AI crediti', query: 'AI crediti', category: 'software' as const },
  { label: 'Giochi gratis PC', query: 'gratis PC', category: 'gaming' as const },
]

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
    .replace(/[’']/g, ' ')
    .trim()
}

function tokens(s: string) {
  return normalize(s)
    .split(/[^a-z0-9+]+/i)
    .filter((t) => t.length > 1 && !STOP.has(t))
}

const STOP = new Set(['per', 'del', 'della', 'dei', 'delle', 'con', 'una', 'uno', 'the', 'and'])

/** Gruppi di sinonimi: cerchi “hdd” e trovi WD Red / NAS disk, senza scegliere dal menu. */
const GROUPS: string[][] = [
  ['hdd', 'hard', 'disk', 'disco', 'rigido', 'harddisk', 'wd', 'red', 'ironwolf', 'cmr', 'tb'],
  ['ssd', 'nvme', 'samsung', '990', 'nvme'],
  ['ram', 'memoria', 'sodimm', 'ddr', 'ddr4', 'crucial'],
  ['nas', 'synology', 'qnap', 'terramaster', 'storage', 'bay', 'ds224'],
  ['gratis', 'free', 'zero', 'omaggio'],
  ['lifetime', 'licenza', 'perpetua'],
  ['ai', 'crediti', 'midjourney', 'chatgpt'],
  ['mac', 'macos', 'cleanmymac'],
  ['gioco', 'giochi', 'game', 'games', 'steam', 'epic', 'pc'],
  ['coupon', 'sconto', 'promo', 'offerta'],
]

const ALIAS = new Map<string, string[]>()
for (const group of GROUPS) {
  for (const word of group) {
    const extra = ALIAS.get(word) ?? []
    ALIAS.set(word, [...new Set([...extra, ...group])])
  }
}

function expand(query: string) {
  const raw = tokens(query)
  const out = new Set(raw)
  for (const t of raw) {
    const aliases = ALIAS.get(t)
    if (aliases) aliases.forEach((a) => out.add(a))
  }
  return { raw, expanded: [...out] }
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

function scoreDeal(deal: Deal, filters: SearchFilters): number {
  if (filters.category !== 'all' && deal.category !== filters.category) return -1
  if (filters.onlyFree && !deal.isFree) return -1
  if (filters.maxPrice != null && deal.currentPrice > filters.maxPrice) return -1

  const q = filters.query.trim()
  if (!q) return 1

  const { raw, expanded } = expand(q)
  if (raw.length === 0) return 1

  const title = normalize(deal.title)
  const all = haystack(deal)
  const wantsFree = expanded.includes('gratis') || expanded.includes('free') || expanded.includes('zero')

  if (filters.mode === 'specifico') {
    const hit = raw.filter((t) => title.includes(t) || deal.tags.some((tag) => normalize(tag).includes(t))).length
    if (hit < Math.ceil(raw.length * 0.5)) return -1
  }

  let score = 0
  for (const t of expanded) {
    if (title.includes(t)) score += 6
    else if (deal.tags.some((tag) => normalize(tag) === t || normalize(tag).includes(t))) score += 5
    else if (all.includes(t)) score += 2
  }

  if (wantsFree && deal.isFree) score += 8
  if (raw.some((t) => title.includes(t))) score += 3

  return score > 0 ? score : -1
}

export function matchesDeal(deal: Deal, filters: SearchFilters): boolean {
  return scoreDeal(deal, filters) >= 0
}

export function searchDeals(filters: SearchFilters, source: Deal[] = deals): Deal[] {
  return source
    .map((d) => ({ d, s: scoreDeal(d, filters) }))
    .filter((x) => x.s >= 0)
    .sort((a, b) => {
      if (b.s !== a.s) return b.s - a.s
      if (a.d.currentPrice !== b.d.currentPrice) return a.d.currentPrice - b.d.currentPrice
      return b.d.discountPct - a.d.discountPct
    })
    .map((x) => x.d)
}

export const genericSuggestions = [
  { label: 'HDD NAS', query: 'hdd nas', category: 'nas' as const },
  { label: 'SSD NVMe', query: 'ssd nvme', category: 'nas' as const },
  { label: 'RAM SODIMM', query: 'ram sodimm', category: 'nas' as const },
  { label: 'Software gratis', query: 'software gratis', category: 'software' as const },
  { label: 'Lifetime deal', query: 'lifetime', category: 'software' as const },
  { label: 'AI crediti', query: 'ai crediti', category: 'software' as const },
  { label: 'Giochi gratis PC', query: 'giochi gratis pc', category: 'gaming' as const },
]

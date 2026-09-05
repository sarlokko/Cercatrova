import {
  type Category,
  type Deal,
  categoryLabel,
  deals,
  guessCategory,
  makeLookupDeal,
} from '../data/deals'
import { withVerdict } from './timing'

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
  ['hdd', 'harddisk', 'disco', 'rigido', 'ironwolf', 'cmr'],
  ['ssd', 'nvme'],
  ['ram', 'memoria', 'sodimm', 'ddr', 'ddr4', 'crucial'],
  ['nas', 'synology', 'qnap', 'terramaster', 'ugreen', 'ugos', 'nasync', 'storage', 'bay', 'ds224'],
  ['ugreen', 'ugos', 'nasync', 'dxp', 'dxp2800', '2800', 'dxp4800', '4800'],
  ['gratis', 'free', 'zero', 'omaggio'],
  ['lifetime', 'licenza', 'perpetua'],
  ['ai', 'crediti', 'midjourney'],
  ['mac', 'macos', 'cleanmymac'],
  ['gioco', 'giochi', 'game', 'games', 'steam', 'epic', 'gog', 'humble', 'videogioco'],
  ['android', 'play', 'playstore'],
  ['ios', 'iphone', 'ipad', 'appstore'],
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

function withinBudget(deal: Deal, filters: SearchFilters) {
  if (filters.onlyFree && !deal.isFree) return false
  if (
    filters.maxPrice != null &&
    !deal.priceUnknown &&
    !deal.isFree &&
    deal.currentPrice > filters.maxPrice
  ) {
    return false
  }
  return true
}

function scoreDeal(deal: Deal, filters: SearchFilters): number {
  if (filters.category !== 'all' && deal.category !== filters.category) return -1

  const q = filters.query.trim()
  if (!q) return 1

  const { raw, expanded } = expand(q)
  if (raw.length === 0) return 1

  const titleTok = new Set(tokens(deal.title))
  const allTok = new Set(tokens(haystack(deal)))
  const tagTok = new Set(deal.tags.flatMap((tag) => tokens(tag)))
  const wantsFree = expanded.includes('gratis') || expanded.includes('free') || expanded.includes('zero')

  if (filters.mode === 'specifico') {
    const hit = raw.filter((t) => titleTok.has(t) || tagTok.has(t)).length
    if (hit < Math.ceil(raw.length * 0.5)) return -1
  }

  let score = 0
  for (const t of expanded) {
    if (titleTok.has(t)) score += 6
    else if (tagTok.has(t)) score += 5
    else if (allTok.has(t)) score += 2
  }

  if (wantsFree && deal.isFree) score += 8
  if (raw.some((t) => titleTok.has(t) || tagTok.has(t) || allTok.has(t))) score += 4

  return score > 0 ? score : -1
}

export function matchesDeal(deal: Deal, filters: SearchFilters): boolean {
  return scoreDeal(deal, filters) >= 0 && withinBudget(deal, filters)
}

export function searchDeals(filters: SearchFilters, source: Deal[] = deals): Deal[] {
  const scored = source
    .map((d) => ({ d, s: scoreDeal(d, filters) }))
    .filter((x) => x.s >= 0)

  const ranked = scored
    .filter((x) => withinBudget(x.d, filters))
    .sort((a, b) => {
      if (b.s !== a.s) return b.s - a.s
      if (a.d.priceUnknown !== b.d.priceUnknown) return a.d.priceUnknown ? 1 : -1
      if (a.d.currentPrice !== b.d.currentPrice) return a.d.currentPrice - b.d.currentPrice
      return b.d.discountPct - a.d.discountPct
    })
    .map((x) => x.d)

  if (ranked.length > 0) return ranked.map(withVerdict)
  if (scored.length > 0) return []

  const q = filters.query.trim()
  if (q.length >= 2 && !filters.onlyFree) {
    const category = filters.category === 'all' ? guessCategory(q) : filters.category
    return [withVerdict(makeLookupDeal(q, category))]
  }

  return []
}

export const genericSuggestions = [
  { label: 'UGREEN NAS', query: 'ugreen 2800', category: 'nas' as const },
  { label: 'HDD NAS', query: 'hdd nas', category: 'nas' as const },
  { label: 'SSD NVMe', query: 'ssd nvme', category: 'nas' as const },
  { label: 'Steam in sconto', query: 'steam sconto', category: 'steam' as const },
  { label: 'App Android', query: 'android a pagamento', category: 'android' as const },
  { label: 'App iOS', query: 'ios a pagamento', category: 'ios' as const },
  { label: 'Software gratis', query: 'software gratis', category: 'software' as const },
]

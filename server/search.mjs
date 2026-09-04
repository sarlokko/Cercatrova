import { assembleProduct } from './product.mjs'
import { listCatalog, listingId, upsertListing, upsertProduct } from './db.mjs'
import { liveSearchExtras, refreshProduct } from './engine.mjs'

const STOP = new Set(['per', 'del', 'della', 'dei', 'delle', 'con', 'una', 'uno', 'the', 'and'])

const GROUPS = [
  ['hdd', 'harddisk', 'disco', 'rigido', 'ironwolf', 'cmr'],
  ['ssd', 'nvme'],
  ['ram', 'memoria', 'sodimm', 'ddr', 'ddr4', 'crucial'],
  ['nas', 'synology', 'qnap', 'terramaster', 'ugreen', 'ugos', 'nasync', 'storage', 'bay', 'ds224'],
  ['ugreen', 'ugos', 'nasync', 'dxp', 'dxp2800', '2800', 'dxp4800', '4800'],
  ['gratis', 'free', 'zero'],
  ['gioco', 'giochi', 'game', 'games', 'steam', 'epic', 'gog'],
  ['android', 'play', 'playstore'],
  ['ios', 'iphone', 'ipad', 'appstore'],
]

const ALIAS = new Map()
for (const group of GROUPS) {
  for (const word of group) {
    ALIAS.set(word, [...new Set([...(ALIAS.get(word) || []), ...group])])
  }
}

function normalize(s) {
  return String(s)
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[’']/g, ' ')
    .trim()
}

function tokens(s) {
  return normalize(s)
    .split(/[^a-z0-9+]+/i)
    .filter((t) => t.length > 1 && !STOP.has(t))
}

function expand(query) {
  const raw = tokens(query)
  const out = new Set(raw)
  for (const t of raw) (ALIAS.get(t) || []).forEach((a) => out.add(a))
  return { raw, expanded: [...out] }
}

function score(product, filters) {
  if (filters.category !== 'all' && product.category !== filters.category) return -1
  if (filters.onlyFree && !product.isFree) return -1
  if (
    filters.maxPrice != null &&
    !product.priceUnknown &&
    !product.isFree &&
    product.currentPrice > filters.maxPrice
  ) {
    return -1
  }
  const q = filters.query.trim()
  if (!q) return 1
  const { raw, expanded } = expand(q)
  if (!raw.length) return 1
  const titleTok = new Set(tokens(product.title))
  const allTok = new Set(tokens([product.title, product.subtitle, ...(product.tags || [])].join(' ')))
  if (filters.mode === 'specifico') {
    const hit = raw.filter((t) => titleTok.has(t) || allTok.has(t)).length
    if (hit < Math.ceil(raw.length * 0.5)) return -1
  }
  let s = 0
  for (const t of expanded) {
    if (titleTok.has(t)) s += 6
    else if (allTok.has(t)) s += 2
  }
  if (raw.some((t) => titleTok.has(t) || allTok.has(t))) s += 4
  return s > 0 ? s : -1
}

export function guessCategory(query) {
  const t = query.toLowerCase()
  if (/\b(ios|iphone|ipad|app store)\b/.test(t)) return 'ios'
  if (/\b(android|play store)\b/.test(t)) return 'android'
  if (/\b(steam|epic|gog|gioco|giochi|game|games)\b/.test(t)) return 'steam'
  if (/\b(office|windows|adobe|software)\b/.test(t)) return 'software'
  if (/\b(nas|ugreen|synology|qnap|hdd|ssd|nvme|wd|nasync|dxp)\b/.test(t)) return 'nas'
  return 'nas'
}

function slugify(value) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

function makeLookup(query, category) {
  const title = query.trim().replace(/\s+/g, ' ')
  const id = `q-${category}-${slugify(title)}`
  upsertProduct({
    id,
    title,
    subtitle:
      'Non era in catalogo. Apri i negozi e monitora: niente prezzo finché un collector non lo legge.',
    category,
    tags: ['ricerca', category, ...title.toLowerCase().split(/\s+/)],
    imageTone: '#1d3557',
    source: 'lookup',
  })
  const stores =
    category === 'steam'
      ? [
          ['Steam', `https://store.steampowered.com/search/?term=${encodeURIComponent(title)}`],
          ['Epic Games', `https://store.epicgames.com/it/browse?q=${encodeURIComponent(title)}`],
          ['GOG', `https://www.gog.com/en/games?query=${encodeURIComponent(title)}`],
        ]
      : category === 'android'
        ? [['Google Play', `https://play.google.com/store/search?q=${encodeURIComponent(title)}&c=apps`]]
        : category === 'ios'
          ? [['App Store', `https://apps.apple.com/it/search?term=${encodeURIComponent(title)}`]]
          : [
              ['Amazon', `https://www.amazon.it/s?k=${encodeURIComponent(title)}`],
              ['eBay', `https://www.ebay.it/sch/i.html?_nkw=${encodeURIComponent(title)}`],
            ]
  for (const [store, url] of stores) {
    upsertListing({
      id: listingId(id, store),
      productId: id,
      store,
      url,
    })
  }
  return assembleProduct(id)
}

export async function searchProducts(filters) {
  const seededOnly = !filters.query.trim()
  const local = listCatalog(filters.category === 'all' ? 'all' : filters.category, { seededOnly })
    .map((row) => assembleProduct(row.id))
    .filter(Boolean)
    .map((d) => ({ d, s: score(d, filters) }))
    .filter((x) => x.s >= 0)
    .sort((a, b) => b.s - a.s || (a.d.priceUnknown ? 1 : 0) - (b.d.priceUnknown ? 1 : 0))
    .map((x) => x.d)

  const stale = local.filter((d) => d.priceUnknown && !d.lookup).slice(0, 3)
  for (const d of stale) {
    await refreshProduct(d.id, { force: true })
  }
  const localFresh = stale.length
    ? local.map((d) => assembleProduct(d.id) || d)
    : local

  const q = filters.query.trim()
  let extra = []
  if (q.length >= 2 && !filters.onlyFree) {
    extra = await liveSearchExtras(q, filters.category)
  }

  const seen = new Set(localFresh.map((d) => d.id))
  const merged = [...localFresh]
  for (const d of extra) {
    if (!seen.has(d.id) && score(d, { ...filters, query: '' }) >= 0) {
      // extras already match the query from the store
      if (filters.maxPrice != null && !d.priceUnknown && !d.isFree && d.currentPrice > filters.maxPrice) {
        continue
      }
      merged.push(d)
      seen.add(d.id)
    }
  }

  if (merged.length) return merged
  if (q.length >= 2 && !filters.onlyFree) {
    return [makeLookup(q, filters.category === 'all' ? guessCategory(q) : filters.category)]
  }
  return []
}

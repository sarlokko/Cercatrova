import { assembleProduct } from './product.mjs'
import { listCatalog, listingId, upsertListing, upsertProduct } from './db.mjs'
import { liveSearchExtras, refreshProduct } from './engine.mjs'
import { gameStorefronts, hardwareStorefronts } from './collectors/stores.mjs'
import { isBrowseQuery, titleHasSpecific } from './lib/query-kind.mjs'

const STOP = new Set(['per', 'del', 'della', 'dei', 'delle', 'con', 'una', 'uno', 'the', 'and'])

const GROUPS = [
  ['hdd', 'harddisk', 'disco', 'rigido', 'ironwolf', 'cmr'],
  ['ssd', 'nvme'],
  ['ram', 'memoria', 'sodimm', 'dimm', 'ddr', 'ddr4', 'ddr5'],
  ['cpu', 'processore', 'ryzen', 'intel'],
  ['gpu', 'rtx', 'radeon', 'geforce'],
  ['case', 'cabinet', 'torre', 'chassis'],
  ['mobo', 'motherboard', 'b650', 'z790', 'z890'],
  ['psu', 'alimentatore'],
  ['cooler', 'dissipatore', 'aio'],
  ['nas', 'synology', 'qnap', 'terramaster', 'ugreen', 'ugos', 'nasync', 'storage', 'bay', 'ds224'],
  ['ugreen', 'ugos', 'nasync', 'dxp', 'dxp2800', '2800', 'dxp4800', '4800'],
  ['gratis', 'free', 'zero'],
  ['gioco', 'giochi', 'game', 'games', 'steam', 'epic', 'gog', 'playstation', 'xbox', 'prevendita', 'preordine', 'preorder'],
  ['action', 'azione'],
  ['adventure', 'avventura'],
  ['rpg'],
  ['shooter', 'sparatutto'],
  ['strategy', 'strategia'],
  ['simulation', 'simulazione', 'sim'],
  ['sport', 'sportivi'],
  ['racing', 'corse'],
  ['horror'],
  ['survival'],
  ['puzzle'],
  ['fighting', 'picchiaduro'],
  ['platformer', 'piattaforma', 'metroidvania'],
  ['indie'],
  ['open', 'world', 'mondo', 'aperto'],
  ['gta', 'gtavi'],
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
  if (raw.includes('gta') || raw.includes('gtavi')) {
    out.add('grand')
    out.add('theft')
    out.add('auto')
  }
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
  if (
    /\b(steam|epic|gog|gioco|giochi|game|games|humble|videogioco|playstation|xbox|ps5|ps4|prevendita|preordine|preorder|gta)\b/.test(
      t,
    )
  ) {
    return 'steam'
  }
  if (/\b(office|windows|adobe|software)\b/.test(t)) return 'software'
  if (
    /\b(cpu|gpu|ryzen|radeon|rtx|geforce|case|cabinet|mobo|motherboard|madre|psu|ddr5|ddr4|cooler|dissipatore|am5|b650|z790|z890|alimentatore|processore|componenti)\b/.test(
      t,
    )
  ) {
    return 'pc'
  }
  if (/\b(nas|ugreen|synology|qnap|nasync|dxp|ironwolf)\b/.test(t)) return 'nas'
  if (/\b(ram|ssd|nvme|hdd|wd)\b/.test(t)) return /\b(nas|red)\b/.test(t) ? 'nas' : 'pc'
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
      ? gameStorefronts(title).map((s) => [s.store, s.url])
      : category === 'android'
        ? [['Google Play', `https://play.google.com/store/search?q=${encodeURIComponent(title)}&c=apps`]]
        : category === 'ios'
          ? [['App Store', `https://apps.apple.com/it/search?term=${encodeURIComponent(title)}`]]
          : category === 'pc' || category === 'nas'
            ? hardwareStorefronts(title).map((s) => [s.store, s.url])
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

export function offerScore(d) {
  if (!d || d.priceUnknown) return -100
  if (d.isFree) return 80
  const pct = Number(d.discountPct) || 0
  const kind = d.verdict?.kind
  const bonus = kind === 'eccezionale' ? 40 : kind === 'ottimo' ? 25 : kind === 'gratis' ? 50 : 0
  return pct + bonus
}

export async function searchProducts(filters) {
  const q = filters.query.trim()
  const browse = isBrowseQuery(q)

  let extra = []
  if (q.length >= 2 && !filters.onlyFree) {
    extra = await liveSearchExtras(q, filters.category)
  }

  let local = listCatalog(filters.category === 'all' ? 'all' : filters.category, {
    seededOnly: !q,
  })
    .map((row) => assembleProduct(row.id))
    .filter(Boolean)
    .filter((d) => score(d, filters) >= 0)

  if (browse) {
    local = extra.length ? [] : local.filter((d) => !d.priceUnknown).slice(0, 4)
  } else if (q) {
    local = local.filter((d) => titleHasSpecific(d.title, q))
  }

  const stale = local.filter((d) => d.priceUnknown && !d.lookup).slice(0, 4)
  await Promise.all(stale.map((d) => refreshProduct(d.id, { force: true, quick: true })))

  const localFresh = local.map((d) => assembleProduct(d.id) || d)
  const seen = new Set()
  const merged = []
  for (const d of extra) {
    if (!d || seen.has(d.id)) continue
    if (filters.maxPrice != null && !d.priceUnknown && !d.isFree && d.currentPrice > filters.maxPrice) {
      continue
    }
    merged.push(d)
    seen.add(d.id)
  }
  for (const d of localFresh) {
    if (!d || seen.has(d.id)) continue
    if (filters.maxPrice != null && !d.priceUnknown && !d.isFree && d.currentPrice > filters.maxPrice) {
      continue
    }
    merged.push(d)
    seen.add(d.id)
  }

  const ranked = dedupeByTitle(merged).sort((a, b) => {
    if (a.priceUnknown !== b.priceUnknown) return a.priceUnknown ? 1 : -1
    return offerScore(b) - offerScore(a)
  })

  if (ranked.length) return ranked
  if (q.length >= 2 && !filters.onlyFree) {
    return [makeLookup(q, filters.category === 'all' ? guessCategory(q) : filters.category)]
  }
  return []
}

function titleKey(title) {
  return String(title || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/\((android|ios|iphone|ipad|pc|steam)\)/g, '')
    .replace(/[^a-z0-9]+/g, '')
}

function dedupeByTitle(rows) {
  const best = new Map()
  for (const row of rows) {
    const key = titleKey(row.title)
    if (!key) continue
    const prev = best.get(key)
    if (!prev) {
      best.set(key, row)
      continue
    }
    if (prev.priceUnknown && !row.priceUnknown) best.set(key, row)
    else if (!prev.priceUnknown && !row.priceUnknown && row.currentPrice < prev.currentPrice) {
      best.set(key, row)
    }
  }
  return [...best.values()]
}

import { fetchJson, fetchText, parseEuro } from './http.mjs'
import { isSearchUrl, pickBest, titleMatches } from './match.mjs'

export function hardwareStorefronts(title) {
  const q = encodeURIComponent(String(title).replace(/\s+/g, ' ').trim())
  return [
    { store: 'Amazon', url: `https://www.amazon.it/s?k=${q}` },
    { store: 'PcComponentes', url: `https://www.pccomponentes.it/buscar/?query=${q}` },
    { store: 'LDLC', url: `https://www.ldlc.com/it-it/recherche/?q=${q}` },
    { store: 'Alternate', url: `https://www.alternate.it/listing.xhtml?q=${q}` },
    { store: 'MediaWorld', url: `https://www.mediaworld.it/search?q=${q}` },
    { store: 'Unieuro', url: `https://www.unieuro.it/online/search?query=${q}` },
    { store: 'eBay', url: `https://www.ebay.it/sch/i.html?_nkw=${q}` },
  ]
}

export function gameStorefronts(title) {
  const q = encodeURIComponent(String(title).replace(/\s+/g, ' ').trim())
  return [
    { store: 'Steam', url: `https://store.steampowered.com/search/?term=${q}` },
    { store: 'GOG', url: `https://www.gog.com/en/games?query=${q}` },
    { store: 'Epic Games', url: `https://store.epicgames.com/it/browse?q=${q}` },
    { store: 'Instant Gaming', url: `https://www.instant-gaming.com/it/ricerca/?q=${q}` },
    { store: 'PlayStation Store', url: `https://store.playstation.com/it-it/search/${q}` },
    { store: 'Xbox', url: `https://www.microsoft.com/it-it/search/shop/games?q=${q}` },
  ]
}

export async function gogSearch(term) {
  const q = term.trim()
  if (q.length < 2) return []
  const url = `https://catalog.gog.com/v1/catalog?limit=8&query=${encodeURIComponent(q)}&countryCode=IT&currencyCode=EUR`
  const { json } = await fetchJson(url)
  const products = json?.products
  if (!Array.isArray(products)) return []
  const out = []
  for (const p of products) {
    const title = String(p.title || '')
    const amount = p.price?.finalMoney?.amount
    const price = amount != null ? parseEuro(String(amount).replace('.', ',')) ?? Number(amount) : null
    if (!title || price == null || !Number.isFinite(price)) continue
    if (!titleMatches(q, title)) continue
    out.push({
      title,
      price,
      list: p.price?.baseMoney?.amount != null ? Number(p.price.baseMoney.amount) : price,
      url: p.storeLink || `https://www.gog.com/en/game/${p.slug}`,
      externalId: String(p.id || p.slug || ''),
    })
  }
  return out
}

export async function instantGamingSearch(term) {
  const q = term.trim()
  if (q.length < 2) return []
  const url = `https://www.instant-gaming.com/it/ricerca/?q=${encodeURIComponent(q)}`
  const { ok, text } = await fetchText(url)
  if (!ok || !text) return []
  const out = []
  const re =
    /"name"\s*:\s*"([^"]{3,120})"[\s\S]{0,500}?"price"\s*:\s*(\d+(?:\.\d+)?)|"price"\s*:\s*(\d+(?:\.\d+)?)[\s\S]{0,500}?"name"\s*:\s*"([^"]{3,120})"/g
  let m
  while ((m = re.exec(text))) {
    const title = m[1] || m[4]
    const price = Number(m[2] || m[3])
    if (!title || !Number.isFinite(price) || price <= 0) continue
    if (!titleMatches(q, title)) continue
    if (/instant-gaming\.com/i.test(title)) continue
    out.push({
      title,
      price,
      url,
      externalId: title.toLowerCase().replace(/\s+/g, '-').slice(0, 40),
    })
    if (out.length >= 5) break
  }
  return out
}

export function bestStoreHit(hits, title) {
  return pickBest(hits, title)
}

export { isSearchUrl }

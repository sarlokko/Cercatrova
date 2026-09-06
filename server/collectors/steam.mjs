import { centsToEuro, fetchJson } from './http.mjs'

export async function steamAppPrice(appId) {
  const id = String(appId)
  const url = `https://store.steampowered.com/api/appdetails?appids=${encodeURIComponent(id)}&cc=it&l=italian`
  const { json } = await fetchJson(url)
  const block = json?.[id]
  if (!block?.success || !block.data) return null
  const data = block.data
  if (data.is_free) {
    return {
      title: data.name,
      price: 0,
      list: 0,
      available: 1,
      isFree: true,
      url: `https://store.steampowered.com/app/${id}/`,
    }
  }
  const ov = data.price_overview
  if (!ov) return null
  return {
    title: data.name,
    price: centsToEuro(ov.final),
    list: centsToEuro(ov.initial),
    available: 1,
    isFree: false,
    discountPct: ov.discount_percent ?? 0,
    url: `https://store.steampowered.com/app/${id}/`,
  }
}

export async function steamSearch(term) {
  const q = term.trim()
  if (q.length < 2) return []
  const url = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(q)}&cc=IT&l=italian`
  const { json } = await fetchJson(url)
  const items = json?.items
  if (!Array.isArray(items)) return []
  return items
    .filter((it) => it.type === 'app' && it.id)
    .slice(0, 16)
    .map((it) => mapSteamSearchItem(it))
}

export function mapSteamSearchItem(it) {
  const price = it.price ? centsToEuro(it.price.final) : it.price === 0 ? 0 : null
  const list = it.price ? centsToEuro(it.price.initial) : null
  const discountPct =
    list != null && price != null && list > price ? Math.round((1 - price / list) * 100) : 0
  return {
    appId: String(it.id),
    title: it.name,
    price,
    list,
    discountPct,
    url: `https://store.steampowered.com/app/${it.id}/`,
  }
}

export function parseSteamFeatured(json, limit = 16) {
  const seen = new Set()
  const out = []
  for (const key of ['specials', 'top_sellers']) {
    const items = json?.[key]?.items
    if (!Array.isArray(items)) continue
    for (const it of items) {
      const id = String(it.id || '')
      if (!id || seen.has(id)) continue
      seen.add(id)
      const price = centsToEuro(it.final_price)
      if (price == null) continue
      const list = centsToEuro(it.original_price) ?? price
      out.push({
        appId: id,
        title: it.name,
        price,
        list,
        discountPct: Number(it.discount_percent) || 0,
        url: `https://store.steampowered.com/app/${id}/`,
      })
    }
  }
  return out.sort((a, b) => (b.discountPct || 0) - (a.discountPct || 0)).slice(0, limit)
}

/** Offerte e top seller Steam IT, non un catalogo fermo. */
export async function steamSpecials(limit = 16) {
  const url = 'https://store.steampowered.com/api/featuredcategories?cc=IT&l=italian'
  const { json } = await fetchJson(url)
  if (!json) return []
  return parseSteamFeatured(json, limit)
}

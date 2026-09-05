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
    .slice(0, 8)
    .map((it) => ({
      appId: String(it.id),
      title: it.name,
      price: it.price ? centsToEuro(it.price.final) : it.price === 0 ? 0 : null,
      list: it.price ? centsToEuro(it.price.initial) : null,
      url: `https://store.steampowered.com/app/${it.id}/`,
    }))
}

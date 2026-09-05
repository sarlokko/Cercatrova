import { fetchJson } from './http.mjs'
import { titleMatches } from './match.mjs'

const XBOX_SUGGEST =
  'https://www.microsoft.com/msstoreapiprod/api/autosuggest?market=it-it&clientId=7F27B536-CF6B-4C65-8638-A0F8CBDFCA65&sources=DCatAll-Products&filter=+ClientType:StoreWeb&counts=10&query='

const GAME_NOISE =
  /\b(prevendita|preordine|preorder|playstation|xbox|steam|epic|gog|console|store|gioco|giochi|game|games|ios|android|iphone|ipad)\b/gi

const ROMAN = { 2: 'ii', 3: 'iii', 4: 'iv', 5: 'v', 6: 'vi', 7: 'vii', 8: 'viii' }

export function cleanGameQuery(query) {
  const cleaned = String(query || '')
    .replace(GAME_NOISE, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return cleaned.length >= 2 ? cleaned : String(query || '').trim()
}

export function expandGameQuery(query) {
  let q = cleanGameQuery(query).replace(/\bgta\b/gi, 'grand theft auto')
  q = q.replace(/\bgtavi\b/gi, 'grand theft auto vi')
  q = q.replace(/\b([2-8])\b/g, (_, n) => ROMAN[n] || n)
  return q.replace(/\s+/g, ' ').trim()
}

export function gameTitleMatches(query, title) {
  return titleMatches(query, title) || titleMatches(expandGameQuery(query), title)
}

export function extractXboxId(url) {
  const m = String(url || '').match(/\/(9[A-Z0-9]{11})(?:[/?#]|$)/i)
  return m?.[1]?.toUpperCase() ?? null
}

export function xboxProductUrl(bigId, title) {
  const slug = String(title || 'game')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return `https://www.xbox.com/it-IT/games/store/${slug || 'game'}/${bigId}`
}

export function playstationStoreUrl(title) {
  const q = encodeURIComponent(String(title).replace(/\s+/g, ' ').trim())
  return `https://store.playstation.com/it-it/search/${q}`
}

export function xboxStoreUrl(title) {
  const q = encodeURIComponent(String(title).replace(/\s+/g, ' ').trim())
  return `https://www.microsoft.com/it-it/search/shop/games?q=${q}`
}

export async function xboxProduct(bigId) {
  const id = String(bigId || '').trim()
  if (!id) return null
  const url = `https://displaycatalog.mp.microsoft.com/v7.0/products?bigIds=${encodeURIComponent(id)}&market=IT&languages=it-it&MS-CV=0.0`
  const { json } = await fetchJson(url)
  const product = json?.Products?.[0]
  if (!product) return null
  const title = product.LocalizedProperties?.[0]?.ProductTitle || null
  const avails = product.DisplaySkuAvailabilities?.[0]?.Availabilities || []
  let best = null
  for (const a of avails) {
    const price = a?.OrderManagementData?.Price
    const amount = Number(price?.ListPrice)
    if (!Number.isFinite(amount) || amount <= 0) continue
    const preorder =
      (a.Actions || []).includes('Preorder') || /preorder|preordine|prevendita/i.test(title || '')
    if (!best || amount < best.price) {
      best = { price: amount, list: Number(price.MSRP) || amount, preorder }
    }
  }
  const storeUrl = xboxProductUrl(id, title)
  if (!best) {
    return {
      title,
      price: null,
      list: null,
      preorder: /preordine|preorder|prevendita/i.test(title || ''),
      url: storeUrl,
      externalId: id,
    }
  }
  return { title, ...best, url: storeUrl, externalId: id }
}

export function parseXboxSuggests(json, query) {
  const suggests = (json?.ResultSets || []).flatMap((s) => s.Suggests || [])
  const games = []
  for (const s of suggests) {
    const type = (s.Metas || []).find((m) => m.Key === 'ProductType')?.Value
    if (type && type !== 'Games') continue
    const title = String(s.Title || '')
    if (!title) continue
    const id = (s.Metas || []).find((m) => m.Key === 'BigCatalogId')?.Value
    const path = String(s.Url || '').replace(/^\/\//, 'https://')
    games.push({
      title,
      externalId: id || extractXboxId(path) || '',
      url: path.startsWith('http')
        ? path
        : xboxStoreUrl(title),
      preorder: /preordine|preorder|prevendita/i.test(title),
    })
    if (games.length >= 8) break
  }
  const matched = games.filter((g) => gameTitleMatches(query, g.title))
  if (matched.length) return matched.slice(0, 6)
  if (/\b(gta|gtavi)\b/i.test(query) && games[0]) return [games[0]]
  return []
}

export async function xboxSearch(term) {
  const q = cleanGameQuery(term)
  if (q.length < 2) return []
  const { json } = await fetchJson(XBOX_SUGGEST + encodeURIComponent(q))
  const hits = parseXboxSuggests(json, q)
  const out = []
  for (const hit of hits) {
    const live = hit.externalId ? await xboxProduct(hit.externalId) : null
    out.push({
      ...hit,
      title: live?.title || hit.title,
      price: live?.price ?? null,
      list: live?.list ?? null,
      preorder: live?.preorder || hit.preorder,
      url: live?.url || hit.url,
      externalId: live?.externalId || hit.externalId,
    })
    if (out.length >= 4) break
  }
  return out
}

export function parseItunesResults(json, query, { gamesOnly = false } = {}) {
  const rows = Array.isArray(json?.results) ? json.results : []
  const out = []
  for (const r of rows) {
    const title = String(r.trackName || '')
    if (!title) continue
    if (gamesOnly && r.primaryGenreName !== 'Games') continue
    if (query && !titleMatches(query, title) && !gameTitleMatches(query, title)) continue
    const price = Number(r.price)
    if (!Number.isFinite(price) || price < 0) continue
    out.push({
      title,
      price,
      url: r.trackViewUrl,
      externalId: String(r.trackId || ''),
      genre: r.primaryGenreName,
    })
    if (out.length >= 6) break
  }
  return out
}

export async function itunesSearch(term, { gamesOnly = false } = {}) {
  const q = cleanGameQuery(term)
  if (q.length < 2) return []
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&entity=software&country=it&limit=10`
  const { json } = await fetchJson(url)
  return parseItunesResults(json, q, { gamesOnly })
}

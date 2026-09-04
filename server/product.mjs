import { getProductRow, listingsFor, priceHistory } from './db.mjs'
import { judgePrice, kindFromVerdict } from './verdict.mjs'

export function assembleProduct(id) {
  const row = getProductRow(id)
  if (!row) return null
  const listings = listingsFor(id)
  const historyRows = priceHistory(id, 180)
  const priced = listings.filter((l) => l.last_price != null)
  const free = row.free === 1 || priced.some((l) => Number(l.last_price) === 0 && /libre|vlc|videolan/i.test(l.store))
  const current = free
    ? 0
    : priced.length
      ? Math.min(...priced.map((l) => Number(l.last_price)))
      : null
  const listCandidates = listings.map((l) => l.list_price).filter((n) => n != null)
  const list = listCandidates.length ? Math.max(...listCandidates.map(Number)) : null
  const samples = historyRows.length
  const histPrices = historyRows.map((h) => Number(h.price)).filter((n) => Number.isFinite(n))
  const min = histPrices.length ? Math.min(...histPrices) : current
  const avg =
    histPrices.length >= 2
      ? Math.round((histPrices.reduce((a, b) => a + b, 0) / histPrices.length) * 100) / 100
      : null

  const checked =
    listings
      .map((l) => l.last_checked)
      .filter(Boolean)
      .sort()
      .at(-1) || row.created_at

  const verdict = judgePrice({
    current,
    avg,
    min,
    list,
    isFree: free,
    sampleCount: samples,
  })

  const merchants = listings.map((l) => ({
    name: l.store,
    price: l.last_price == null ? 0 : Number(l.last_price),
    url: l.url,
    shipping: l.last_checked
      ? l.available === 0
        ? 'non disponibile al buybox'
        : `rilevato ${l.last_checked.slice(0, 16).replace('T', ' ')}`
      : 'non ancora interrogato',
  }))

  const history = dailyMins(historyRows)
  const lookup = row.source === 'lookup'
  const unknown = current == null && !free

  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    category: row.category,
    kind: kindFromVerdict(verdict, lookup),
    currentPrice: current ?? 0,
    normalPrice: list ?? avg ?? current ?? 0,
    currency: '€',
    discountPct:
      list && current != null && current < list ? Math.round((1 - current / list) * 100) : 0,
    avgPrice: avg ?? 0,
    minPrice6m: min ?? 0,
    isFree: Boolean(free),
    priceUnknown: unknown,
    lookup,
    imageTone: row.image_tone,
    merchants,
    history,
    tags: safeJson(row.tags),
    checkedAt: checked,
    verdict,
    live: listings.some((l) => l.last_checked),
    sampleCount: samples,
  }
}

function dailyMins(rows) {
  const byDay = new Map()
  for (const r of rows) {
    const day = String(r.collectedAt).slice(0, 10)
    const price = Number(r.price)
    if (!Number.isFinite(price)) continue
    const prev = byDay.get(day)
    if (prev == null || price < prev) byDay.set(day, price)
  }
  return [...byDay.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, price]) => ({ date, price }))
}

function safeJson(raw) {
  try {
    const v = JSON.parse(raw)
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
}

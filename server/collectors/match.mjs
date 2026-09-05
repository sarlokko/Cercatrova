const STOP = new Set([
  'con',
  'per',
  'the',
  'and',
  'di',
  'del',
  'della',
  'dei',
  'una',
  'uno',
  'amd',
  'intel',
])

export function tokens(s) {
  return String(s)
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .split(/[^a-z0-9+]+/i)
    .filter((t) => t.length > 1 && !STOP.has(t))
}

export function titleMatches(query, title) {
  const q = tokens(query)
  if (!q.length) return true
  const hay = String(title).toLowerCase()
  const distinctive = q.filter((t) => t.length >= 4 || /\d/.test(t))
  if (distinctive.length && !distinctive.some((t) => hay.includes(t))) return false
  const hits = q.filter((t) => hay.includes(t)).length
  return hits >= Math.min(2, q.length)
}

export function pickBest(hits, query) {
  if (!hits?.length) return null
  const scored = hits
    .map((h) => {
      const hay = String(h.title || '').toLowerCase()
      const q = tokens(query)
      const score = q.reduce((s, t) => s + (hay.includes(t) ? (/\d/.test(t) ? 6 : 2) : 0), 0)
      return { h, score }
    })
    .sort((a, b) => b.score - a.score || a.h.price - b.h.price)
  return scored[0]?.score > 0 ? scored[0].h : hits[0]
}

export function isSearchUrl(url) {
  return /[?&](k|q|query|_nkw)=|\/s\?|\/search|\/buscar|\/recherche|\/listing\.xhtml|\/ricerca/i.test(
    String(url || ''),
  )
}

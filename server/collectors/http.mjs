const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'

export async function fetchText(url, { timeoutMs = 12000, headers = {} } = {}) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        'User-Agent': UA,
        'Accept-Language': 'it-IT,it;q=0.9,en;q=0.6',
        Accept: 'text/html,application/json;q=0.9,*/*;q=0.8',
        ...headers,
      },
      redirect: 'follow',
    })
    const text = await res.text()
    return { ok: res.ok, status: res.status, text }
  } catch (err) {
    return { ok: false, status: 0, text: '', error: err instanceof Error ? err.message : 'fetch' }
  } finally {
    clearTimeout(t)
  }
}

export async function fetchJson(url, opts) {
  const r = await fetchText(url, {
    ...opts,
    headers: { Accept: 'application/json', ...(opts?.headers || {}) },
  })
  if (!r.ok) return { ...r, json: null }
  try {
    return { ...r, json: JSON.parse(r.text) }
  } catch {
    return { ...r, json: null }
  }
}

export function parseEuro(raw) {
  if (raw == null) return null
  const s = String(raw)
    .replace(/\u00a0/g, ' ')
    .replace(/[€\s]/g, '')
    .replace(/\.(?=\d{3}\b)/g, '')
    .replace(',', '.')
  const n = Number(s)
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : null
}

export function centsToEuro(cents) {
  if (cents == null) return null
  const n = Number(cents)
  if (!Number.isFinite(n)) return null
  return Math.round(n) / 100
}

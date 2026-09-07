import { fetchText, parseEuro } from './http.mjs'
import { titleMatches } from './match.mjs'
import { looksBlocked, markAmazonBlocked, noteStoreResult, paceAmazon } from './guard.mjs'
import { expandMarketQueries, isBrowseQuery } from '../lib/query-kind.mjs'

/** Estrae un prezzo dal HTML Amazon solo se è ancorato al prodotto, non ai caroselli. */
export function parseAmazonProduct(html) {
  if (!html) return { price: null, available: null, title: null }
  if (/sorry.*automated|enter the characters|captcha/i.test(html) && html.length < 20000) {
    return { price: null, available: null, title: null, blocked: true }
  }
  if (html.length < 80) return { price: null, available: null, title: null }

  const titleMatch =
    html.match(/id="productTitle"[^>]*>\s*([^<]+)/i) || html.match(/<title>([^<]+)/i)
  const title = titleMatch ? decode(titleMatch[1]).replace(/\s+/g, ' ').trim() : null

  const unavailable = /attualmente non disponibile|currently unavailable/i.test(html)

  const og = html.match(/property="og:price:amount"\s+content="([^"]+)"/i)
  if (og) {
    const price = parseEuro(og[1])
    if (price != null) return { price, available: unavailable ? 0 : 1, title }
  }

  const olp = html.match(/olpMessage":"([^"]+)"/)
  if (olp) {
    const price = parseEuro((olp[1].match(/(\d+[.,]\d{2})/) || [])[1])
    if (price != null) return { price, available: unavailable ? 0 : 1, title }
  }

  const da = html.match(/(\d+)\s+opzioni da\s+(\d+[.,]\d{2})\s*€/i)
  if (da) {
    const price = parseEuro(da[2])
    if (price != null) return { price, available: unavailable ? 0 : 1, title }
  }

  const core = html.match(
    /id="corePriceDisplay_desktop_feature_div"[\s\S]{0,1800}?class="a-offscreen">([^<]+)/,
  )
  if (core) {
    const price = parseEuro(core[1])
    if (price != null) return { price, available: unavailable ? 0 : 1, title }
  }

  const jsonLd = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi) || []
  for (const block of jsonLd) {
    const raw = block.replace(/^<script[^>]*>/i, '').replace(/<\/script>$/i, '')
    try {
      const data = JSON.parse(raw)
      const nodes = Array.isArray(data) ? data : [data]
      for (const node of nodes) {
        const offers = node.offers
        const offer = Array.isArray(offers) ? offers[0] : offers
        if (offer?.price) {
          const price = parseEuro(offer.price)
          if (price != null) {
            return {
              price,
              available: /instock/i.test(String(offer.availability || '')) ? 1 : unavailable ? 0 : 1,
              title: title || node.name || null,
            }
          }
        }
      }
    } catch {
      /* ignore */
    }
  }

  return { price: null, available: unavailable ? 0 : null, title }
}

export async function amazonProduct(urlOrAsin) {
  const url = urlOrAsin.startsWith('http')
    ? urlOrAsin
    : `https://www.amazon.it/dp/${urlOrAsin}`
  if (url.includes('/s?')) return { price: null, available: null, title: null, url }
  if (!(await paceAmazon())) {
    return { price: null, available: null, title: null, url, blocked: true }
  }
  const { ok, text, status } = await fetchText(url)
  const parsed = ok ? parseAmazonProduct(text) : { price: null, available: null, title: null }
  if (parsed.blocked || looksBlocked(text, status)) {
    markAmazonBlocked(parsed.blocked ? 'captcha' : `http ${status}`)
    return { ...parsed, blocked: true, url, status }
  }
  noteStoreResult('Amazon', parsed.price != null, { reason: parsed.price == null ? 'no-price' : undefined })
  if (!ok) return { price: null, available: null, title: null, url, status }
  return { ...parsed, url }
}

export function parseAmazonSearch(html, query, { max = 16, browse } = {}) {
  if (!html || html.length < 80) return []
  if (looksBlocked(html)) return []
  const seen = new Set()
  const out = []
  const re = /data-asin="([A-Z0-9]{10})"/g
  const family = browse === true || (query ? isBrowseQuery(query) : false)
  let m
  while ((m = re.exec(html))) {
    const asin = m[1]
    if (seen.has(asin) || /^0+$/.test(asin)) continue
    seen.add(asin)
    const chunk = html.slice(m.index, m.index + 14000)
    const name = amazonCardTitle(chunk)
    if (!name) continue
    const price = amazonCardPrice(chunk)
    if (price == null) continue
    if (isAccessoryTitle(name, query)) continue
    if (query && !family && !titleMatches(query, name)) continue
    if (query && family && !titleFitsFamily(query, name)) continue
    out.push({
      asin,
      title: name,
      price,
      url: `https://www.amazon.it/dp/${asin}`,
    })
    if (out.length >= max) break
  }
  return out
}

function isAccessoryTitle(name, query) {
  const n = String(name || '')
  const q = String(query || '')
  if (/pasta termica|thermal paste|anti-sag|gpu sag|staffa (gpu|scheda)|riser pcie/i.test(n)) {
    return true
  }
  if (/cavo (hdmi|displayport|dp\b|usb)|hdmi 2\.\d/i.test(n) && !/cavo|hdmi/i.test(q)) {
    return true
  }
  if (/custodia|pellicola/i.test(n) && !/custodia|cover/i.test(q)) return true
  return false
}

/** Browse: tieni CPU/GPU vere, non il primo oggetto del carosello. */
export function titleFitsFamily(query, title) {
  const q = String(query || '').toLowerCase()
  const t = String(title || '').toLowerCase()
  if (/\b(cpu|processore|ryzen|intel core)\b/.test(q)) {
    return /\b(ryzen|threadripper|intel|core i[3579]|core ultra|processore|cpu|xeon)\b/i.test(t)
  }
  if (/\b(gpu|rtx|radeon|geforce|scheda video)\b/.test(q)) {
    return /\b(rtx|geforce|radeon|rx \d|scheda (video|grafica)|gpu)\b/i.test(t)
  }
  if (/\b(ram|ddr5|ddr4|sodimm)\b/.test(q)) {
    return /\b(ram|ddr4|ddr5|sodimm|dimm|memoria)\b/i.test(t)
  }
  if (/\b(ssd|nvme)\b/.test(q)) {
    return /\b(ssd|nvme|m\.2|sata)\b/i.test(t)
  }
  if (/\b(psu|alimentatore)\b/.test(q)) {
    return /\b(alimentatore|psu|\d+\s*w|watt)\b/i.test(t)
  }
  if (/\b(case|cabinet|mid tower|mini itx|full tower)\b/.test(q)) {
    return /\b(case|cabinet|tower|itx|chassis)\b/i.test(t)
  }
  if (/\b(scheda madre|motherboard|am5|z790|z890)\b/.test(q)) {
    return /\b(scheda madre|motherboard|mainboard|am5|lga)\b/i.test(t)
  }
  if (/\bnas\b/.test(q)) {
    return /\bnas\b/i.test(t)
  }
  return true
}

function amazonCardTitle(chunk) {
  const h2 = chunk.match(/<h2[\s\S]{0,600}?<span[^>]*>\s*([^<]{8,220})/)
  const raw = h2?.[1] || (chunk.match(/<h2[^>]*aria-label="([^"]{8,220})"/) || [])[1]
  const name = decode(raw || '')
    .replace(/\s+/g, ' ')
    .trim()
  if (!name || /aggiungi al carrello|add to cart|scopri di più/i.test(name)) return ''
  return name
}

function amazonCardPrice(chunk) {
  const off = chunk.match(/class="a-offscreen">\s*([^<]+)/)
  if (off) {
    const price = parseEuro(off[1])
    if (price != null && price > 0) return price
  }
  const whole = (chunk.match(/class="a-price-whole">\s*([^<]+)/) || [])[1]
  if (!whole) return null
  const frac = (chunk.match(/class="a-price-fraction">\s*([^<]+)/) || [])[1] || '00'
  return parseEuro(`${String(whole).replace(/[^\d]/g, '')},${frac}`)
}

const AMAZON_BROWSE = {
  cpu: 'processore cpu',
  gpu: 'scheda video gpu',
  ram: 'memoria ram ddr5',
  case: 'case pc mid tower',
  psu: 'alimentatore pc',
  cooler: 'dissipatore cpu',
  ssd: 'ssd nvme',
  nas: 'nas 2 bay',
}

export async function amazonSearch(term, opts = {}) {
  const raw = String(term || '').trim()
  if (raw.length < 3) return []
  const browse = isBrowseQuery(raw)
  const pages = opts.pages ?? (browse ? 2 : 1)
  const max = opts.max ?? (browse ? 24 : 10)
  const queries = browse ? expandMarketQueries(raw) : [AMAZON_BROWSE[raw.toLowerCase()] || raw]
  const perQuery = queries.length > 1 ? Math.max(8, Math.ceil(max / queries.length)) : max
  const seen = new Set()
  const out = []

  for (const q of queries) {
    let fromThis = 0
    for (let page = 1; page <= pages; page++) {
      if (fromThis >= perQuery) break
      if (!(await paceAmazon())) return out
      const url =
        page === 1
          ? `https://www.amazon.it/s?k=${encodeURIComponent(q)}`
          : `https://www.amazon.it/s?k=${encodeURIComponent(q)}&page=${page}`
      const { ok, text, status } = await fetchText(url)
      if (looksBlocked(text, status)) {
        markAmazonBlocked(`search http ${status}`)
        return out
      }
      if (!ok) {
        noteStoreResult('Amazon', false, { reason: `search http ${status}` })
        break
      }
      const hits = parseAmazonSearch(text, q, { max: 16, browse })
      if (!hits.length) break
      for (const hit of hits) {
        if (seen.has(hit.asin)) continue
        seen.add(hit.asin)
        out.push(hit)
        fromThis++
        if (out.length >= max) {
          noteStoreResult('Amazon', true)
          return out
        }
        if (fromThis >= perQuery) break
      }
    }
  }

  noteStoreResult('Amazon', out.length > 0, { reason: out.length ? undefined : 'search-empty' })
  return out
}

function decode(s) {
  return String(s)
    .replace(/&#34;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

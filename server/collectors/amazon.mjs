import { fetchText, parseEuro } from './http.mjs'
import { titleMatches } from './match.mjs'

/** Estrae un prezzo dal HTML Amazon solo se è ancorato al prodotto, non ai caroselli. */
export function parseAmazonProduct(html) {
  if (!html || html.length < 80) return { price: null, available: null, title: null }
  if (/sorry.*automated|enter the characters|captcha/i.test(html) && html.length < 20000) {
    return { price: null, available: null, title: null, blocked: true }
  }

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
  const { ok, text, status } = await fetchText(url)
  if (!ok) return { price: null, available: null, title: null, url, status }
  return { ...parseAmazonProduct(text), url }
}

export function parseAmazonSearch(html, query) {
  if (!html || html.length < 80) return []
  const seen = new Set()
  const out = []
  const re = /data-asin="([A-Z0-9]{10})"/g
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
    if (query && !titleMatches(query, name)) continue
    if (/ups|cavo|modulo|custodia/i.test(name) && !/ups|cavo|modulo|custodia/i.test(query || '')) {
      continue
    }
    out.push({
      asin,
      title: name,
      price,
      url: `https://www.amazon.it/dp/${asin}`,
    })
    if (out.length >= 6) break
  }
  return out
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

export async function amazonSearch(term) {
  const q = term.trim()
  if (q.length < 3) return []
  const url = `https://www.amazon.it/s?k=${encodeURIComponent(q)}`
  const { ok, text } = await fetchText(url)
  if (!ok) return []
  return parseAmazonSearch(text, q)
}

function decode(s) {
  return String(s)
    .replace(/&#34;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

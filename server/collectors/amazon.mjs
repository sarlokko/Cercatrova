import { fetchText, parseEuro } from './http.mjs'

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

export async function amazonSearch(term) {
  const q = term.trim()
  if (q.length < 3) return []
  const url = `https://www.amazon.it/s?k=${encodeURIComponent(q)}`
  const { ok, text } = await fetchText(url)
  if (!ok) return []
  const cards = text.split('data-component-type="s-search-result"')
  const out = []
  const tokens = q.toLowerCase().split(/\s+/).filter((t) => t.length > 1)
  for (const card of cards.slice(1, 16)) {
    const head = card.slice(0, 1800)
    const asin = (head.match(/data-asin="(B0[A-Z0-9]{8})"/) ||
      head.match(/\/dp\/(B0[A-Z0-9]{8})/))?.[1]
    const name = decode(
      (head.match(/<h2[^>]*>[\s\S]*?<span[^>]*>([^<]+)/) || [])[1] || '',
    )
      .replace(/\s+/g, ' ')
      .trim()
    const priceRaw = (head.match(/class="a-offscreen">([^<]+)/) || [])[1]
    const price = parseEuro(priceRaw)
    if (!asin || !name || price == null) continue
    const hay = name.toLowerCase()
    const hits = tokens.filter((t) => hay.includes(t)).length
    if (hits < Math.min(2, tokens.length)) continue
    if (/ups|cavo| ram |modulo|custodia|alimentatore/i.test(name) && !/ups|cavo|ram/i.test(q)) {
      continue
    }
    out.push({
      asin,
      title: name,
      price,
      url: `https://www.amazon.it/dp/${asin}`,
    })
    if (out.length >= 5) break
  }
  return out
}

function decode(s) {
  return String(s)
    .replace(/&#34;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

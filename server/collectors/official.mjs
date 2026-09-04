import { fetchText, parseEuro } from './http.mjs'

export async function officialPrice(url) {
  if (!url || !/^https?:\/\//i.test(url)) return null
  if (/[?&]q=|\/search|\/browse|\/s\?/i.test(url)) return null
  const { ok, text } = await fetchText(url)
  if (!ok) return null

  const og = text.match(/property="og:price:amount"\s+content="([^"]+)"/i)
  if (og) {
    const price = parseEuro(og[1])
    if (price != null) return { price, list: compareAt(text) ?? price, available: 1 }
  }

  const jsonPrice = text.match(/"price":(\d{3,7})(?!\d)/)
  if (jsonPrice && /shopify|ugreen|compare_at_price/i.test(text)) {
    const cents = Number(jsonPrice[1])
    if (cents > 50 && cents < 5_000_000) {
      const price = Math.round(cents) / 100
      const listCents = (text.match(/"compare_at_price":(\d{3,7})/) || [])[1]
      return {
        price,
        list: listCents ? Number(listCents) / 100 : price,
        available: 1,
      }
    }
  }

  return null
}

function compareAt(html) {
  const m = html.match(/"compare_at_price":(\d{3,7})/)
  if (!m) return null
  return Number(m[1]) / 100
}

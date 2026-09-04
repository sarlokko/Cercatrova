import type { Deal, Merchant } from '../data/deals'

function q(title: string) {
  return encodeURIComponent(title.replace(/[—–]/g, ' ').replace(/\s+/g, ' ').trim())
}

/** Link vero al negozio (ricerca prodotto). I `#` demo non aprono nulla. */
export function merchantOfferUrl(merchant: Merchant, deal: Deal) {
  if (/^https?:\/\//i.test(merchant.url)) return merchant.url

  const query = q(deal.title)
  const name = merchant.name.toLowerCase()

  if (name.includes('amazon')) return `https://www.amazon.it/s?k=${query}`
  if (name.includes('ebay')) return `https://www.ebay.it/sch/i.html?_nkw=${query}`
  if (name.includes('ldlc')) return `https://www.ldlc.com/it-it/search/${query}/`
  if (name.includes('alternate')) return `https://www.alternate.it/listing.xhtml?q=${query}`
  if (name.includes('mediaworld')) return `https://www.mediaworld.it/search?q=${query}`
  if (name.includes('morele')) return `https://www.morele.net/wyszukiwarka/0/0/,,,,,,/1/?q=${query}`
  if (name.includes('synology')) return `https://www.synology.com/it-it/search?search=${query}`
  if (name.includes('steam')) return `https://store.steampowered.com/search/?term=${query}`
  if (name.includes('epic')) return `https://store.epicgames.com/it/browse?q=${query}`
  if (name.includes('humble')) return `https://www.humblebundle.com/store/search?search=${query}`
  if (name.includes('appsumo')) return `https://appsumo.com/search/?query=${query}`
  if (name.includes('macpaw')) return 'https://macpaw.com/cleanmymac'
  if (name.includes('notion')) return 'https://www.notion.com/product'
  if (name.includes('midjourney')) return 'https://www.midjourney.com/'
  if (name.includes('figma')) return 'https://www.figma.com/pricing'
  if (name.includes('app store')) return `https://apps.apple.com/it/search?term=${query}`

  return `https://www.google.com/search?q=${query}+${encodeURIComponent(merchant.name)}`
}

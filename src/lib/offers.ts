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
  if (name.includes('playstation')) return `https://store.playstation.com/it-it/search/${query}`
  if (name.includes('xbox')) return `https://www.microsoft.com/it-it/search/shop/games?q=${query}`
  if (name.includes('epic')) return `https://store.epicgames.com/it/browse?q=${query}`
  if (name.includes('gog')) return `https://www.gog.com/en/games?query=${query}`
  if (name.includes('instant')) return `https://www.instant-gaming.com/it/ricerca/?q=${query}`
  if (name.includes('humble')) return `https://www.humblebundle.com/store/search?search=${query}`
  if (name.includes('appsumo')) return `https://appsumo.com/search/?query=${query}`
  if (name.includes('macpaw')) return 'https://macpaw.com/cleanmymac'
  if (name.includes('notion')) return 'https://www.notion.com/product'
  if (name.includes('midjourney')) return 'https://www.midjourney.com/'
  if (name.includes('figma')) return 'https://www.figma.com/pricing'
  if (name.includes('google play') || name.includes('play store')) {
    return `https://play.google.com/store/search?q=${query}&c=apps`
  }
  if (name.includes('app store')) return `https://apps.apple.com/it/search?term=${query}`
  if (name.includes('ugreen')) return `https://nas-eu.ugreen.com/en-it/search?q=${query}`
  if (name.includes('pccomponentes')) return `https://www.pccomponentes.it/buscar/?query=${query}`
  if (name.includes('unieuro')) return `https://www.unieuro.it/online/search?query=${query}`
  if (name.includes('videolan') || name.includes('vlc')) return 'https://www.videolan.org/vlc/'
  if (name.includes('libreoffice')) {
    return 'https://www.libreoffice.org/download/download-libreoffice/'
  }
  if (name.includes('microsoft')) {
    return `https://www.microsoft.com/it-it/search/explore?q=${query}`
  }

  return `https://www.google.com/search?q=${query}+${encodeURIComponent(merchant.name)}`
}

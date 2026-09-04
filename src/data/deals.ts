export type Category = 'software' | 'nas' | 'gaming'

export type DealKind = 'gratis' | 'sconto' | 'minimo' | 'errore' | 'coupon' | 'scade' | 'listino'

export type Merchant = {
  name: string
  price: number
  url: string
  shipping?: string
}

export type PricePoint = {
  date: string
  price: number
}

export type Deal = {
  id: string
  title: string
  subtitle: string
  category: Category
  kind: DealKind
  currentPrice: number
  normalPrice: number
  currency: string
  discountPct: number
  avgPrice: number
  minPrice6m: number
  isFree: boolean
  imageTone: string
  merchants: Merchant[]
  history: PricePoint[]
  expiresAt?: string
  tags: string[]
  checkedAt: string
}

/** Snapshot listini pubblici, non un feed in tempo reale. */
export const PRICES_CHECKED_AT = '2026-09-04'

const daysAgo = (n: number) => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

const wave = (
  base: number,
  points: number,
  variance: number,
  end: number,
): PricePoint[] => {
  const out: PricePoint[] = []
  for (let i = points; i >= 1; i--) {
    const t = 1 - i / points
    const noise = Math.sin(i * 1.7) * variance + Math.cos(i * 0.9) * (variance * 0.4)
    const trend = base + (end - base) * Math.pow(t, 1.2)
    out.push({
      date: daysAgo(i * 3),
      price: Math.round((trend + noise) * 100) / 100,
    })
  }
  out.push({ date: daysAgo(0), price: end })
  return out
}

export const deals: Deal[] = [
  {
    id: 'nas-wd-red-12',
    title: 'WD Red Plus 12TB',
    subtitle: 'HDD NAS CMR (WD120EFGX). Amazon.it intorno ai 399 €, non a 180 €.',
    category: 'nas',
    kind: 'listino',
    currentPrice: 399,
    normalPrice: 399,
    currency: '€',
    discountPct: 0,
    avgPrice: 449,
    minPrice6m: 399,
    isFree: false,
    imageTone: '#1d3557',
    checkedAt: PRICES_CHECKED_AT,
    merchants: [
      {
        name: 'Amazon',
        price: 399,
        url: 'https://www.amazon.it/Plus-12TB-Hard-Disk-Interno/dp/B0F4R6SNJG',
        shipping: 'Prime · buy box sett. 2026',
      },
      {
        name: 'eBay',
        price: 419,
        url: 'https://www.ebay.it/sch/i.html?_nkw=WD+Red+Plus+12TB',
        shipping: 'usato/nuovo, varia',
      },
    ],
    history: wave(480, 40, 18, 399),
    tags: ['HDD', 'NAS', '12TB', 'WD120EFGX'],
  },
  {
    id: 'nas-synology-ds224',
    title: 'Synology DS224+',
    subtitle: 'NAS 2-bay. Street price Italia circa 389–415 €.',
    category: 'nas',
    kind: 'listino',
    currentPrice: 389,
    normalPrice: 389,
    currency: '€',
    discountPct: 0,
    avgPrice: 405,
    minPrice6m: 389,
    isFree: false,
    imageTone: '#264653',
    checkedAt: PRICES_CHECKED_AT,
    merchants: [
      {
        name: 'Amazon',
        price: 399,
        url: 'https://www.amazon.it/s?k=Synology+DS224%2B',
        shipping: 'verifica scheda',
      },
      {
        name: 'PcComponentes',
        price: 414.99,
        url: 'https://www.pccomponentes.it/synology-diskstation-ds224-plus-nas',
      },
    ],
    history: wave(430, 36, 12, 389),
    tags: ['NAS', 'Synology', '2-bay'],
  },
  {
    id: 'nas-samsung-990',
    title: 'Samsung 990 PRO 2TB',
    subtitle: 'SSD NVMe. Listini Italia circa 240–350 € a seconda del heatsink.',
    category: 'nas',
    kind: 'listino',
    currentPrice: 249,
    normalPrice: 249,
    currency: '€',
    discountPct: 0,
    avgPrice: 280,
    minPrice6m: 239.5,
    isFree: false,
    imageTone: '#14213d',
    checkedAt: PRICES_CHECKED_AT,
    merchants: [
      {
        name: 'Amazon',
        price: 249,
        url: 'https://www.amazon.it/s?k=samsung+990+pro+2tb',
      },
      {
        name: 'MediaWorld',
        price: 279,
        url: 'https://www.mediaworld.it/search?q=samsung%20990%20pro%202tb',
      },
    ],
    history: wave(310, 40, 16, 249),
    tags: ['SSD', 'NVMe', '2TB'],
  },
  {
    id: 'nas-crucial-32ram',
    title: 'Crucial DDR4 32GB SODIMM',
    subtitle: 'Kit 2x16 3200 MHz. Amazon.it intorno ai 239–249 €, non a 50 €.',
    category: 'nas',
    kind: 'listino',
    currentPrice: 239,
    normalPrice: 239,
    currency: '€',
    discountPct: 0,
    avgPrice: 255,
    minPrice6m: 239,
    isFree: false,
    imageTone: '#2b2d42',
    checkedAt: PRICES_CHECKED_AT,
    merchants: [
      {
        name: 'Amazon',
        price: 239,
        url: 'https://www.amazon.it/dp/B07ZLC7VNH',
        shipping: 'CT32G4SFD832A / kit 2x16 simile',
      },
      {
        name: 'Amazon (kit 2x16)',
        price: 249,
        url: 'https://www.amazon.it/Crucial-CT2K16G4SFRA32A-2x16GB-Memoria-Laptop/dp/B08C4X9VR5',
        shipping: 'CT2K16G4SFRA32A',
      },
    ],
    history: wave(270, 32, 10, 239),
    tags: ['RAM', 'SODIMM', '32GB', 'DDR4'],
  },
]

export const kindLabel: Record<DealKind, string> = {
  gratis: 'Gratis',
  sconto: 'Sconto forte',
  minimo: 'Minimo storico',
  errore: 'Errore di prezzo',
  coupon: 'Coupon nascosto',
  scade: 'Scade oggi',
  listino: 'Listino verificato',
}

export const categoryLabel: Record<Category, string> = {
  software: 'Software / SaaS / AI',
  nas: 'NAS / Storage',
  gaming: 'Gaming free',
}

export function formatPrice(price: number, currency = '€') {
  if (price === 0) return 'Gratis'
  return `${currency}${price.toFixed(2).replace('.', ',')}`
}

export function getDeal(id: string) {
  return deals.find((d) => d.id === id)
}

export function formatCheckedAt(iso = PRICES_CHECKED_AT) {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

export type Category = 'software' | 'nas' | 'gaming'

export type DealKind =
  | 'gratis'
  | 'sconto'
  | 'minimo'
  | 'errore'
  | 'coupon'
  | 'scade'

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
}

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
    id: 'soft-notion-ai',
    title: 'Notion AI Plus — 1 anno',
    subtitle: 'Di solito 96 €/anno. Oggi gratis per studenti.',
    category: 'software',
    kind: 'gratis',
    currentPrice: 0,
    normalPrice: 96,
    currency: '€',
    discountPct: 100,
    avgPrice: 96,
    minPrice6m: 0,
    isFree: true,
    imageTone: '#1b4332',
    merchants: [
      { name: 'Notion', price: 0, url: '#', shipping: 'Attivazione immediata' },
      { name: 'App Store Edu', price: 0, url: '#' },
    ],
    history: wave(96, 40, 0, 0),
    expiresAt: '2026-09-12',
    tags: ['AI', 'produttività', 'lifetime-ish'],
  },
  {
    id: 'soft-cleanmymac',
    title: 'CleanMyMac X Pro',
    subtitle: 'Licenza lifetime su stack lifetime deal.',
    category: 'software',
    kind: 'sconto',
    currentPrice: 29.99,
    normalPrice: 89.95,
    currency: '€',
    discountPct: 67,
    avgPrice: 64,
    minPrice6m: 29.99,
    isFree: false,
    imageTone: '#0d3b66',
    merchants: [
      { name: 'AppSumo', price: 29.99, url: '#', shipping: 'Licenza digitale' },
      { name: 'MacPaw', price: 89.95, url: '#' },
      { name: 'Amazon Software', price: 79.99, url: '#' },
    ],
    history: wave(79, 40, 8, 29.99),
    expiresAt: '2026-09-08',
    tags: ['Mac', 'utility', 'lifetime'],
  },
  {
    id: 'soft-midjourney',
    title: 'Midjourney — crediti promo',
    subtitle: '25 crediti gratis per nuovi account (valore ~10 €).',
    category: 'software',
    kind: 'gratis',
    currentPrice: 0,
    normalPrice: 10,
    currency: '€',
    discountPct: 100,
    avgPrice: 10,
    minPrice6m: 0,
    isFree: true,
    imageTone: '#3d0c11',
    merchants: [{ name: 'Midjourney', price: 0, url: '#' }],
    history: wave(10, 20, 0, 0),
    tags: ['AI', 'immagini', 'crediti'],
  },
  {
    id: 'soft-figma-pro',
    title: 'Figma Professional',
    subtitle: '3 mesi a 0 € con codice partner nascosto.',
    category: 'software',
    kind: 'coupon',
    currentPrice: 0,
    normalPrice: 45,
    currency: '€',
    discountPct: 100,
    avgPrice: 15,
    minPrice6m: 0,
    isFree: true,
    imageTone: '#1a1a2e',
    merchants: [
      { name: 'Figma + coupon', price: 0, url: '#' },
      { name: 'Figma listino', price: 15, url: '#' },
    ],
    history: wave(15, 30, 2, 0),
    expiresAt: '2026-09-05',
    tags: ['design', 'SaaS', 'coupon'],
  },
  {
    id: 'nas-wd-red-12',
    title: 'WD Red Plus 12TB',
    subtitle: 'HDD NAS CMR — −18% sul prezzo medio.',
    category: 'nas',
    kind: 'minimo',
    currentPrice: 179.9,
    normalPrice: 249,
    currency: '€',
    discountPct: 28,
    avgPrice: 219,
    minPrice6m: 179.9,
    isFree: false,
    imageTone: '#1d3557',
    merchants: [
      { name: 'Amazon', price: 179.9, url: '#', shipping: 'Prime' },
      { name: 'eBay', price: 184.5, url: '#', shipping: '+4,90 sped.' },
      { name: 'LDLC', price: 189.0, url: '#', shipping: 'Gratis >99€' },
      { name: 'Alternate', price: 192.9, url: '#' },
    ],
    history: wave(235, 50, 12, 179.9),
    tags: ['HDD', 'NAS', '12TB'],
  },
  {
    id: 'nas-synology-ds224',
    title: 'Synology DS224+',
    subtitle: '2-bay NAS — sotto budget 280 €.',
    category: 'nas',
    kind: 'sconto',
    currentPrice: 274.0,
    normalPrice: 329,
    currency: '€',
    discountPct: 17,
    avgPrice: 305,
    minPrice6m: 269,
    isFree: false,
    imageTone: '#264653',
    merchants: [
      { name: 'Amazon', price: 274.0, url: '#', shipping: 'Prime' },
      { name: 'MoreLE', price: 279.0, url: '#' },
      { name: 'Synology Store', price: 329.0, url: '#' },
    ],
    history: wave(320, 45, 15, 274),
    tags: ['NAS', 'Synology', '2-bay'],
  },
  {
    id: 'nas-samsung-990',
    title: 'Samsung 990 PRO 2TB',
    subtitle: 'SSD NVMe per cache NAS / workstation.',
    category: 'nas',
    kind: 'minimo',
    currentPrice: 139.99,
    normalPrice: 219,
    currency: '€',
    discountPct: 36,
    avgPrice: 175,
    minPrice6m: 139.99,
    isFree: false,
    imageTone: '#14213d',
    merchants: [
      { name: 'Amazon', price: 139.99, url: '#', shipping: 'Prime' },
      { name: 'eBay', price: 142.0, url: '#' },
      { name: 'MediaWorld', price: 159.0, url: '#' },
    ],
    history: wave(195, 48, 14, 139.99),
    tags: ['SSD', 'NVMe', '2TB'],
  },
  {
    id: 'nas-crucial-32ram',
    title: 'Crucial DDR4 32GB (2x16) SODIMM',
    subtitle: 'RAM per upgrade NAS / mini PC.',
    category: 'nas',
    kind: 'errore',
    currentPrice: 49.9,
    normalPrice: 89,
    currency: '€',
    discountPct: 44,
    avgPrice: 78,
    minPrice6m: 49.9,
    isFree: false,
    imageTone: '#2b2d42',
    merchants: [
      { name: 'Amazon', price: 49.9, url: '#', shipping: 'Errore prezzo?' },
      { name: 'Alternate', price: 74.9, url: '#' },
    ],
    history: wave(85, 35, 6, 49.9),
    expiresAt: '2026-09-04',
    tags: ['RAM', 'SODIMM', 'upgrade'],
  },
  {
    id: 'game-control',
    title: 'Control Ultimate Edition',
    subtitle: 'Gratis su Epic — di solito da 39,99 €.',
    category: 'gaming',
    kind: 'gratis',
    currentPrice: 0,
    normalPrice: 39.99,
    currency: '€',
    discountPct: 100,
    avgPrice: 18,
    minPrice6m: 0,
    isFree: true,
    imageTone: '#240046',
    merchants: [
      { name: 'Epic Games', price: 0, url: '#' },
      { name: 'Steam', price: 39.99, url: '#' },
    ],
    history: wave(39.99, 40, 8, 0),
    expiresAt: '2026-09-11',
    tags: ['PC', 'gratis limitato', '≥20€'],
  },
  {
    id: 'game-hades2',
    title: 'Hades II',
    subtitle: '−80% flash — minimo storico su Steam.',
    category: 'gaming',
    kind: 'scade',
    currentPrice: 5.99,
    normalPrice: 29.99,
    currency: '€',
    discountPct: 80,
    avgPrice: 24,
    minPrice6m: 5.99,
    isFree: false,
    imageTone: '#3c096c',
    merchants: [
      { name: 'Steam', price: 5.99, url: '#' },
      { name: 'Humble', price: 7.49, url: '#' },
    ],
    history: wave(29.99, 30, 4, 5.99),
    expiresAt: '2026-09-04',
    tags: ['PC', '−80%', 'scade oggi'],
  },
]

export const kindLabel: Record<DealKind, string> = {
  gratis: 'Gratis',
  sconto: 'Sconto forte',
  minimo: 'Minimo storico',
  errore: 'Errore di prezzo',
  coupon: 'Coupon nascosto',
  scade: 'Scade oggi',
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

export type Category = 'software' | 'nas' | 'pc' | 'steam' | 'android' | 'ios'

export type DealKind =
  | 'gratis'
  | 'sconto'
  | 'minimo'
  | 'errore'
  | 'coupon'
  | 'scade'
  | 'listino'
  | 'monitora'
  | 'lookup'

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
  /** Nessun euro inventato: mostra “Vedi negozio”. */
  priceUnknown?: boolean
  /** Risultato sintetico: la query non era nel catalogo. */
  lookup?: boolean
  imageTone: string
  merchants: Merchant[]
  history: PricePoint[]
  expiresAt?: string
  tags: string[]
  checkedAt: string
  verdict?: Verdict
  live?: boolean
  sampleCount?: number
}

export type VerdictKind =
  | 'eccezionale'
  | 'ottimo'
  | 'abbastanza'
  | 'normale'
  | 'sconosciuto'
  | 'gratis'
  | 'pochi-dati'

export type Verdict = {
  kind: VerdictKind
  label: string
  question: string
  detail: string
  pctBelowAvg: number | null
}

/** Snapshot listini pubblici, non un feed in tempo reale. */
export const PRICES_CHECKED_AT = '2026-09-04'

export const CATEGORIES: Category[] = ['nas', 'pc', 'software', 'steam', 'android', 'ios']

export function isCategory(value: string): value is Category {
  return (CATEGORIES as string[]).includes(value)
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

type Draft = Omit<Deal, 'kind' | 'discountPct' | 'isFree' | 'checkedAt' | 'currency' | 'history'> & {
  kind?: DealKind
  discountPct?: number
  isFree?: boolean
  checkedAt?: string
  currency?: string
  history?: PricePoint[]
}

function item(draft: Draft): Deal {
  const current = draft.currentPrice
  const normal = draft.normalPrice
  const unknown = Boolean(draft.priceUnknown)
  const discount =
    draft.discountPct ??
    (normal > 0 && current > 0 && current < normal
      ? Math.round((1 - current / normal) * 100)
      : 0)
  return {
    ...draft,
    kind: draft.kind ?? (draft.isFree ? 'gratis' : 'listino'),
    discountPct: discount,
    isFree: draft.isFree ?? false,
    checkedAt: draft.checkedAt ?? PRICES_CHECKED_AT,
    currency: draft.currency ?? '€',
    history:
      draft.history ??
      (unknown || current <= 0
        ? []
        : wave(draft.avgPrice || current, 32, Math.max(2, current * 0.045), current)),
  }
}

function pcPart(
  draft: Omit<Draft, 'category' | 'currentPrice' | 'normalPrice' | 'avgPrice' | 'minPrice6m'> & {
    merchants: Merchant[]
    tags: string[]
  },
): Deal {
  const have = new Set(draft.merchants.map((m) => m.name))
  return item({
    ...draft,
    merchants: [...draft.merchants, ...hardwareStores(draft.title).filter((m) => !have.has(m.name))],
    category: 'pc',
    kind: 'monitora',
    currentPrice: 0,
    normalPrice: 0,
    avgPrice: 0,
    minPrice6m: 0,
    priceUnknown: true,
  })
}

function shop(name: string, url: string): Merchant {
  return { name, price: 0, url }
}

function hardwareStores(title: string): Merchant[] {
  const q = encodeURIComponent(title)
  return [
    shop('Amazon', `https://www.amazon.it/s?k=${q}`),
    shop('PcComponentes', `https://www.pccomponentes.it/buscar/?query=${q}`),
    shop('LDLC', `https://www.ldlc.com/it-it/recherche/?q=${q}`),
    shop('Alternate', `https://www.alternate.it/listing.xhtml?q=${q}`),
    shop('MediaWorld', `https://www.mediaworld.it/search?q=${q}`),
    shop('Unieuro', `https://www.unieuro.it/online/search?query=${q}`),
    shop('eBay', `https://www.ebay.it/sch/i.html?_nkw=${q}`),
  ]
}

function gameStores(title: string): Merchant[] {
  const q = encodeURIComponent(title.replace(/[—–]/g, ' ').replace(/\s+/g, ' ').trim())
  return [
    shop('Steam', `https://store.steampowered.com/search/?term=${q}`),
    shop('GOG', `https://www.gog.com/en/games?query=${q}`),
    shop('Epic Games', `https://store.epicgames.com/it/browse?q=${q}`),
    shop('Instant Gaming', `https://www.instant-gaming.com/it/ricerca/?q=${q}`),
    shop('PlayStation Store', `https://store.playstation.com/it-it/search/${q}`),
    shop('Xbox', `https://www.microsoft.com/it-it/search/shop/games?q=${q}`),
  ]
}

function withGameStores(deal: Deal): Deal {
  const have = new Set(deal.merchants.map((m) => m.name))
  return {
    ...deal,
    merchants: [...deal.merchants, ...gameStores(deal.title).filter((m) => !have.has(m.name))],
  }
}

export function isPreorderDeal(deal: Pick<Deal, 'tags'>) {
  return deal.tags.some((t) => /prevendita|preordine|preorder/i.test(t))
}

function pcParts(): Deal[] {
  return [
    pcPart({
      id: 'pc-fractal-north',
      title: 'Fractal North',
      subtitle: 'Case mid-tower mesh, legno. Prezzo solo se il negozio risponde.',
      imageTone: '#5c4033',
      merchants: [
        shop('Amazon', 'https://www.amazon.it/s?k=Fractal+North'),
        shop('PcComponentes', 'https://www.pccomponentes.it/buscar/?query=Fractal%20North'),
      ],
      tags: ['pc', 'CASE', 'Fractal', 'North', 'mid-tower', 'atx'],
    }),
    pcPart({
      id: 'pc-lianli-lancool-217',
      title: 'Lian Li Lancool 217',
      subtitle: 'Case mid-tower airflow. Listino da verificare in negozio.',
      imageTone: '#111111',
      merchants: [
        shop('Amazon', 'https://www.amazon.it/s?k=Lian+Li+Lancool+217'),
        shop('PcComponentes', 'https://www.pccomponentes.it/buscar/?query=Lancool%20217'),
      ],
      tags: ['pc', 'CASE', 'Lian Li', 'Lancool', 'mid-tower', 'atx'],
    }),
    pcPart({
      id: 'pc-corsair-4000d',
      title: 'Corsair 4000D Airflow',
      subtitle: 'Case mid-tower, un classico. Niente cifra inventata.',
      imageTone: '#1b2838',
      merchants: [
        shop('Amazon', 'https://www.amazon.it/s?k=Corsair+4000D+Airflow'),
        shop('PcComponentes', 'https://www.pccomponentes.it/buscar/?query=4000D%20Airflow'),
      ],
      tags: ['pc', 'CASE', 'Corsair', '4000D', 'mid-tower', 'atx'],
    }),
    pcPart({
      id: 'pc-nzxt-h5-flow',
      title: 'NZXT H5 Flow',
      subtitle: 'Case mid-tower compatto. Apri il negozio per il prezzo vero.',
      imageTone: '#2b2d42',
      merchants: [
        shop('Amazon', 'https://www.amazon.it/s?k=NZXT+H5+Flow'),
        shop('PcComponentes', 'https://www.pccomponentes.it/buscar/?query=NZXT%20H5%20Flow'),
      ],
      tags: ['pc', 'CASE', 'NZXT', 'H5', 'mid-tower', 'atx'],
    }),
    pcPart({
      id: 'pc-nr200p',
      title: 'Cooler Master NR200P',
      subtitle: 'Case Mini-ITX. Monitora: il street price gira spesso.',
      imageTone: '#c1121f',
      merchants: [
        shop('Amazon', 'https://www.amazon.it/s?k=Cooler+Master+NR200P'),
        shop('PcComponentes', 'https://www.pccomponentes.it/buscar/?query=NR200P'),
      ],
      tags: ['pc', 'CASE', 'ITX', 'mini-itx', 'NR200P', 'Cooler Master', 'sff'],
    }),
    pcPart({
      id: 'pc-ryzen-7800x3d',
      title: 'AMD Ryzen 7 7800X3D',
      subtitle: 'CPU AM5 8 core, cache 3D. Gaming: il riferimento. Prezzo live dal negozio.',
      imageTone: '#7b2d8e',
      merchants: [
        shop('Amazon', 'https://www.amazon.it/s?k=Ryzen+7+7800X3D'),
        shop('PcComponentes', 'https://www.pccomponentes.it/buscar/?query=7800X3D'),
      ],
      tags: ['pc', 'CPU', 'AMD', 'Ryzen', '7800X3D', 'AM5', 'processore'],
    }),
    pcPart({
      id: 'pc-ryzen-7600',
      title: 'AMD Ryzen 5 7600',
      subtitle: 'CPU AM5 6 core. Fascia media, niente prezzo fermo nel repo.',
      imageTone: '#6a1b9a',
      merchants: [
        shop('Amazon', 'https://www.amazon.it/s?k=Ryzen+5+7600'),
        shop('PcComponentes', 'https://www.pccomponentes.it/buscar/?query=Ryzen%205%207600'),
      ],
      tags: ['pc', 'CPU', 'AMD', 'Ryzen', '7600', 'AM5', 'processore'],
    }),
    pcPart({
      id: 'pc-ryzen-9700x',
      title: 'AMD Ryzen 7 9700X',
      subtitle: 'CPU AM5 Zen 5. Apri Amazon/PcComponentes per il listino di oggi.',
      imageTone: '#4a148c',
      merchants: [
        shop('Amazon', 'https://www.amazon.it/s?k=Ryzen+7+9700X'),
        shop('PcComponentes', 'https://www.pccomponentes.it/buscar/?query=9700X'),
      ],
      tags: ['pc', 'CPU', 'AMD', 'Ryzen', '9700X', 'AM5', 'processore'],
    }),
    pcPart({
      id: 'pc-intel-14600k',
      title: 'Intel Core i5-14600K',
      subtitle: 'CPU LGA1700. Monitora: sconta a ondate.',
      imageTone: '#0071c5',
      merchants: [
        shop('Amazon', 'https://www.amazon.it/s?k=i5-14600K'),
        shop('PcComponentes', 'https://www.pccomponentes.it/buscar/?query=14600K'),
      ],
      tags: ['pc', 'CPU', 'Intel', '14600K', 'LGA1700', 'processore'],
    }),
    pcPart({
      id: 'pc-intel-265k',
      title: 'Intel Core Ultra 7 265K',
      subtitle: 'CPU LGA1851 Arrow Lake. Prezzo solo se il negozio risponde.',
      imageTone: '#0054a6',
      merchants: [
        shop('Amazon', 'https://www.amazon.it/s?k=Core+Ultra+7+265K'),
        shop('PcComponentes', 'https://www.pccomponentes.it/buscar/?query=265K'),
      ],
      tags: ['pc', 'CPU', 'Intel', '265K', 'Ultra', 'LGA1851', 'processore'],
    }),
    pcPart({
      id: 'pc-rtx-5070',
      title: 'NVIDIA GeForce RTX 5070',
      subtitle: 'GPU 50-series. Il buy box gira: meglio “non disponibile” che un numero finto.',
      imageTone: '#76b900',
      merchants: [
        shop('Amazon', 'https://www.amazon.it/s?k=RTX+5070'),
        shop('PcComponentes', 'https://www.pccomponentes.it/buscar/?query=RTX%205070'),
      ],
      tags: ['pc', 'GPU', 'NVIDIA', 'RTX', '5070', 'scheda video'],
    }),
    pcPart({
      id: 'pc-rtx-5060ti',
      title: 'NVIDIA GeForce RTX 5060 Ti',
      subtitle: 'GPU fascia media. Verifica stock e prezzo sul negozio.',
      imageTone: '#5a8f00',
      merchants: [
        shop('Amazon', 'https://www.amazon.it/s?k=RTX+5060+Ti'),
        shop('PcComponentes', 'https://www.pccomponentes.it/buscar/?query=RTX%205060%20Ti'),
      ],
      tags: ['pc', 'GPU', 'NVIDIA', 'RTX', '5060', '5060ti', 'scheda video'],
    }),
    pcPart({
      id: 'pc-rtx-5080',
      title: 'NVIDIA GeForce RTX 5080',
      subtitle: 'GPU alta. Monitora: i listini saltano in continuazione.',
      imageTone: '#3d5c00',
      merchants: [
        shop('Amazon', 'https://www.amazon.it/s?k=RTX+5080'),
        shop('PcComponentes', 'https://www.pccomponentes.it/buscar/?query=RTX%205080'),
      ],
      tags: ['pc', 'GPU', 'NVIDIA', 'RTX', '5080', 'scheda video'],
    }),
    pcPart({
      id: 'pc-rx-9070xt',
      title: 'AMD Radeon RX 9070 XT',
      subtitle: 'GPU RDNA 4. Prezzo dal negozio, non dal catalogo fermo.',
      imageTone: '#ed1c24',
      merchants: [
        shop('Amazon', 'https://www.amazon.it/s?k=RX+9070+XT'),
        shop('PcComponentes', 'https://www.pccomponentes.it/buscar/?query=9070%20XT'),
      ],
      tags: ['pc', 'GPU', 'AMD', 'Radeon', '9070', '9070xt', 'scheda video'],
    }),
    pcPart({
      id: 'pc-corsair-veng-ddr5-32',
      title: 'Corsair Vengeance DDR5 32GB',
      subtitle: 'Kit 2x16 6000 MHz, DIMM desktop. Alert sul tuo prezzo.',
      imageTone: '#ffd700',
      merchants: [
        shop('Amazon', 'https://www.amazon.it/s?k=Corsair+Vengeance+DDR5+32GB+6000'),
        shop('PcComponentes', 'https://www.pccomponentes.it/buscar/?query=Vengeance%20DDR5%2032GB'),
      ],
      tags: ['pc', 'RAM', 'DDR5', '32GB', 'DIMM', 'Corsair', 'Vengeance', '6000'],
    }),
    pcPart({
      id: 'pc-gskill-ddr5-32',
      title: 'G.Skill Trident Z5 DDR5 32GB',
      subtitle: 'Kit 2x16 desktop. Niente street price inventato.',
      imageTone: '#c0c0c0',
      merchants: [
        shop('Amazon', 'https://www.amazon.it/s?k=G.Skill+Trident+Z5+DDR5+32GB'),
        shop('PcComponentes', 'https://www.pccomponentes.it/buscar/?query=Trident%20Z5%2032GB'),
      ],
      tags: ['pc', 'RAM', 'DDR5', '32GB', 'DIMM', 'G.Skill', 'Trident'],
    }),
    pcPart({
      id: 'pc-kingston-ddr5-64',
      title: 'Kingston Fury Beast DDR5 64GB',
      subtitle: 'Kit 2x32 desktop. Monitora quando scende.',
      imageTone: '#1a1a2e',
      merchants: [
        shop('Amazon', 'https://www.amazon.it/s?k=Kingston+Fury+Beast+DDR5+64GB'),
        shop('PcComponentes', 'https://www.pccomponentes.it/buscar/?query=Fury%20Beast%20DDR5%2064'),
      ],
      tags: ['pc', 'RAM', 'DDR5', '64GB', 'DIMM', 'Kingston', 'Fury'],
    }),
    pcPart({
      id: 'pc-msi-b650-tomahawk',
      title: 'MSI MAG B650 Tomahawk WiFi',
      subtitle: 'Scheda madre AM5. Prezzo dal negozio.',
      imageTone: '#c8102e',
      merchants: [
        shop('Amazon', 'https://www.amazon.it/s?k=MSI+B650+Tomahawk+WiFi'),
        shop('PcComponentes', 'https://www.pccomponentes.it/buscar/?query=B650%20Tomahawk'),
      ],
      tags: ['pc', 'MOBO', 'MSI', 'B650', 'AM5', 'scheda madre', 'wifi'],
    }),
    pcPart({
      id: 'pc-asus-tuf-b650',
      title: 'ASUS TUF Gaming B650-PLUS WiFi',
      subtitle: 'Scheda madre AM5 TUF. Apri e monitora.',
      imageTone: '#d4a017',
      merchants: [
        shop('Amazon', 'https://www.amazon.it/s?k=ASUS+TUF+B650-PLUS'),
        shop('PcComponentes', 'https://www.pccomponentes.it/buscar/?query=TUF%20B650-PLUS'),
      ],
      tags: ['pc', 'MOBO', 'ASUS', 'B650', 'AM5', 'scheda madre', 'wifi'],
    }),
    pcPart({
      id: 'pc-gigabyte-z890',
      title: 'Gigabyte Z890 Aorus Elite WiFi7',
      subtitle: 'Scheda madre LGA1851. Listino variabile.',
      imageTone: '#f4a261',
      merchants: [
        shop('Amazon', 'https://www.amazon.it/s?k=Gigabyte+Z890+Aorus+Elite'),
        shop('PcComponentes', 'https://www.pccomponentes.it/buscar/?query=Z890%20Aorus'),
      ],
      tags: ['pc', 'MOBO', 'Gigabyte', 'Z890', 'LGA1851', 'scheda madre', 'wifi'],
    }),
    pcPart({
      id: 'pc-msi-z790',
      title: 'MSI MAG Z790 Tomahawk WiFi',
      subtitle: 'Scheda madre LGA1700. Per i 14600K / 14900K.',
      imageTone: '#9b2226',
      merchants: [
        shop('Amazon', 'https://www.amazon.it/s?k=MSI+Z790+Tomahawk'),
        shop('PcComponentes', 'https://www.pccomponentes.it/buscar/?query=Z790%20Tomahawk'),
      ],
      tags: ['pc', 'MOBO', 'MSI', 'Z790', 'LGA1700', 'scheda madre', 'wifi'],
    }),
    pcPart({
      id: 'pc-corsair-rm750e',
      title: 'Corsair RM750e',
      subtitle: 'Alimentatore 750W gold, modulare. Monitora il listino.',
      imageTone: '#f2c14e',
      merchants: [
        shop('Amazon', 'https://www.amazon.it/s?k=Corsair+RM750e'),
        shop('PcComponentes', 'https://www.pccomponentes.it/buscar/?query=RM750e'),
      ],
      tags: ['pc', 'PSU', 'Corsair', '750W', 'RM750e', 'alimentatore', 'gold'],
    }),
    pcPart({
      id: 'pc-seasonic-focus-850',
      title: 'Seasonic Focus GX-850',
      subtitle: 'Alimentatore 850W. Prezzo dal negozio.',
      imageTone: '#1d3557',
      merchants: [
        shop('Amazon', 'https://www.amazon.it/s?k=Seasonic+Focus+GX-850'),
        shop('PcComponentes', 'https://www.pccomponentes.it/buscar/?query=Focus%20GX-850'),
      ],
      tags: ['pc', 'PSU', 'Seasonic', '850W', 'alimentatore', 'gold'],
    }),
    pcPart({
      id: 'pc-corsair-rm1000e',
      title: 'Corsair RM1000e',
      subtitle: 'Alimentatore 1000W per GPU alte. Alert sul tuo prezzo.',
      imageTone: '#e9c46a',
      merchants: [
        shop('Amazon', 'https://www.amazon.it/s?k=Corsair+RM1000e'),
        shop('PcComponentes', 'https://www.pccomponentes.it/buscar/?query=RM1000e'),
      ],
      tags: ['pc', 'PSU', 'Corsair', '1000W', 'RM1000e', 'alimentatore'],
    }),
    pcPart({
      id: 'pc-noctua-nhd15',
      title: 'Noctua NH-D15',
      subtitle: 'Dissipatore ad aria dual-tower. Classico, listino da verificare.',
      imageTone: '#a67c52',
      merchants: [
        shop('Amazon', 'https://www.amazon.it/s?k=Noctua+NH-D15'),
        shop('PcComponentes', 'https://www.pccomponentes.it/buscar/?query=NH-D15'),
      ],
      tags: ['pc', 'COOLER', 'Noctua', 'NH-D15', 'aria', 'dissipatore'],
    }),
    pcPart({
      id: 'pc-thermalright-pa120',
      title: 'Thermalright Peerless Assassin 120',
      subtitle: 'Dissipatore aria, tanto per i soldi. Prezzo solo se il negozio risponde.',
      imageTone: '#8d99ae',
      merchants: [
        shop('Amazon', 'https://www.amazon.it/s?k=Thermalright+Peerless+Assassin+120'),
        shop('PcComponentes', 'https://www.pccomponentes.it/buscar/?query=Peerless%20Assassin'),
      ],
      tags: ['pc', 'COOLER', 'Thermalright', 'PA120', 'aria', 'dissipatore'],
    }),
    pcPart({
      id: 'pc-arctic-lf3-360',
      title: 'Arctic Liquid Freezer III 360',
      subtitle: 'AIO 360 mm. Monitora quando scende.',
      imageTone: '#00a3e0',
      merchants: [
        shop('Amazon', 'https://www.amazon.it/s?k=Arctic+Liquid+Freezer+III+360'),
        shop('PcComponentes', 'https://www.pccomponentes.it/buscar/?query=Liquid%20Freezer%20III%20360'),
      ],
      tags: ['pc', 'COOLER', 'Arctic', 'AIO', '360', 'liquido', 'dissipatore'],
    }),
    pcPart({
      id: 'pc-wd-sn850x-2tb',
      title: 'WD Black SN850X 2TB',
      subtitle: 'SSD NVMe PCIe 4.0. Per il PC, non un disco NAS.',
      imageTone: '#000000',
      merchants: [
        shop('Amazon', 'https://www.amazon.it/s?k=WD+Black+SN850X+2TB'),
        shop('PcComponentes', 'https://www.pccomponentes.it/buscar/?query=SN850X%202TB'),
      ],
      tags: ['pc', 'SSD', 'NVMe', '2TB', 'WD', 'SN850X'],
    }),
    pcPart({
      id: 'pc-crucial-t500-2tb',
      title: 'Crucial T500 2TB',
      subtitle: 'SSD NVMe. Listino da negozio, niente cifra inventata.',
      imageTone: '#2b2d42',
      merchants: [
        shop('Amazon', 'https://www.amazon.it/s?k=Crucial+T500+2TB'),
        shop('PcComponentes', 'https://www.pccomponentes.it/buscar/?query=Crucial%20T500%202TB'),
      ],
      tags: ['pc', 'SSD', 'NVMe', '2TB', 'Crucial', 'T500'],
    }),
  ]
}

export const deals: Deal[] = [
  item({
    id: 'nas-ugreen-dxp2800',
    title: 'UGREEN NASync DXP2800',
    subtitle:
      'NAS 2-bay, Intel N100, 8GB DDR5, UGOS Pro. Listino ufficiale EU circa 369,99 € (RRP 439,99 €). Amazon.it B0D2K9J5TY, disponibilità variabile.',
    category: 'nas',
    kind: 'listino',
    currentPrice: 369.99,
    normalPrice: 439.99,
    avgPrice: 399,
    minPrice6m: 369.99,
    imageTone: '#1b4332',
    merchants: [
      {
        name: 'UGREEN',
        price: 369.99,
        url: 'https://nas-eu.ugreen.com/en-it/products/ugreen-nasync-dxp2800-nas-storage',
        shipping: 'sito ufficiale EU · sett. 2026',
      },
      {
        name: 'Amazon',
        price: 369.98,
        url: 'https://www.amazon.it/dp/B0D2K9J5TY',
        shipping: 'scheda IT · verifica stock',
      },
      {
        name: 'eBay',
        price: 0,
        url: 'https://www.ebay.it/sch/i.html?_nkw=UGREEN+NASync+DXP2800',
        shipping: 'usato/nuovo, varia',
      },
    ],
    tags: ['NAS', 'UGREEN', 'UGOS', 'NASync', 'DXP2800', '2800', 'DXP', '2-bay', 'N100'],
  }),
  item({
    id: 'nas-ugreen-dxp4800',
    title: 'UGREEN NASync DXP4800',
    subtitle:
      'NAS 4-bay della stessa famiglia. Prezzo Italia non fissato qui: apri il negozio e imposta l’alert.',
    category: 'nas',
    kind: 'monitora',
    currentPrice: 0,
    normalPrice: 0,
    avgPrice: 0,
    minPrice6m: 0,
    priceUnknown: true,
    imageTone: '#2d6a4f',
    merchants: [
      {
        name: 'UGREEN',
        price: 0,
        url: 'https://nas-eu.ugreen.com/en-it/search?q=DXP4800',
      },
      {
        name: 'Amazon',
        price: 0,
        url: 'https://www.amazon.it/s?k=UGREEN+NASync+DXP4800',
      },
    ],
    tags: ['NAS', 'UGREEN', 'UGOS', 'NASync', 'DXP4800', '4800', '4-bay'],
  }),
  item({
    id: 'nas-wd-red-12',
    title: 'WD Red Plus 12TB',
    subtitle: 'HDD NAS CMR (WD120EFGX). Amazon.it intorno ai 399 €, non a 180 €.',
    category: 'nas',
    currentPrice: 399,
    normalPrice: 399,
    avgPrice: 449,
    minPrice6m: 399,
    imageTone: '#1d3557',
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
    tags: ['HDD', 'NAS', '12TB', 'WD120EFGX'],
  }),
  item({
    id: 'nas-synology-ds224',
    title: 'Synology DS224+',
    subtitle: 'NAS 2-bay. Street price Italia circa 389–415 €.',
    category: 'nas',
    currentPrice: 389,
    normalPrice: 389,
    avgPrice: 405,
    minPrice6m: 389,
    imageTone: '#264653',
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
    tags: ['NAS', 'Synology', '2-bay', 'DS224'],
  }),
  item({
    id: 'nas-samsung-990',
    title: 'Samsung 990 PRO 2TB',
    subtitle: 'SSD NVMe. Listini Italia circa 240–350 € a seconda del heatsink.',
    category: 'nas',
    currentPrice: 249,
    normalPrice: 249,
    avgPrice: 280,
    minPrice6m: 239.5,
    imageTone: '#14213d',
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
    tags: ['SSD', 'NVMe', '2TB'],
  }),
  item({
    id: 'nas-crucial-32ram',
    title: 'Crucial DDR4 32GB SODIMM',
    subtitle: 'Kit 2x16 3200 MHz. Amazon.it intorno ai 239–249 €, non a 50 €.',
    category: 'pc',
    currentPrice: 239,
    normalPrice: 239,
    avgPrice: 255,
    minPrice6m: 239,
    imageTone: '#2b2d42',
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
    tags: ['pc', 'RAM', 'SODIMM', '32GB', 'DDR4'],
  }),

  ...pcParts(),

  item({
    id: 'sw-libreoffice',
    title: 'LibreOffice',
    subtitle: 'Suite office completa, davvero gratis (open source). Non un “errore di prezzo”.',
    category: 'software',
    kind: 'gratis',
    currentPrice: 0,
    normalPrice: 0,
    avgPrice: 0,
    minPrice6m: 0,
    isFree: true,
    imageTone: '#0b6e4f',
    merchants: [
      {
        name: 'LibreOffice',
        price: 0,
        url: 'https://www.libreoffice.org/download/download-libreoffice/',
      },
    ],
    tags: ['office', 'gratis', 'open source', 'writer', 'calc'],
  }),
  item({
    id: 'sw-vlc',
    title: 'VLC media player',
    subtitle: 'Player video, davvero gratis. VideoLAN non lo vende.',
    category: 'software',
    kind: 'gratis',
    currentPrice: 0,
    normalPrice: 0,
    avgPrice: 0,
    minPrice6m: 0,
    isFree: true,
    imageTone: '#ff6b00',
    merchants: [
      {
        name: 'VideoLAN',
        price: 0,
        url: 'https://www.videolan.org/vlc/',
      },
    ],
    tags: ['player', 'gratis', 'video'],
  }),
  item({
    id: 'sw-microsoft-365',
    title: 'Microsoft 365 Personal',
    subtitle:
      'Abbonamento annuale. Listino IT spesso intorno ai 69 €/anno: verifica sul sito Microsoft, non è un deal inventato.',
    category: 'software',
    currentPrice: 69,
    normalPrice: 69,
    avgPrice: 69,
    minPrice6m: 59,
    imageTone: '#2b579a',
    merchants: [
      {
        name: 'Microsoft',
        price: 69,
        url: 'https://www.microsoft.com/it-it/microsoft-365/buy/compare-all-microsoft-365-products',
      },
      {
        name: 'Amazon',
        price: 69,
        url: 'https://www.amazon.it/s?k=Microsoft+365+Personal',
      },
    ],
    tags: ['office', 'microsoft', '365', 'abbonamento'],
  }),

  item({
    id: 'steam-stardew',
    title: 'Stardew Valley',
    subtitle: 'Listino Steam EUR 13,99. Entra spesso in sconto stagionale: monitora, non è gratis oggi.',
    category: 'steam',
    kind: 'monitora',
    currentPrice: 13.99,
    normalPrice: 13.99,
    avgPrice: 11.5,
    minPrice6m: 6.99,
    imageTone: '#3d5a2a',
    merchants: [
      {
        name: 'Steam',
        price: 13.99,
        url: 'https://store.steampowered.com/app/413150/Stardew_Valley/',
      },
      {
        name: 'GOG',
        price: 13.99,
        url: 'https://www.gog.com/en/game/stardew_valley',
      },
    ],
    tags: ['gioco', 'steam', 'indie', 'farm'],
  }),
  item({
    id: 'steam-hollow-knight',
    title: 'Hollow Knight',
    subtitle: 'Listino Steam EUR circa 14,79. Sconta spesso durante i Seasonal Sale.',
    category: 'steam',
    kind: 'monitora',
    currentPrice: 14.79,
    normalPrice: 14.79,
    avgPrice: 12,
    minPrice6m: 7.39,
    imageTone: '#1a1a2e',
    merchants: [
      {
        name: 'Steam',
        price: 14.79,
        url: 'https://store.steampowered.com/app/367520/Hollow_Knight/',
      },
      {
        name: 'GOG',
        price: 14.79,
        url: 'https://www.gog.com/en/game/hollow_knight',
      },
    ],
    tags: ['gioco', 'steam', 'metroidvania'],
  }),
  item({
    id: 'steam-hades',
    title: 'Hades',
    subtitle: 'Listino Steam EUR circa 23,79. Supergiant va in sconto sulle sale Steam/Epic.',
    category: 'steam',
    kind: 'monitora',
    currentPrice: 23.79,
    normalPrice: 23.79,
    avgPrice: 18,
    minPrice6m: 11.89,
    imageTone: '#6b1d1d',
    merchants: [
      {
        name: 'Steam',
        price: 23.79,
        url: 'https://store.steampowered.com/app/1145360/Hades/',
      },
      {
        name: 'Epic Games',
        price: 23.79,
        url: 'https://store.epicgames.com/it/p/hades',
      },
    ],
    tags: ['gioco', 'steam', 'roguelike', 'hades'],
  }),
  item({
    id: 'steam-balatro',
    title: 'Balatro',
    subtitle: 'Listino Steam EUR 14,99. Poker-roguelike, sconta nelle sale.',
    category: 'steam',
    kind: 'monitora',
    currentPrice: 14.99,
    normalPrice: 14.99,
    avgPrice: 13,
    minPrice6m: 11.24,
    imageTone: '#c1121f',
    merchants: [
      {
        name: 'Steam',
        price: 14.99,
        url: 'https://store.steampowered.com/app/2379780/Balatro/',
      },
    ],
    tags: ['gioco', 'steam', 'indie', 'carte'],
  }),
  item({
    id: 'steam-bg3',
    title: 'Baldur’s Gate 3',
    subtitle: 'Listino Steam EUR 59,99. Sconta sulle sale Larian/Steam, non è un prezzo errore.',
    category: 'steam',
    kind: 'monitora',
    currentPrice: 59.99,
    normalPrice: 59.99,
    avgPrice: 52,
    minPrice6m: 41.99,
    imageTone: '#3c096c',
    merchants: [
      {
        name: 'Steam',
        price: 59.99,
        url: 'https://store.steampowered.com/app/1086940/Baldurs_Gate_3/',
      },
      {
        name: 'GOG',
        price: 59.99,
        url: 'https://www.gog.com/en/game/baldurs_gate_iii',
      },
    ],
    tags: ['gioco', 'steam', 'rpg', 'larian'],
  }),
  item({
    id: 'steam-cyberpunk',
    title: 'Cyberpunk 2077',
    subtitle: 'Listino Steam EUR 59,99. CDPR sconta spesso, a volte con DLC incluso.',
    category: 'steam',
    kind: 'monitora',
    currentPrice: 59.99,
    normalPrice: 59.99,
    avgPrice: 40,
    minPrice6m: 19.79,
    imageTone: '#f4d35e',
    merchants: [
      {
        name: 'Steam',
        price: 59.99,
        url: 'https://store.steampowered.com/app/1091500/Cyberpunk_2077/',
      },
      {
        name: 'GOG',
        price: 59.99,
        url: 'https://www.gog.com/en/game/cyberpunk_2077',
      },
      {
        name: 'Epic Games',
        price: 59.99,
        url: 'https://store.epicgames.com/it/p/cyberpunk-2077',
      },
    ],
    tags: ['gioco', 'steam', 'rpg', 'cdpr'],
  }),
  item({
    id: 'steam-witcher3',
    title: 'The Witcher 3: Wild Hunt',
    subtitle: 'Complete Edition, listino Steam spesso 49,99 €. Storicamente va molto in sconto.',
    category: 'steam',
    kind: 'monitora',
    currentPrice: 49.99,
    normalPrice: 49.99,
    avgPrice: 25,
    minPrice6m: 9.99,
    imageTone: '#1b4332',
    merchants: [
      {
        name: 'Steam',
        price: 49.99,
        url: 'https://store.steampowered.com/app/292030/The_Witcher_3_Wild_Hunt/',
      },
      {
        name: 'GOG',
        price: 49.99,
        url: 'https://www.gog.com/en/game/the_witcher_3_wild_hunt',
      },
    ],
    tags: ['gioco', 'steam', 'rpg', 'witcher'],
  }),
  item({
    id: 'steam-portal2',
    title: 'Portal 2',
    subtitle: 'Listino Steam EUR circa 8,19. Valve lo mette in sconto a ogni sale.',
    category: 'steam',
    kind: 'monitora',
    currentPrice: 8.19,
    normalPrice: 8.19,
    avgPrice: 4.5,
    minPrice6m: 1.63,
    imageTone: '#e36414',
    merchants: [
      {
        name: 'Steam',
        price: 8.19,
        url: 'https://store.steampowered.com/app/620/Portal_2/',
      },
    ],
    tags: ['gioco', 'steam', 'puzzle', 'valve'],
  }),
  item({
    id: 'game-gta6',
    title: 'Grand Theft Auto VI',
    subtitle:
      'Prevendita. Confronto Xbox, PlayStation Store e i negozi PC. Il prezzo solo se lo store risponde.',
    category: 'steam',
    kind: 'monitora',
    currentPrice: 0,
    normalPrice: 0,
    avgPrice: 0,
    minPrice6m: 0,
    priceUnknown: true,
    imageTone: '#1a472a',
    merchants: [
      {
        name: 'Xbox',
        price: 0,
        url: 'https://www.xbox.com/it-IT/games/store/grand-theft-auto-vi/9p3h4968grsm',
        shipping: 'prevendita',
      },
      {
        name: 'PlayStation Store',
        price: 0,
        url: 'https://store.playstation.com/it-it/search/Grand%20Theft%20Auto%20VI',
        shipping: 'prevendita',
      },
      {
        name: 'Steam',
        price: 0,
        url: 'https://store.steampowered.com/search/?term=Grand+Theft+Auto+VI',
      },
    ],
    tags: ['gioco', 'gta', 'gta6', 'vi', 'prevendita', 'preordine', 'xbox', 'playstation'],
  }),

  item({
    id: 'and-forest',
    title: 'Forest (Android)',
    subtitle:
      'App a pagamento su Play Store (listino spesso 3,99 €). A volte in promo o “da a pagamento a gratis”: monitora, non è gratis oggi.',
    category: 'android',
    kind: 'monitora',
    currentPrice: 3.99,
    normalPrice: 3.99,
    avgPrice: 3.99,
    minPrice6m: 0,
    imageTone: '#2d6a4f',
    merchants: [
      {
        name: 'Google Play',
        price: 3.99,
        url: 'https://play.google.com/store/apps/details?id=cc.forestapp',
      },
    ],
    tags: ['android', 'focus', 'produttivita', 'a pagamento'],
  }),
  item({
    id: 'and-nova-prime',
    title: 'Nova Launcher Prime',
    subtitle:
      'Launcher Android a pagamento. Entra in promo Play Store: avvisa quando da a pagamento va gratis o in sconto.',
    category: 'android',
    kind: 'monitora',
    currentPrice: 4.99,
    normalPrice: 4.99,
    avgPrice: 4.99,
    minPrice6m: 0,
    imageTone: '#1d3557',
    merchants: [
      {
        name: 'Google Play',
        price: 4.99,
        url: 'https://play.google.com/store/apps/details?id=com.teslacoilsw.launcher.prime',
      },
    ],
    tags: ['android', 'launcher', 'nova', 'a pagamento'],
  }),
  item({
    id: 'and-tasker',
    title: 'Tasker',
    subtitle:
      'Automazione Android, listino Play Store circa 3,59 €. Non inventiamo un giveaway: imposta l’alert promo.',
    category: 'android',
    kind: 'monitora',
    currentPrice: 3.59,
    normalPrice: 3.59,
    avgPrice: 3.59,
    minPrice6m: 0,
    imageTone: '#22223b',
    merchants: [
      {
        name: 'Google Play',
        price: 3.59,
        url: 'https://play.google.com/store/apps/details?id=net.dinglisch.android.taskerm',
      },
    ],
    tags: ['android', 'automazione', 'tasker', 'a pagamento'],
  }),
  item({
    id: 'and-poweramp',
    title: 'Poweramp',
    subtitle: 'Player audio Android a pagamento. Play Store lo mette in offerta a ondate.',
    category: 'android',
    kind: 'monitora',
    currentPrice: 4.99,
    normalPrice: 4.99,
    avgPrice: 4.99,
    minPrice6m: 0,
    imageTone: '#9b2226',
    merchants: [
      {
        name: 'Google Play',
        price: 4.99,
        url: 'https://play.google.com/store/apps/details?id=com.maxmpz.audioplayer',
      },
    ],
    tags: ['android', 'musica', 'player', 'a pagamento'],
  }),
  item({
    id: 'and-solid-explorer',
    title: 'Solid Explorer',
    subtitle: 'File manager Android a pagamento, listino basso. Tipico caso “paid → free” in promo.',
    category: 'android',
    kind: 'monitora',
    currentPrice: 1.99,
    normalPrice: 1.99,
    avgPrice: 1.99,
    minPrice6m: 0,
    imageTone: '#0077b6',
    merchants: [
      {
        name: 'Google Play',
        price: 1.99,
        url: 'https://play.google.com/store/apps/details?id=pl.solidexplorer2',
      },
    ],
    tags: ['android', 'file', 'explorer', 'a pagamento'],
  }),

  item({
    id: 'ios-procreate',
    title: 'Procreate',
    subtitle:
      'Disegno su iPad, listino App Store 12,99 € (acquisto unico). Raramente gratis: monitora sconti ufficiali.',
    category: 'ios',
    kind: 'monitora',
    currentPrice: 12.99,
    normalPrice: 12.99,
    avgPrice: 12.99,
    minPrice6m: 12.99,
    imageTone: '#8d0801',
    merchants: [
      {
        name: 'App Store',
        price: 12.99,
        url: 'https://apps.apple.com/it/app/procreate/id425073498',
      },
    ],
    tags: ['ios', 'ipad', 'disegno', 'a pagamento'],
  }),
  item({
    id: 'ios-things3',
    title: 'Things 3',
    subtitle:
      'GTD su iPhone/iPad, listino intorno ai 19,99 € (device). Cultured Code sconta di rado: alert, non fake free.',
    category: 'ios',
    kind: 'monitora',
    currentPrice: 19.99,
    normalPrice: 19.99,
    avgPrice: 19.99,
    minPrice6m: 9.99,
    imageTone: '#1d3557',
    merchants: [
      {
        name: 'App Store',
        price: 19.99,
        url: 'https://apps.apple.com/it/app/things-3/id904694759',
      },
    ],
    tags: ['ios', 'iphone', 'todo', 'a pagamento'],
  }),
  item({
    id: 'ios-forest',
    title: 'Forest (iOS)',
    subtitle:
      'Stessa app di Android, store separato. Listino App Store spesso 3,99 €. Promo “paid → free” a ondate.',
    category: 'ios',
    kind: 'monitora',
    currentPrice: 3.99,
    normalPrice: 3.99,
    avgPrice: 3.99,
    minPrice6m: 0,
    imageTone: '#40916c',
    merchants: [
      {
        name: 'App Store',
        price: 3.99,
        url: 'https://apps.apple.com/it/app/forest-focus-for-productivity/id866450515',
      },
    ],
    tags: ['ios', 'iphone', 'focus', 'a pagamento'],
  }),
  item({
    id: 'ios-darkroom',
    title: 'Darkroom',
    subtitle:
      'Foto su iPhone. L’app è free-to-download con IAP Pro: monitora le finestre in cui Pro va in prova o sconto.',
    category: 'ios',
    kind: 'monitora',
    currentPrice: 0,
    normalPrice: 0,
    avgPrice: 0,
    minPrice6m: 0,
    priceUnknown: true,
    imageTone: '#111111',
    merchants: [
      {
        name: 'App Store',
        price: 0,
        url: 'https://apps.apple.com/it/app/darkroom-photo-editor/id953286746',
      },
    ],
    tags: ['ios', 'foto', 'editor'],
  }),
  item({
    id: 'and-stardew',
    title: 'Stardew Valley (Android)',
    subtitle: 'Gioco su Google Play. Prezzo solo se lo store risponde.',
    category: 'android',
    kind: 'monitora',
    currentPrice: 0,
    normalPrice: 0,
    avgPrice: 0,
    minPrice6m: 0,
    priceUnknown: true,
    imageTone: '#3d5a2a',
    merchants: [
      {
        name: 'Google Play',
        price: 0,
        url: 'https://play.google.com/store/apps/details?id=com.chucklefish.stardewvalley',
      },
    ],
    tags: ['android', 'gioco', 'stardew', 'indie', 'farm'],
  }),
  item({
    id: 'and-minecraft',
    title: 'Minecraft (Android)',
    subtitle: 'Gioco su Google Play. Prezzo solo se lo store risponde.',
    category: 'android',
    kind: 'monitora',
    currentPrice: 0,
    normalPrice: 0,
    avgPrice: 0,
    minPrice6m: 0,
    priceUnknown: true,
    imageTone: '#5a7d2a',
    merchants: [
      {
        name: 'Google Play',
        price: 0,
        url: 'https://play.google.com/store/apps/details?id=com.mojang.minecraftpe',
      },
    ],
    tags: ['android', 'gioco', 'minecraft', 'costruzione'],
  }),
  item({
    id: 'and-dead-cells',
    title: 'Dead Cells (Android)',
    subtitle: 'Gioco d’azione su Google Play. Prezzo solo se lo store risponde.',
    category: 'android',
    kind: 'monitora',
    currentPrice: 0,
    normalPrice: 0,
    avgPrice: 0,
    minPrice6m: 0,
    priceUnknown: true,
    imageTone: '#6b1d1d',
    merchants: [
      {
        name: 'Google Play',
        price: 0,
        url: 'https://play.google.com/store/apps/details?id=com.playdigious.deadcells.mobile',
      },
    ],
    tags: ['android', 'gioco', 'dead cells', 'azione'],
  }),
  item({
    id: 'and-monument',
    title: 'Monument Valley (Android)',
    subtitle: 'Gioco puzzle su Google Play. Prezzo solo se lo store risponde.',
    category: 'android',
    kind: 'monitora',
    currentPrice: 0,
    normalPrice: 0,
    avgPrice: 0,
    minPrice6m: 0,
    priceUnknown: true,
    imageTone: '#c9a227',
    merchants: [
      {
        name: 'Google Play',
        price: 0,
        url: 'https://play.google.com/store/apps/details?id=com.ustwo.monumentvalley',
      },
    ],
    tags: ['android', 'gioco', 'monument valley', 'puzzle'],
  }),
  item({
    id: 'ios-stardew',
    title: 'Stardew Valley (iOS)',
    subtitle: 'Gioco sull’App Store. Prezzo live da iTunes quando risponde.',
    category: 'ios',
    kind: 'monitora',
    currentPrice: 0,
    normalPrice: 0,
    avgPrice: 0,
    minPrice6m: 0,
    priceUnknown: true,
    imageTone: '#3d5a2a',
    merchants: [
      {
        name: 'App Store',
        price: 0,
        url: 'https://apps.apple.com/it/app/stardew-valley/id1406710800',
      },
    ],
    tags: ['ios', 'gioco', 'stardew', 'indie', 'farm'],
  }),
  item({
    id: 'ios-minecraft',
    title: 'Minecraft (iOS)',
    subtitle: 'Gioco sull’App Store. Prezzo live da iTunes quando risponde.',
    category: 'ios',
    kind: 'monitora',
    currentPrice: 0,
    normalPrice: 0,
    avgPrice: 0,
    minPrice6m: 0,
    priceUnknown: true,
    imageTone: '#5a7d2a',
    merchants: [
      {
        name: 'App Store',
        price: 0,
        url: 'https://apps.apple.com/it/app/minecraft/id479516143',
      },
    ],
    tags: ['ios', 'gioco', 'minecraft', 'costruzione'],
  }),
  item({
    id: 'ios-dead-cells',
    title: 'Dead Cells (iOS)',
    subtitle: 'Gioco d’azione sull’App Store. Prezzo live da iTunes quando risponde.',
    category: 'ios',
    kind: 'monitora',
    currentPrice: 0,
    normalPrice: 0,
    avgPrice: 0,
    minPrice6m: 0,
    priceUnknown: true,
    imageTone: '#6b1d1d',
    merchants: [
      {
        name: 'App Store',
        price: 0,
        url: 'https://apps.apple.com/it/app/dead-cells/id1389752090',
      },
    ],
    tags: ['ios', 'gioco', 'dead cells', 'azione'],
  }),
  item({
    id: 'ios-monument',
    title: 'Monument Valley (iOS)',
    subtitle: 'Gioco puzzle sull’App Store. Prezzo live da iTunes quando risponde.',
    category: 'ios',
    kind: 'monitora',
    currentPrice: 0,
    normalPrice: 0,
    avgPrice: 0,
    minPrice6m: 0,
    priceUnknown: true,
    imageTone: '#c9a227',
    merchants: [
      {
        name: 'App Store',
        price: 0,
        url: 'https://apps.apple.com/it/app/monument-valley/id728293409',
      },
    ],
    tags: ['ios', 'gioco', 'monument valley', 'puzzle'],
  }),
].map((d) => (d.category === 'steam' ? withGameStores(d) : d))

export const kindLabel: Record<DealKind, string> = {
  gratis: 'Gratis',
  sconto: 'Sconto forte',
  minimo: 'Minimo storico',
  errore: 'Errore di prezzo',
  coupon: 'Coupon nascosto',
  scade: 'Scade oggi',
  listino: 'Listino',
  monitora: 'Avvisa in promo',
  lookup: 'Cerca nei negozi',
}

export const categoryLabel: Record<Category, string> = {
  software: 'Software',
  nas: 'NAS / Storage',
  pc: 'Componenti PC',
  steam: 'Giochi',
  android: 'Android',
  ios: 'iOS',
}

const TONE: Record<Category, string> = {
  nas: '#1d3557',
  pc: '#3d2b1f',
  software: '#2b579a',
  steam: '#1b2838',
  android: '#1b7a4a',
  ios: '#0a84ff',
}

export function formatPrice(price: number, currency = '€') {
  if (price === 0) return 'Gratis'
  return `${currency}${price.toFixed(2).replace('.', ',')}`
}

export function formatDealPrice(deal: Pick<Deal, 'currentPrice' | 'currency' | 'priceUnknown' | 'isFree'>) {
  if (deal.priceUnknown) return 'Vedi negozio'
  if (deal.isFree || deal.currentPrice === 0) return 'Gratis'
  return formatPrice(deal.currentPrice, deal.currency)
}

export function formatMerchantPrice(deal: Deal, merchant: Merchant) {
  if (deal.priceUnknown || (merchant.price === 0 && !deal.isFree)) return 'Apri'
  return formatPrice(merchant.price, deal.currency)
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

export function unslug(value: string) {
  return value
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export function guessCategory(query: string): Category {
  const t = query.toLowerCase()
  if (/\b(ios|iphone|ipad|app store|appstore)\b/.test(t)) return 'ios'
  if (/\b(android|play store|google play|playstore)\b/.test(t)) return 'android'
  if (
    /\b(steam|epic|gog|gioco|giochi|game|games|humble|videogioco|playstation|xbox|ps5|ps4|prevendita|preordine|preorder)\b/.test(
      t,
    )
  ) {
    return 'steam'
  }
  if (/\b(office|windows|adobe|antivirus|licenza|saas|software|libreoffice)\b/.test(t)) {
    return 'software'
  }
  if (
    /\b(cpu|gpu|ryzen|radeon|rtx|geforce|case|cabinet|mobo|motherboard|psu|ddr5|ddr4|cooler|dissipatore|am5|lga1700|lga1851|alimentatore|processore)\b/.test(
      t,
    ) ||
    /\b(scheda madre|scheda video|componenti)\b/.test(t)
  ) {
    return 'pc'
  }
  if (/\b(nas|ugreen|synology|qnap|terramaster|seagate|ironwolf|nasync|dxp)\b/.test(t)) {
    return 'nas'
  }
  if (/\b(ram|ssd|nvme|hdd|wd)\b/.test(t)) {
    return /\b(nas|red plus|ironwolf)\b/.test(t) ? 'nas' : 'pc'
  }
  return 'nas'
}

function lookupSubtitle(category: Category, title: string) {
  const q = title.trim()
  if (category === 'steam') {
    return `Non è (ancora) nel radar. Apri Steam, PlayStation Store, Xbox e i key shop. Se è una prevendita, confronta dove conviene prenotare “${q}”.`
  }
  if (category === 'android') {
    return `Cerca su Google Play. Se è a pagamento, ti avvisiamo quando va in promo o diventa gratis.`
  }
  if (category === 'ios') {
    return `Cerca sull’App Store (iPhone/iPad), store separato da Android. Alert su sconto o “paid → free”.`
  }
  if (category === 'software') {
    return `Prodotto non in catalogo: apri i negozi e monitora il listino. Niente prezzo inventato.`
  }
  if (category === 'pc') {
    return `Componente non (ancora) in catalogo. Apri Amazon, LDLC, Alternate, MediaWorld… e monitora “${q}”.`
  }
  return `Anche se non è in offerta, lo cerchiamo nei negozi. Apri Amazon/sito e attiva l’alert sul tuo prezzo.`
}

export function lookupMerchants(title: string, category: Category): Merchant[] {
  const q = encodeURIComponent(title.replace(/[—–]/g, ' ').replace(/\s+/g, ' ').trim())
  if (category === 'steam') {
    return [
      { name: 'Steam', price: 0, url: `https://store.steampowered.com/search/?term=${q}` },
      { name: 'Epic Games', price: 0, url: `https://store.epicgames.com/it/browse?q=${q}` },
      { name: 'GOG', price: 0, url: `https://www.gog.com/en/games?query=${q}` },
      {
        name: 'Instant Gaming',
        price: 0,
        url: `https://www.instant-gaming.com/it/ricerca/?q=${q}`,
      },
      { name: 'PlayStation Store', price: 0, url: `https://store.playstation.com/it-it/search/${q}` },
      { name: 'Xbox', price: 0, url: `https://www.microsoft.com/it-it/search/shop/games?q=${q}` },
    ]
  }
  if (category === 'android') {
    return [
      {
        name: 'Google Play',
        price: 0,
        url: `https://play.google.com/store/search?q=${q}&c=apps`,
      },
    ]
  }
  if (category === 'ios') {
    return [{ name: 'App Store', price: 0, url: `https://apps.apple.com/it/search?term=${q}` }]
  }
  if (category === 'software') {
    return [
      { name: 'Amazon', price: 0, url: `https://www.amazon.it/s?k=${q}` },
      { name: 'Microsoft', price: 0, url: `https://www.microsoft.com/it-it/search/explore?q=${q}` },
      { name: 'Google', price: 0, url: `https://www.google.com/search?q=${q}+software+ufficiale` },
    ]
  }
  if (category === 'pc' || category === 'nas') {
    return [
      { name: 'Amazon', price: 0, url: `https://www.amazon.it/s?k=${q}` },
      { name: 'PcComponentes', price: 0, url: `https://www.pccomponentes.it/buscar/?query=${q}` },
      { name: 'LDLC', price: 0, url: `https://www.ldlc.com/it-it/recherche/?q=${q}` },
      { name: 'Alternate', price: 0, url: `https://www.alternate.it/listing.xhtml?q=${q}` },
      { name: 'MediaWorld', price: 0, url: `https://www.mediaworld.it/search?q=${q}` },
      { name: 'Unieuro', price: 0, url: `https://www.unieuro.it/online/search?query=${q}` },
      { name: 'eBay', price: 0, url: `https://www.ebay.it/sch/i.html?_nkw=${q}` },
    ]
  }
  return [
    { name: 'Amazon', price: 0, url: `https://www.amazon.it/s?k=${q}` },
    { name: 'eBay', price: 0, url: `https://www.ebay.it/sch/i.html?_nkw=${q}` },
    { name: 'UGREEN', price: 0, url: `https://nas-eu.ugreen.com/en-it/search?q=${q}` },
    { name: 'PcComponentes', price: 0, url: `https://www.pccomponentes.it/buscar/?query=${q}` },
  ]
}

export function makeLookupDeal(query: string, category: Category, id?: string): Deal {
  const title = query.trim().replace(/\s+/g, ' ')
  return {
    id: id ?? `q-${category}-${slugify(title)}`,
    title,
    subtitle: lookupSubtitle(category, title),
    category,
    kind: 'lookup',
    currentPrice: 0,
    normalPrice: 0,
    currency: '€',
    discountPct: 0,
    avgPrice: 0,
    minPrice6m: 0,
    isFree: false,
    priceUnknown: true,
    lookup: true,
    imageTone: TONE[category],
    merchants: lookupMerchants(title, category),
    history: [],
    tags: ['ricerca', category, ...title.toLowerCase().split(/\s+/).filter(Boolean)],
    checkedAt: PRICES_CHECKED_AT,
  }
}

export function parseLookupId(id: string): { category: Category; title: string } | null {
  if (!id.startsWith('q-')) return null
  const rest = id.slice(2)
  const dash = rest.indexOf('-')
  if (dash <= 0) return { category: guessCategory(rest), title: unslug(rest) }
  const cat = rest.slice(0, dash)
  const slug = rest.slice(dash + 1)
  if (isCategory(cat) && slug) return { category: cat, title: unslug(slug) }
  return { category: guessCategory(rest), title: unslug(rest) }
}

export function getDeal(id: string) {
  const found = deals.find((d) => d.id === id)
  if (found) return found
  const parsed = parseLookupId(id)
  if (!parsed) return undefined
  return makeLookupDeal(parsed.title, parsed.category, id)
}

export function formatCheckedAt(iso = PRICES_CHECKED_AT) {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

export function priceDeltaLabel(deal: Deal) {
  if (deal.verdict) return deal.verdict.label
  if (deal.lookup || deal.priceUnknown) return 'apri i negozi'
  if (deal.kind === 'monitora' && (deal.category === 'android' || deal.category === 'ios')) {
    return 'da a pagamento → gratis'
  }
  if (isPreorderDeal(deal)) return 'confronta prevendite'
  if (deal.kind === 'monitora' && deal.category === 'steam') return 'sconta sulle sale'
  if (deal.discountPct > 0) return deal.isFree ? '100% risparmio' : `−${deal.discountPct}%`
  return 'prezzo di mercato'
}

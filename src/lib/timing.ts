import { bestLivePrice, type Deal, type Verdict } from '../data/deals'

const BUY_NOW = new Set(['eccezionale', 'ottimo', 'gratis'])
const BUY_KINDS = new Set(['gratis', 'sconto', 'minimo', 'errore', 'coupon', 'scade'])

function num(v: number | null | undefined) {
  if (v == null || v === 0) return v === 0 ? 0 : null
  return Number.isFinite(v) ? v : null
}

function pack(
  kind: Verdict['kind'],
  label: string,
  detail: string,
  pctBelowAvg: number | null,
): Verdict {
  return {
    kind,
    label,
    question: 'È questo il momento giusto per comprarlo?',
    detail,
    pctBelowAvg,
  }
}

function detail(drop: number, nearMin: boolean, closer: string) {
  const bits: string[] = []
  if (drop > 0) bits.push(`${Math.round(drop)}% sotto la media o il listino`)
  if (nearMin) bits.push('vicino al minimo osservato')
  bits.push(closer)
  return bits.join(' · ')
}

/** Stesso giudizio del server, per il catalogo quando l’API non risponde. */
export function judgeFromPrices(deal: Deal): Verdict {
  if (deal.priceUnknown) {
    return pack(
      'sconosciuto',
      'PREZZO NON DISPONIBILE',
      'Meglio nessuna cifra che un numero inventato. Apri il negozio o monitora.',
      null,
    )
  }

  const current = deal.isFree ? 0 : num(deal.currentPrice)
  if (deal.isFree || current === 0) {
    return pack('gratis', 'GRATIS', 'Sì, è gratis adesso.', null)
  }
  if (current == null) {
    return pack(
      'sconosciuto',
      'PREZZO NON DISPONIBILE',
      'Meglio nessuna cifra che un numero inventato. Apri il negozio o monitora.',
      null,
    )
  }

  const avg = deal.avgPrice > 0 ? deal.avgPrice : null
  const min = deal.minPrice6m > 0 ? deal.minPrice6m : null
  const list = deal.normalPrice > 0 ? deal.normalPrice : null
  const samples = deal.sampleCount ?? deal.history?.length ?? 0
  const vsAvg = avg != null ? (1 - current / avg) * 100 : null
  const vsList = list != null ? (1 - current / list) * 100 : null
  const drop = vsAvg ?? vsList
  const nearMin = min != null && current <= min * 1.05

  if (drop != null && drop >= 25) {
    return pack('eccezionale', 'PREZZO ECCEZIONALE', detail(drop, nearMin, 'È il momento di comprarlo.'), Math.round(drop))
  }
  if (drop != null && drop >= 15) {
    return pack('ottimo', 'OTTIMO PREZZO', detail(drop, nearMin, 'Conviene rispetto al solito.'), Math.round(drop))
  }
  if (samples < 2 && (vsList == null || vsList < 8)) {
    return pack(
      'pochi-dati',
      'STORICO IN COSTRUZIONE',
      `Rilevato €${current.toFixed(2).replace('.', ',')}. Monitora: il giudizio arriva quando c’è un passato vero.`,
      null,
    )
  }
  if ((vsAvg != null && vsAvg >= 0) || (vsList != null && vsList >= 8) || nearMin) {
    return pack(
      'abbastanza',
      'ABBASTANZA',
      detail(drop ?? 0, nearMin, 'Non è un affare clamoroso, ma non stai pagando il picco.'),
      drop == null ? null : Math.round(drop),
    )
  }
  return pack('normale', 'PREZZO NORMALE', 'Non è il momento migliore. Imposta l’alert e aspetta.', drop == null ? null : Math.round(drop))
}

export function withVerdict(deal: Deal): Deal {
  const live = bestLivePrice(deal)
  const priced =
    live != null && live > 0 && deal.priceUnknown
      ? { ...deal, priceUnknown: false, currentPrice: live }
      : deal
  if (priced.verdict && !deal.priceUnknown) return priced
  return { ...priced, verdict: judgeFromPrices(priced) }
}

export function isWorthBuyingNow(deal: Deal): boolean {
  const v = deal.verdict ?? judgeFromPrices(deal)
  if (BUY_NOW.has(v.kind)) return true
  if (deal.isFree) return true
  if (!deal.verdict && BUY_KINDS.has(deal.kind)) return true
  return false
}

export function splitByTiming(deals: Deal[]) {
  const rows = deals.map(withVerdict)
  return {
    now: rows.filter(isWorthBuyingNow),
    wait: rows.filter((d) => !isWorthBuyingNow(d)),
  }
}

export function suggestedWatchTarget(deals: Deal[]): number {
  const priced = deals.filter((d) => !d.priceUnknown && !d.isFree && d.currentPrice > 0)
  const pick = priced[0]
  if (!pick) return 0
  if (pick.minPrice6m > 0) return Math.round(pick.minPrice6m * 0.98 * 100) / 100
  return Math.round(pick.currentPrice * 0.9 * 100) / 100
}

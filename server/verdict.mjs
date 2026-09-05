/** @typedef {'eccezionale' | 'ottimo' | 'abbastanza' | 'normale' | 'sconosciuto' | 'gratis' | 'pochi-dati'} VerdictKind */

/**
 * Giudizio Cercatrova: non “dove costa meno”, ma “è il momento di comprare?”.
 * Usa solo dati reali. Meglio pochi-dati / sconosciuto che una media inventata.
 *
 * @param {{
 *   current: number | null
 *   avg: number | null
 *   min: number | null
 *   list: number | null
 *   isFree?: boolean
 *   sampleCount?: number
 * }} input
 */
export function judgePrice(input) {
  const current = num(input.current)
  const avg = num(input.avg)
  const min = num(input.min)
  const list = num(input.list)
  const samples = input.sampleCount ?? 0

  if (input.isFree || current === 0) {
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

  const vsAvg = avg != null && avg > 0 ? (1 - current / avg) * 100 : null
  const vsList = list != null && list > 0 ? (1 - current / list) * 100 : null
  const drop = vsAvg ?? vsList
  const nearMin = min != null && min > 0 && current <= min * 1.05

  if (drop != null && drop >= 25) {
    return pack(
      'eccezionale',
      'PREZZO ECCEZIONALE',
      detail(drop, nearMin, 'È il momento di comprarlo.'),
      drop,
    )
  }
  if (drop != null && drop >= 15) {
    return pack(
      'ottimo',
      'OTTIMO PREZZO',
      detail(drop, nearMin, 'Conviene rispetto al solito.'),
      drop,
    )
  }
  if (samples < 2 && (vsList == null || vsList < 8)) {
    return pack(
      'pochi-dati',
      'STORICO IN COSTRUZIONE',
      `Rilevato ${fmt(current)}. Monitora: il giudizio arriva quando c’è un passato vero.`,
      null,
    )
  }

  if ((vsAvg != null && vsAvg >= 0) || (vsList != null && vsList >= 8) || nearMin) {
    return pack(
      'abbastanza',
      'ABBASTANZA',
      detail(drop ?? 0, nearMin, 'Non è un affare clamoroso, ma non stai pagando il picco.'),
      drop,
    )
  }

  return pack(
    'normale',
    'PREZZO NORMALE',
    'Non è il momento migliore. Imposta l’alert e aspetta.',
    drop,
  )
}

function pack(kind, label, detail, pctBelowAvg) {
  return {
    kind,
    label,
    question: 'È questo il momento giusto per comprarlo?',
    detail,
    pctBelowAvg: pctBelowAvg == null ? null : Math.round(pctBelowAvg),
  }
}

function detail(drop, nearMin, closer) {
  const bits = []
  if (drop > 0) bits.push(`${Math.round(drop)}% sotto la media o il listino`)
  if (nearMin) bits.push('vicino al minimo osservato')
  bits.push(closer)
  return bits.join(' · ')
}

function num(v) {
  if (v == null || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function fmt(n) {
  return `€${n.toFixed(2).replace('.', ',')}`
}

export function kindFromVerdict(verdict, lookup) {
  if (lookup) return 'lookup'
  if (verdict.kind === 'gratis') return 'gratis'
  if (verdict.kind === 'eccezionale' || verdict.kind === 'ottimo') return 'sconto'
  if (verdict.kind === 'sconosciuto' || verdict.kind === 'pochi-dati') return 'monitora'
  return 'listino'
}

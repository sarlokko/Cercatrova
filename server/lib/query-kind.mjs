const STOP = new Set(['per', 'del', 'della', 'dei', 'delle', 'con', 'una', 'uno', 'the', 'and'])

export const GENERIC_TOKENS = new Set([
  'gioco',
  'giochi',
  'game',
  'games',
  'videogioco',
  'action',
  'azione',
  'adventure',
  'avventura',
  'rpg',
  'shooter',
  'sparatutto',
  'strategy',
  'strategia',
  'simulation',
  'simulazione',
  'sim',
  'sport',
  'sportivi',
  'racing',
  'corse',
  'horror',
  'survival',
  'puzzle',
  'fighting',
  'picchiaduro',
  'platformer',
  'piattaforma',
  'indie',
  'open',
  'world',
  'mondo',
  'aperto',
  'android',
  'ios',
  'iphone',
  'ipad',
  'cpu',
  'gpu',
  'ram',
  'case',
  'cabinet',
  'mobo',
  'motherboard',
  'psu',
  'cooler',
  'ssd',
  'nvme',
  'hdd',
  'nas',
  'ddr4',
  'ddr5',
  'dimm',
  'sodimm',
  'mid',
  'tower',
  'atx',
  'componenti',
  'processore',
  'alimentatore',
  'dissipatore',
  'scheda',
  'madre',
  'qualsiasi',
  'qualunque',
])

const STORE_PREFIX = new Set(['android', 'ios', 'iphone', 'ipad', 'gioco', 'giochi', 'game', 'games'])

export function queryTokens(q) {
  return String(q || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .split(/[^a-z0-9+]+/i)
    .filter((t) => t.length > 1 && !STOP.has(t))
}

/** Ricerca a tap (genere / tipo), non un modello o un titolo. */
export function isBrowseQuery(q) {
  const t = queryTokens(q)
  if (!t.length) return true
  return t.every((w) => GENERIC_TOKENS.has(w))
}

export function browseKind(q) {
  if (!isBrowseQuery(q)) return 'specific'
  const rest = queryTokens(q).filter((w) => !STORE_PREFIX.has(w))
  return rest.length ? 'genre' : 'any'
}

export function titleHasSpecific(title, q) {
  const need = queryTokens(q).filter((w) => !GENERIC_TOKENS.has(w))
  if (!need.length) return false
  const hay = queryTokens(title)
  return need.every((w) => hay.includes(w) || hay.some((h) => h.includes(w) || w.includes(h)))
}

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
  'sata',
  'hdd',
  'nas',
  'ddr4',
  'ddr5',
  'dimm',
  'sodimm',
  'mid',
  'full',
  'tower',
  'atx',
  'mini',
  'itx',
  'componenti',
  'processore',
  'processori',
  'alimentatore',
  'dissipatore',
  'scheda',
  'madre',
  'video',
  'grafica',
  'ryzen',
  'intel',
  'amd',
  'nvidia',
  'rtx',
  'radeon',
  'geforce',
  'ultra',
  'core',
  'am5',
  'b650',
  'z790',
  'z890',
  'lga1700',
  'lga1851',
  'aio',
  'aria',
  'liquido',
  'ugreen',
  'synology',
  'qnap',
  'terramaster',
  'nasync',
  'diskstation',
  'bay',
  'vani',
  '16gb',
  '32gb',
  '48gb',
  '64gb',
  '1tb',
  '2tb',
  '4tb',
  '8tb',
  '12tb',
  '16tb',
  '650w',
  '750w',
  '850w',
  '1000w',
  'memoria',
  'software',
  'office',
  'disegno',
  'illustrazione',
  'todo',
  'produttivita',
  'lettore',
  'player',
  'musica',
  'focus',
  'file',
  'manager',
  'pc',
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

/** Ricerca a tap (genere / famiglia), non un modello o un titolo. */
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

/**
 * Famiglie di mercato → 1-2 ricerche Amazon.
 * Un SKU (7800X3D, RTX 5070) resta la query originale.
 */
export function expandMarketQueries(q) {
  const raw = String(q || '').trim()
  if (!raw) return []
  if (!isBrowseQuery(raw)) return [raw]
  const t = raw.toLowerCase()

  if (isCpuQuery(t) && !/\b(ryzen|intel|amd)\b/.test(t)) {
    return ['processore amd ryzen', 'processore intel core']
  }
  if (/\bryzen\b/.test(t)) return ['processore amd ryzen']
  if (/\bintel\b/.test(t) && !/\b(nas|ssd|optane)\b/.test(t)) return ['processore intel core']

  if (isGpuQuery(t) && !/\b(rtx|radeon|nvidia|geforce)\b/.test(t)) {
    return ['scheda video nvidia rtx', 'scheda video amd radeon']
  }
  if (/\b(rtx|nvidia|geforce)\b/.test(t)) return ['scheda video nvidia rtx']
  if (/\bradeon\b/.test(t)) return ['scheda video amd radeon']

  if (isRamQuery(t) && !/\b\d+gb\b/.test(t)) {
    if (/\bsodimm\b/.test(t)) return ['ram sodimm ddr5', 'ram sodimm ddr4']
    if (/\bddr4\b/.test(t)) return ['ram ddr4 32gb', 'ram ddr4 16gb']
    return ['ram ddr5 32gb', 'ram ddr5 16gb']
  }

  if (isSsdQuery(t) && !/\b\d+tb\b/.test(t) && !/\b\d+gb\b/.test(t)) {
    if (/\bsata\b/.test(t)) return ['ssd sata 1tb', 'ssd sata 2tb']
    return ['ssd nvme 1tb', 'ssd nvme 2tb']
  }

  if (isPsuQuery(t) && !/\b\d+w\b/.test(t)) {
    return ['alimentatore 750w gold', 'alimentatore 850w gold']
  }

  if (isCaseQuery(t)) {
    if (/\b(mini|itx)\b/.test(t)) return ['case mini itx']
    if (/\bfull\b/.test(t)) return ['case pc full tower']
    if (/\bmid\b/.test(t)) return ['case pc mid tower']
    return ['case pc mid tower', 'case pc mini itx']
  }

  if (isMoboQuery(t)) {
    if (/\b(am5|b650)\b/.test(t)) return ['scheda madre am5']
    if (/\b(z790|lga1700)\b/.test(t)) return ['scheda madre intel z790']
    if (/\b(z890|lga1851)\b/.test(t)) return ['scheda madre intel z890']
    return ['scheda madre am5', 'scheda madre intel']
  }

  if (isCoolerQuery(t) && !/\b(aio|240|360)\b/.test(t)) {
    return ['dissipatore cpu aria', 'aio 360']
  }

  if (isNasQuery(t) && !/\b(ugreen|synology|qnap|terramaster|dxp)\b/.test(t)) {
    return ['nas 2 bay', 'nas 4 bay']
  }
  if (/\bugreen\b/.test(t)) return ['ugreen nas']
  if (/\bsynology\b/.test(t)) return ['synology nas']
  if (/\bqnap\b/.test(t)) return ['qnap nas']
  if (/\bterramaster\b/.test(t)) return ['terramaster nas']

  if (isHddQuery(t) && !/\b\d+tb\b/.test(t)) {
    return ['hdd nas 8tb', 'hdd nas 12tb']
  }

  if (/\b(disegno|illustrazione)\b/.test(t)) return [raw]
  if (/\b(todo|produttivita)\b/.test(t)) return [raw]
  if (/\boffice\b/.test(t)) return ['microsoft 365', 'libreoffice']
  if (/\b(lettore|player|vlc)\b/.test(t)) return ['lettore video']

  return [raw]
}

function isCpuQuery(t) {
  return /\b(cpu|processore|processori)\b/.test(t)
}

function isGpuQuery(t) {
  return /\b(gpu|scheda grafica|scheda video)\b/.test(t)
}

function isRamQuery(t) {
  return /\b(ram|memoria ram|ddr5|ddr4|sodimm)\b/.test(t)
}

function isSsdQuery(t) {
  return /\b(ssd|nvme)\b/.test(t)
}

function isPsuQuery(t) {
  return /\b(psu|alimentatore)\b/.test(t)
}

function isCaseQuery(t) {
  return /\b(case|cabinet)\b/.test(t)
}

function isMoboQuery(t) {
  return /\b(mobo|motherboard|scheda madre|am5|b650|z790|z890|lga1700|lga1851)\b/.test(t)
}

function isCoolerQuery(t) {
  return /\b(cooler|dissipatore)\b/.test(t)
}

function isNasQuery(t) {
  return /\bnas\b/.test(t)
}

function isHddQuery(t) {
  return /\b(hdd|disco)\b/.test(t)
}

import type { Category } from '../data/deals'

export type GuideChoice = {
  id: string
  label: string
  hint?: string
  query?: string
  category?: Category | 'all'
  next?: GuideStep
}

export type GuideStep = {
  id: string
  question: string
  aside: string
  choices: GuideChoice[]
  freeLabel?: string
}

export function walkStep(root: GuideStep, path: GuideChoice[]): GuideStep {
  let step = root
  for (const choice of path) {
    if (!choice.next) break
    step = choice.next
  }
  return step
}

export function buildQuery(path: GuideChoice[], extra = '') {
  const bits = path.map((c) => c.query || c.label).filter(Boolean)
  if (extra.trim()) bits.push(extra.trim())
  return bits.join(' ').replace(/\s+/g, ' ').trim()
}

export function buildCategory(path: GuideChoice[]): 'all' | Category {
  for (let i = path.length - 1; i >= 0; i--) {
    const c = path[i]?.category
    if (c && c !== 'all') return c
  }
  return 'all'
}

export const GUIDE_ROOT: GuideStep = {
  id: 'root',
  question: 'Cosa stai cercando?',
  aside: 'Clicca una categoria. Poi ti faccio due o tre domande e ti trovo la più adatta.',
  freeLabel: 'Lo so già: scrivo il modello',
  choices: [
    {
      id: 'nas',
      label: 'Un NAS',
      hint: 'box in casa per i file',
      query: 'nas',
      category: 'nas',
      next: {
        id: 'nas-brand',
        question: 'Bene. Di che marca?',
        aside: 'Se non sai, scegli “Non importa”: guardo quelli che conviene monitorare.',
        choices: [
          {
            id: 'ugreen',
            label: 'UGREEN',
            hint: 'UGOS Pro, DXP',
            query: 'ugreen nasync',
            next: {
              id: 'nas-bays',
              question: 'Quanti vani (bay)?',
              aside: 'I dischi si comprano a parte.',
              choices: [
                { id: '2bay', label: '2 vani', query: '2-bay dxp2800' },
                { id: '4bay', label: '4 vani', query: '4-bay dxp4800' },
                { id: 'piu', label: '6 o più', query: '6-bay' },
                { id: 'bo', label: 'Non lo so', query: 'nas' },
              ],
            },
          },
          {
            id: 'synology',
            label: 'Synology',
            hint: 'DiskStation',
            query: 'synology',
            next: {
              id: 'syno-bays',
              question: 'Quanti vani?',
              aside: 'DS224+ è il 2-bay più cercato.',
              choices: [
                { id: 's2', label: '2 vani', query: 'ds224' },
                { id: 's4', label: '4 vani', query: 'ds923' },
                { id: 'sbo', label: 'Non lo so', query: 'diskstation' },
              ],
            },
          },
          { id: 'qnap', label: 'QNAP', query: 'qnap nas' },
          { id: 'terra', label: 'TerraMaster', query: 'terramaster nas' },
          { id: 'any-nas', label: 'Non importa', hint: 'scegli tu', query: 'nas 2-bay' },
        ],
      },
    },
    {
      id: 'ram',
      label: 'RAM',
      hint: 'memoria per PC o NAS',
      query: 'ram',
      category: 'nas',
      next: {
        id: 'ram-type',
        question: 'Bene. Di che tipo?',
        aside: 'I NAS UGREEN/Synology recenti usano spesso DDR5 SODIMM.',
        choices: [
          {
            id: 'ddr5',
            label: 'DDR5',
            query: 'ddr5',
            next: ramAmount('ddr5'),
          },
          {
            id: 'ddr4',
            label: 'DDR4',
            query: 'ddr4',
            next: ramAmount('ddr4'),
          },
          {
            id: 'sodimm',
            label: 'SODIMM (NAS / laptop)',
            query: 'sodimm',
            next: ramAmount('sodimm'),
          },
          { id: 'ram-bo', label: 'Non lo so', query: 'ram' },
        ],
      },
    },
    {
      id: 'hdd',
      label: 'Un disco HDD',
      hint: 'per NAS, tanti TB',
      query: 'hdd nas',
      category: 'nas',
      next: {
        id: 'hdd-size',
        question: 'Quanta capacità?',
        aside: 'Per un NAS meglio CMR (WD Red Plus, IronWolf).',
        choices: [
          { id: '4tb', label: '4 TB', query: '4tb' },
          { id: '8tb', label: '8 TB', query: '8tb' },
          { id: '12tb', label: '12 TB', query: '12tb red plus' },
          { id: '16tb', label: '16 TB', query: '16tb' },
          { id: 'hdd-bo', label: 'Non lo so', query: 'wd red' },
        ],
      },
    },
    {
      id: 'ssd',
      label: 'Un SSD',
      hint: 'NVMe o SATA',
      query: 'ssd',
      category: 'nas',
      next: {
        id: 'ssd-type',
        question: 'Che tipo di SSD?',
        aside: 'NVMe è il più veloce. Per cache NAS spesso basta un 1–2 TB.',
        choices: [
          { id: 'nvme', label: 'NVMe', query: 'nvme', next: ssdSize('nvme') },
          { id: 'sata', label: 'SATA 2,5"', query: 'sata ssd', next: ssdSize('sata ssd') },
          { id: 'ssd-bo', label: 'Non lo so', query: 'ssd 2tb' },
        ],
      },
    },
    {
      id: 'game',
      label: 'Un gioco PC',
      hint: 'Steam, Epic, GOG',
      query: 'steam',
      category: 'steam',
      next: {
        id: 'game-kind',
        question: 'Che genere ti va?',
        aside: 'Cerco il listino Steam e ti dico se conviene aspettare la sale.',
        choices: [
          { id: 'indie', label: 'Indie / avventura', query: 'indie' },
          { id: 'rpg', label: 'RPG', query: 'rpg' },
          { id: 'action', label: 'Azione', query: 'action' },
          { id: 'specific', label: 'Ho già il titolo', hint: 'lo scrivo sotto', query: '' },
        ],
      },
    },
    {
      id: 'and',
      label: 'Un’app Android',
      hint: 'Play Store, anche a pagamento',
      query: 'android',
      category: 'android',
      next: {
        id: 'and-kind',
        question: 'A cosa ti serve?',
        aside: 'Android e iOS sono store separati.',
        choices: [
          { id: 'a-focus', label: 'Focus / produttività', query: 'focus' },
          { id: 'a-file', label: 'File e automazione', query: 'file manager' },
          { id: 'a-music', label: 'Musica', query: 'player' },
          { id: 'a-any', label: 'Ho già il nome', query: '' },
        ],
      },
    },
    {
      id: 'ios',
      label: 'Un’app iPhone / iPad',
      hint: 'App Store, distinto da Android',
      query: 'ios',
      category: 'ios',
      next: {
        id: 'ios-kind',
        question: 'A cosa ti serve?',
        aside: 'Le promo “da a pagamento a gratis” arrivano a ondate.',
        choices: [
          { id: 'i-draw', label: 'Disegno', query: 'procreate' },
          { id: 'i-todo', label: 'Liste / GTD', query: 'things' },
          { id: 'i-focus', label: 'Focus', query: 'forest' },
          { id: 'i-any', label: 'Ho già il nome', query: '' },
        ],
      },
    },
    {
      id: 'soft',
      label: 'Software per il PC',
      hint: 'office, player, licenze',
      query: 'software',
      category: 'software',
      next: {
        id: 'soft-kind',
        question: 'Che tipo di programma?',
        aside: 'Se è davvero gratis (LibreOffice, VLC) te lo dico. Niente fake giveaway.',
        choices: [
          { id: 'office', label: 'Office / documenti', query: 'office' },
          { id: 'player', label: 'Video / musica', query: 'vlc' },
          { id: 'soft-any', label: 'Ho già il nome', query: '' },
        ],
      },
    },
  ],
}

function ramAmount(prefix: string): GuideStep {
  return {
    id: `ram-amt-${prefix}`,
    question: 'Quanta te ne serve?',
    aside: 'Dimmi i gigabyte. Poi ti trovo la più adatta — non un prezzo inventato.',
    freeLabel: 'Un’altra quantità',
    choices: [
      { id: '16', label: '16 GB', query: '16gb' },
      { id: '32', label: '32 GB', query: '32gb' },
      { id: '48', label: '48 GB', hint: 'tipo 32+16', query: '48gb' },
      { id: '64', label: '64 GB', query: '64gb' },
    ],
  }
}

function ssdSize(prefix: string): GuideStep {
  return {
    id: `ssd-sz-${prefix}`,
    question: 'Di che taglia?',
    aside: '1–2 TB è la fascia che si cerca di più.',
    choices: [
      { id: '1t', label: '1 TB', query: '1tb' },
      { id: '2t', label: '2 TB', query: '2tb' },
      { id: '4t', label: '4 TB', query: '4tb' },
      { id: 'sbo', label: 'Non lo so', query: '' },
    ],
  }
}

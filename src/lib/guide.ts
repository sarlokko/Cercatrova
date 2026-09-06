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
  const bits = path.map((c) => (c.query || '').trim()).filter(Boolean)
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

/** Generi principali degli store, non una selezione a tre. */
export const MAIN_GAME_GENRES: { id: string; label: string; query: string }[] = [
  { id: 'action', label: 'Azione', query: 'action' },
  { id: 'adventure', label: 'Avventura', query: 'adventure' },
  { id: 'rpg', label: 'RPG', query: 'rpg' },
  { id: 'shooter', label: 'Sparatutto', query: 'shooter' },
  { id: 'strategy', label: 'Strategia', query: 'strategy' },
  { id: 'sim', label: 'Simulazione', query: 'simulation' },
  { id: 'sport', label: 'Sport', query: 'sport' },
  { id: 'racing', label: 'Corse', query: 'racing' },
  { id: 'horror', label: 'Horror', query: 'horror' },
  { id: 'survival', label: 'Survival', query: 'survival' },
  { id: 'puzzle', label: 'Puzzle', query: 'puzzle' },
  { id: 'fighting', label: 'Picchiaduro', query: 'fighting' },
  { id: 'platform', label: 'Piattaforma', query: 'platformer' },
  { id: 'indie', label: 'Indie', query: 'indie' },
  { id: 'openworld', label: 'Mondo aperto', query: 'open world' },
]

function genreChoices(prefix = ''): GuideChoice[] {
  const p = prefix ? `${prefix}-` : ''
  return [
    ...MAIN_GAME_GENRES.map((g) => ({
      id: `${p}${g.id}`,
      label: g.label,
      query: g.query,
    })),
    { id: `${p}any`, label: 'Qualsiasi', hint: 'senza filtro di genere', query: 'gioco' },
    { id: `${p}title`, label: 'Ho già il titolo', hint: 'lo scrivo sotto', query: '' },
  ]
}

function gameKindStep(aside: string): GuideStep {
  return {
    id: 'game-kind',
    question: 'Che genere ti va?',
    aside: `${aside} Qualsiasi = le offerte del momento, non un elenco fisso.`,
    freeLabel: 'Ho già il titolo',
    choices: genreChoices(),
  }
}

function mobileGameStep(store: 'android' | 'ios'): GuideStep {
  return {
    id: `${store}-game`,
    question: 'Che genere ti va?',
    aside:
      store === 'android'
        ? 'Stessi generi del PC. Guardo il Play Store, senza prezzo inventato. Qualsiasi = ricerca generale.'
        : 'Stessi generi del PC. Guardo l’App Store, distinto da Android. Qualsiasi = ricerca generale.',
    freeLabel: 'Ho già il titolo',
    choices: genreChoices(`${store}-g`),
  }
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
      id: 'pc',
      label: 'Componenti PC',
      hint: 'case, CPU, GPU, RAM…',
      category: 'pc',
      next: pcPartsStep(),
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
      id: 'game',
      label: 'Un gioco',
      hint: 'PC, PlayStation, Xbox, prevendite',
      category: 'steam',
      next: {
        id: 'game-where',
        question: 'Dove lo vuoi?',
        aside: 'Offerte live di ora, non sempre gli stessi titoli. Steam, PS Store, Xbox e i key shop.',
        freeLabel: 'Ho già il titolo',
        choices: [
          {
            id: 'game-pc',
            label: 'PC',
            hint: 'Steam, Epic, GOG',
            next: gameKindStep(
              'Cerco Steam, Epic e GOG. PlayStation Store e Xbox restano nel confronto.',
            ),
          },
          {
            id: 'game-ps',
            label: 'PlayStation',
            hint: 'PS Store',
            next: gameKindStep(
              'PlayStation Store e i key shop. Se è prevendita, confronto anche Xbox.',
            ),
          },
          {
            id: 'game-xbox',
            label: 'Xbox',
            hint: 'Microsoft Store',
            next: gameKindStep(
              'Xbox e Microsoft Store. Se è prevendita, confronto anche PlayStation.',
            ),
          },
          {
            id: 'game-all',
            label: 'Confronta tutti',
            hint: 'PC + console',
            next: gameKindStep('Guardo tutti i negozi, prevendite comprese.'),
          },
          {
            id: 'game-pre',
            label: 'È una prevendita',
            hint: 'trova il posto migliore',
            next: {
              id: 'game-pre-title',
              question: 'Quale titolo?',
              aside:
                'Confronto Xbox, PlayStation Store e i negozi PC. Il prezzo solo se lo store risponde.',
              freeLabel: 'Un altro titolo',
              choices: [
                { id: 'gta6', label: 'GTA VI', query: 'gta vi' },
                { id: 'pre-bo', label: 'Ho il titolo', query: '' },
              ],
            },
          },
        ],
      },
    },
    {
      id: 'and',
      label: 'Un’app o un gioco Android',
      hint: 'Play Store, anche i giochi',
      query: 'android',
      category: 'android',
      next: {
        id: 'and-kind',
        question: 'A cosa ti serve?',
        aside: 'Android e iOS sono store separati. I giochi stanno nel Play Store.',
        choices: [
          { id: 'a-focus', label: 'Focus / produttività', query: 'focus' },
          { id: 'a-file', label: 'File e automazione', query: 'file manager' },
          { id: 'a-music', label: 'Musica', query: 'player' },
          { id: 'a-game', label: 'Un gioco', hint: 'Play Store', next: mobileGameStep('android') },
          { id: 'a-any', label: 'Ho già il nome', query: '' },
        ],
      },
    },
    {
      id: 'ios',
      label: 'Un’app o un gioco iPhone / iPad',
      hint: 'App Store, anche i giochi',
      query: 'ios',
      category: 'ios',
      next: {
        id: 'ios-kind',
        question: 'A cosa ti serve?',
        aside: 'Le promo “da a pagamento a gratis” arrivano a ondate. I giochi stanno sull’App Store.',
        choices: [
          { id: 'i-draw', label: 'Disegno', query: 'procreate' },
          { id: 'i-todo', label: 'Liste / GTD', query: 'things' },
          { id: 'i-focus', label: 'Focus', query: 'forest' },
          { id: 'i-game', label: 'Un gioco', hint: 'App Store', next: mobileGameStep('ios') },
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

function pcPartsStep(): GuideStep {
  return {
    id: 'pc-part',
    question: 'Che componente ti serve?',
    aside: 'Scegli il tipo. Poi guardo i negozi adesso: marche e modelli cambiano con le offerte.',
    freeLabel: 'Ho già il modello esatto',
    choices: [
      {
        id: 'case',
        label: 'Case',
        hint: 'cabinet, torre',
        query: 'case',
        next: {
          id: 'case-size',
          question: 'Che formato?',
          aside: 'Mid-tower è il più comune. Mini-ITX se vuoi piccolo.',
          choices: [
            {
              id: 'mid',
              label: 'Mid-tower',
              query: 'mid-tower atx',
              next: caseBrand('mid-tower'),
            },
            {
              id: 'itx',
              label: 'Mini-ITX',
              hint: 'compatto',
              query: 'mini-itx',
              next: caseBrand('mini-itx'),
            },
            { id: 'full', label: 'Full-tower', query: 'full-tower' },
            { id: 'case-bo', label: 'Non importa', query: 'case mid-tower' },
          ],
        },
      },
      {
        id: 'cpu',
        label: 'CPU',
        hint: 'processore',
        query: 'cpu',
        next: {
          id: 'cpu-brand',
          question: 'AMD o Intel?',
          aside: 'Poi ti chiedo la fascia. Se hai già il modello, scrivilo sotto.',
          choices: [
            {
              id: 'amd',
              label: 'AMD',
              hint: 'Ryzen, AM5',
              query: 'ryzen',
              next: {
                id: 'amd-tier',
                question: 'Quale Ryzen?',
                aside: 'Il 7800X3D è il più cercato per il gaming.',
                choices: [
                  { id: 'r5', label: 'Ryzen 5', hint: '7600 e simili', query: 'ryzen 5 7600' },
                  { id: 'r7x3d', label: 'Ryzen 7 X3D', hint: '7800X3D', query: '7800x3d' },
                  { id: 'r7', label: 'Ryzen 7', hint: '9700X', query: '9700x' },
                  { id: 'amd-bo', label: 'Non lo so', query: 'ryzen cpu' },
                ],
              },
            },
            {
              id: 'intel',
              label: 'Intel',
              hint: 'Core / Ultra',
              query: 'intel',
              next: {
                id: 'intel-tier',
                question: 'Quale Intel?',
                aside: '14600K è LGA1700. Ultra 7 è la generazione nuova (LGA1851).',
                choices: [
                  { id: 'i5', label: 'Core i5', hint: '14600K', query: '14600k' },
                  { id: 'u7', label: 'Core Ultra 7', hint: '265K', query: '265k' },
                  { id: 'intel-bo', label: 'Non lo so', query: 'intel cpu' },
                ],
              },
            },
            { id: 'cpu-bo', label: 'Non importa', query: 'cpu' },
          ],
        },
      },
      {
        id: 'gpu',
        label: 'GPU',
        hint: 'scheda video',
        query: 'gpu',
        next: {
          id: 'gpu-brand',
          question: 'NVIDIA o AMD?',
          aside: 'I listini saltano: se non conviene, ti avviso io.',
          choices: [
            {
              id: 'nvidia',
              label: 'NVIDIA',
              hint: 'GeForce RTX',
              query: 'rtx',
              next: {
                id: 'rtx-tier',
                question: 'Quale RTX?',
                aside: '5060 Ti / 5070 / 5080. Se hai già il modello, scrivilo.',
                choices: [
                  { id: '5060', label: 'RTX 5060 Ti', query: '5060 ti' },
                  { id: '5070', label: 'RTX 5070', query: '5070' },
                  { id: '5080', label: 'RTX 5080', query: '5080' },
                  { id: 'rtx-bo', label: 'Non lo so', query: 'rtx gpu' },
                ],
              },
            },
            {
              id: 'amdgpu',
              label: 'AMD',
              hint: 'Radeon',
              query: 'radeon',
              next: {
                id: 'rx-tier',
                question: 'Quale Radeon?',
                aside: '9070 XT è la fascia alta recente.',
                choices: [
                  { id: '9070', label: 'RX 9070 XT', query: '9070 xt' },
                  { id: 'rx-bo', label: 'Guarda tu', query: 'radeon gpu' },
                ],
              },
            },
            { id: 'gpu-bo', label: 'Non importa', query: 'gpu' },
          ],
        },
      },
      {
        id: 'ram',
        label: 'RAM',
        hint: 'memoria',
        query: 'ram',
        next: {
          id: 'ram-type',
          question: 'Bene. Di che tipo?',
          aside: 'Desktop = DIMM. NAS e laptop = SODIMM. I kit recenti sono DDR5.',
          choices: [
            { id: 'ddr5', label: 'DDR5', query: 'ddr5 dimm', next: ramAmount('ddr5') },
            { id: 'ddr4', label: 'DDR4', query: 'ddr4', next: ramAmount('ddr4') },
            { id: 'sodimm', label: 'SODIMM (NAS / laptop)', query: 'sodimm', next: ramAmount('sodimm') },
            { id: 'ram-bo', label: 'Non lo so', query: 'ram' },
          ],
        },
      },
      {
        id: 'mobo',
        label: 'Scheda madre',
        hint: 'motherboard',
        query: 'mobo',
        next: {
          id: 'mobo-sock',
          question: 'Che socket?',
          aside: 'Deve combaciare con la CPU. AM5 = Ryzen 7000/9000. LGA1851 = Ultra.',
          choices: [
            { id: 'am5', label: 'AM5', hint: 'Ryzen 7000/9000', query: 'b650 am5' },
            { id: 'lga1700', label: 'LGA1700', hint: '12ª–14ª gen', query: 'z790 lga1700' },
            { id: 'lga1851', label: 'LGA1851', hint: 'Core Ultra', query: 'z890 lga1851' },
            { id: 'mobo-bo', label: 'Non lo so', query: 'scheda madre' },
          ],
        },
      },
      {
        id: 'psu',
        label: 'Alimentatore',
        hint: 'PSU, i watt',
        query: 'psu',
        next: {
          id: 'psu-w',
          question: 'Quanti watt?',
          aside: '750 W sta su un 5070. 1000 W se punti in alto.',
          choices: [
            { id: 'w650', label: '650 W', query: '650w alimentatore' },
            { id: 'w750', label: '750 W', query: '750w' },
            { id: 'w850', label: '850 W', query: '850w' },
            { id: 'w1000', label: '1000 W', query: '1000w' },
            { id: 'psu-bo', label: 'Non lo so', query: 'alimentatore gold' },
          ],
        },
      },
      {
        id: 'cooler',
        label: 'Raffreddamento',
        hint: 'aria o liquido',
        query: 'cooler',
        next: {
          id: 'cool-kind',
          question: 'Aria o liquido?',
          aside: 'Aria è silenziosa e basta per tanta gente. AIO 360 se tiri la CPU.',
          choices: [
            { id: 'air', label: 'Aria', query: 'dissipatore aria' },
            { id: 'aio240', label: 'AIO 240 mm', query: 'aio 240' },
            { id: 'aio360', label: 'AIO 360 mm', query: 'aio 360' },
            { id: 'cool-bo', label: 'Non lo so', query: 'dissipatore' },
          ],
        },
      },
      {
        id: 'ssd',
        label: 'SSD',
        hint: 'NVMe o SATA',
        query: 'ssd',
        next: {
          id: 'ssd-type',
          question: 'Che tipo di SSD?',
          aside: 'Per il PC quasi sempre NVMe. 1–2 TB è la fascia più cercata.',
          choices: [
            { id: 'nvme', label: 'NVMe', query: 'nvme', next: ssdSize('nvme') },
            { id: 'sata', label: 'SATA 2,5"', query: 'sata ssd', next: ssdSize('sata ssd') },
            { id: 'ssd-bo', label: 'Non lo so', query: 'ssd 2tb' },
          ],
        },
      },
    ],
  }
}

function caseBrand(prefix: string): GuideStep {
  return {
    id: `case-brand-${prefix}`,
    question: 'Di che marca?',
    aside: 'Se non sai, “Non importa”: guardo i mid-tower che si cercano di più.',
    choices: [
      { id: 'fractal', label: 'Fractal', hint: 'North', query: 'fractal north' },
      { id: 'lianli', label: 'Lian Li', hint: 'Lancool', query: 'lian li lancool' },
      { id: 'corsair', label: 'Corsair', hint: '4000D', query: 'corsair 4000d' },
      { id: 'nzxt', label: 'NZXT', query: 'nzxt h5' },
      { id: 'case-any', label: 'Non importa', query: 'case' },
    ],
  }
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

/** Metadati noti. I prezzi NON stanno qui: arrivano dai collector. */

import { PC_SEED_PRODUCTS } from './catalog-pc.mjs'

export const SEED_PRODUCTS = [
  {
    id: 'nas-ugreen-dxp2800',
    title: 'UGREEN NASync DXP2800',
    subtitle: 'NAS 2-bay, Intel N100, 8GB DDR5, UGOS Pro. Disco non incluso.',
    category: 'nas',
    tags: ['NAS', 'UGREEN', 'UGOS', 'NASync', 'DXP2800', '2800', 'DXP', '2-bay', 'N100'],
    imageTone: '#1b4332',
    listings: [
      {
        store: 'UGREEN',
        url: 'https://nas-eu.ugreen.com/en-it/products/ugreen-nasync-dxp2800-nas-storage',
        externalId: 'ugreen-dxp2800',
      },
      {
        store: 'Amazon',
        url: 'https://www.amazon.it/dp/B0D2K9J5TY',
        externalId: 'B0D2K9J5TY',
      },
    ],
  },
  {
    id: 'nas-ugreen-dxp4800',
    title: 'UGREEN NASync DXP4800',
    subtitle: 'NAS 4-bay della stessa famiglia. Prezzo solo se il negozio risponde.',
    category: 'nas',
    tags: ['NAS', 'UGREEN', 'UGOS', 'NASync', 'DXP4800', '4800', '4-bay'],
    imageTone: '#2d6a4f',
    listings: [
      {
        store: 'UGREEN',
        url: 'https://nas-eu.ugreen.com/en-it/search?q=DXP4800',
        externalId: 'ugreen-dxp4800',
      },
      {
        store: 'Amazon',
        url: 'https://www.amazon.it/s?k=UGREEN+NASync+DXP4800',
        externalId: 'search-dxp4800',
      },
    ],
  },
  {
    id: 'nas-wd-red-12',
    title: 'WD Red Plus 12TB',
    subtitle: 'HDD NAS CMR (WD120EFGX).',
    category: 'nas',
    tags: ['HDD', 'NAS', '12TB', 'WD120EFGX'],
    imageTone: '#1d3557',
    listings: [
      {
        store: 'Amazon',
        url: 'https://www.amazon.it/dp/B0F4R6SNJG',
        externalId: 'B0F4R6SNJG',
      },
    ],
  },
  {
    id: 'nas-synology-ds224',
    title: 'Synology DS224+',
    subtitle: 'NAS 2-bay.',
    category: 'nas',
    tags: ['NAS', 'Synology', '2-bay', 'DS224'],
    imageTone: '#264653',
    listings: [
      {
        store: 'Amazon',
        url: 'https://www.amazon.it/s?k=Synology+DS224%2B',
        externalId: 'search-ds224',
      },
    ],
  },
  {
    id: 'nas-samsung-990',
    title: 'Samsung 990 PRO 2TB',
    subtitle: 'SSD NVMe.',
    category: 'nas',
    tags: ['SSD', 'NVMe', '2TB'],
    imageTone: '#14213d',
    listings: [
      {
        store: 'Amazon',
        url: 'https://www.amazon.it/s?k=samsung+990+pro+2tb',
        externalId: 'search-990pro',
      },
    ],
  },
  {
    id: 'nas-crucial-32ram',
    title: 'Crucial DDR4 32GB SODIMM',
    subtitle: 'Kit 2x16 3200 MHz.',
    category: 'pc',
    tags: ['pc', 'RAM', 'SODIMM', '32GB', 'DDR4'],
    imageTone: '#2b2d42',
    listings: [
      {
        store: 'Amazon',
        url: 'https://www.amazon.it/dp/B07ZLC7VNH',
        externalId: 'B07ZLC7VNH',
      },
    ],
  },
  {
    id: 'sw-libreoffice',
    title: 'LibreOffice',
    subtitle: 'Suite office open source, davvero gratis.',
    category: 'software',
    tags: ['office', 'gratis', 'open source'],
    imageTone: '#0b6e4f',
    free: true,
    listings: [
      {
        store: 'LibreOffice',
        url: 'https://www.libreoffice.org/download/download-libreoffice/',
        externalId: 'libreoffice',
      },
    ],
  },
  {
    id: 'sw-vlc',
    title: 'VLC media player',
    subtitle: 'Player video, davvero gratis.',
    category: 'software',
    tags: ['player', 'gratis', 'video'],
    imageTone: '#ff6b00',
    free: true,
    listings: [
      { store: 'VideoLAN', url: 'https://www.videolan.org/vlc/', externalId: 'vlc' },
    ],
  },
  {
    id: 'steam-stardew',
    title: 'Stardew Valley',
    subtitle: 'Listino e sconti dal negozio Steam, non da un catalogo fermo.',
    category: 'steam',
    tags: ['gioco', 'steam', 'indie', 'farm'],
    imageTone: '#3d5a2a',
    listings: [
      {
        store: 'Steam',
        url: 'https://store.steampowered.com/app/413150/Stardew_Valley/',
        externalId: '413150',
      },
    ],
  },
  {
    id: 'steam-hollow-knight',
    title: 'Hollow Knight',
    subtitle: 'Metroidvania. Prezzo live da Steam.',
    category: 'steam',
    tags: ['gioco', 'steam', 'metroidvania'],
    imageTone: '#1a1a2e',
    listings: [
      {
        store: 'Steam',
        url: 'https://store.steampowered.com/app/367520/Hollow_Knight/',
        externalId: '367520',
      },
    ],
  },
  {
    id: 'steam-hades',
    title: 'Hades',
    subtitle: 'Roguelike Supergiant. Prezzo live da Steam.',
    category: 'steam',
    tags: ['gioco', 'steam', 'roguelike', 'hades'],
    imageTone: '#6b1d1d',
    listings: [
      {
        store: 'Steam',
        url: 'https://store.steampowered.com/app/1145360/Hades/',
        externalId: '1145360',
      },
    ],
  },
  {
    id: 'steam-balatro',
    title: 'Balatro',
    subtitle: 'Poker-roguelike. Prezzo live da Steam.',
    category: 'steam',
    tags: ['gioco', 'steam', 'indie', 'carte'],
    imageTone: '#c1121f',
    listings: [
      {
        store: 'Steam',
        url: 'https://store.steampowered.com/app/2379780/Balatro/',
        externalId: '2379780',
      },
    ],
  },
  {
    id: 'steam-bg3',
    title: 'Baldur’s Gate 3',
    subtitle: 'RPG Larian. Prezzo live da Steam.',
    category: 'steam',
    tags: ['gioco', 'steam', 'rpg', 'larian'],
    imageTone: '#3c096c',
    listings: [
      {
        store: 'Steam',
        url: 'https://store.steampowered.com/app/1086940/Baldurs_Gate_3/',
        externalId: '1086940',
      },
    ],
  },
  {
    id: 'steam-cyberpunk',
    title: 'Cyberpunk 2077',
    subtitle: 'Prezzo live da Steam / sconti CDPR.',
    category: 'steam',
    tags: ['gioco', 'steam', 'rpg', 'cdpr'],
    imageTone: '#c9a227',
    listings: [
      {
        store: 'Steam',
        url: 'https://store.steampowered.com/app/1091500/Cyberpunk_2077/',
        externalId: '1091500',
      },
    ],
  },
  {
    id: 'steam-witcher3',
    title: 'The Witcher 3: Wild Hunt',
    subtitle: 'Prezzo live da Steam.',
    category: 'steam',
    tags: ['gioco', 'steam', 'rpg', 'witcher'],
    imageTone: '#1b4332',
    listings: [
      {
        store: 'Steam',
        url: 'https://store.steampowered.com/app/292030/The_Witcher_3_Wild_Hunt/',
        externalId: '292030',
      },
    ],
  },
  {
    id: 'steam-portal2',
    title: 'Portal 2',
    subtitle: 'Prezzo live da Steam.',
    category: 'steam',
    tags: ['gioco', 'steam', 'puzzle', 'valve'],
    imageTone: '#e36414',
    listings: [
      {
        store: 'Steam',
        url: 'https://store.steampowered.com/app/620/Portal_2/',
        externalId: '620',
      },
    ],
  },
  {
    id: 'and-forest',
    title: 'Forest (Android)',
    subtitle: 'App a pagamento su Play Store. Alert quando va in promo o gratis.',
    category: 'android',
    tags: ['android', 'focus', 'a pagamento'],
    imageTone: '#2d6a4f',
    listings: [
      {
        store: 'Google Play',
        url: 'https://play.google.com/store/apps/details?id=cc.forestapp',
        externalId: 'cc.forestapp',
      },
    ],
  },
  {
    id: 'and-nova-prime',
    title: 'Nova Launcher Prime',
    subtitle: 'Launcher Android a pagamento.',
    category: 'android',
    tags: ['android', 'launcher', 'nova'],
    imageTone: '#1d3557',
    listings: [
      {
        store: 'Google Play',
        url: 'https://play.google.com/store/apps/details?id=com.teslacoilsw.launcher.prime',
        externalId: 'com.teslacoilsw.launcher.prime',
      },
    ],
  },
  {
    id: 'and-tasker',
    title: 'Tasker',
    subtitle: 'Automazione Android a pagamento.',
    category: 'android',
    tags: ['android', 'automazione', 'tasker'],
    imageTone: '#22223b',
    listings: [
      {
        store: 'Google Play',
        url: 'https://play.google.com/store/apps/details?id=net.dinglisch.android.taskerm',
        externalId: 'net.dinglisch.android.taskerm',
      },
    ],
  },
  {
    id: 'ios-procreate',
    title: 'Procreate',
    subtitle: 'Disegno su iPad. Store iOS, distinto da Android.',
    category: 'ios',
    tags: ['ios', 'ipad', 'disegno'],
    imageTone: '#8d0801',
    listings: [
      {
        store: 'App Store',
        url: 'https://apps.apple.com/it/app/procreate/id425073498',
        externalId: '425073498',
      },
    ],
  },
  {
    id: 'ios-things3',
    title: 'Things 3',
    subtitle: 'GTD su iPhone/iPad.',
    category: 'ios',
    tags: ['ios', 'iphone', 'todo'],
    imageTone: '#1d3557',
    listings: [
      {
        store: 'App Store',
        url: 'https://apps.apple.com/it/app/things-3/id904694759',
        externalId: '904694759',
      },
    ],
  },
  {
    id: 'ios-forest',
    title: 'Forest (iOS)',
    subtitle: 'Stessa app di Android, store separato.',
    category: 'ios',
    tags: ['ios', 'iphone', 'focus'],
    imageTone: '#40916c',
    listings: [
      {
        store: 'App Store',
        url: 'https://apps.apple.com/it/app/forest-focus-for-productivity/id866450515',
        externalId: '866450515',
      },
    ],
  },
  ...PC_SEED_PRODUCTS,
]

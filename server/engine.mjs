import {
  getProductRow,
  listingId,
  listingsFor,
  listCatalog,
  markChecked,
  productIdByExternal,
  recordPrice,
  upsertListing,
  upsertProduct,
} from './db.mjs'
import { amazonProduct, amazonSearch } from './collectors/amazon.mjs'
import { officialPrice } from './collectors/official.mjs'
import { steamAppPrice, steamSearch } from './collectors/steam.mjs'
import { gameStorefronts, gogSearch, instantGamingSearch, isSearchUrl } from './collectors/stores.mjs'
import {
  extractXboxId,
  itunesSearch,
  xboxProduct,
  xboxSearch,
} from './collectors/console.mjs'
import { pickBest } from './collectors/match.mjs'
import { amazonPaused, noteStoreResult } from './collectors/guard.mjs'
import { assembleProduct } from './product.mjs'

const lastLive = new Map()

function recently(key, ms) {
  const t = lastLive.get(key)
  return t != null && Date.now() - t < ms
}

function touch(key) {
  lastLive.set(key, Date.now())
}

export function steamAppId(listing) {
  const ext = String(listing.external_id || '')
  if (/^\d+$/.test(ext)) return ext
  const m = String(listing.url || '').match(/\/app\/(\d+)/)
  return m?.[1] ?? null
}

export function listingCanLivePrice(listing) {
  const store = String(listing.store || '').toLowerCase()
  if (store.includes('playstation') || store.includes('epic') || store.includes('google play')) {
    return false
  }
  if (store.includes('steam')) return Boolean(steamAppId(listing))
  if (store.includes('xbox')) return true
  if (store.includes('app store')) return true
  if (store.includes('amazon')) return true
  if (store.includes('gog')) return true
  if (store.includes('instant')) return true
  if (store.includes('libreoffice') || store.includes('videolan') || store.includes('ugreen')) {
    return true
  }
  return false
}

async function refreshListingInner(listing) {
  const store = String(listing.store || '').toLowerCase()
  const product = getProductRow(listing.product_id)
  const title = product?.title || ''
  try {
    if (store.includes('steam')) {
      const appId = steamAppId(listing)
      const live = appId ? await steamAppPrice(appId) : pickBest(await steamSearch(title), title)
      if (live && live.price != null) {
        const ext = appId || live.appId || listing.external_id
        recordPrice(listing.id, live.price, live.available ?? 1)
        upsertListing({
          id: listing.id,
          productId: listing.product_id,
          store: listing.store,
          url: live.url || listing.url,
          externalId: ext,
          lastPrice: live.price,
          listPrice: live.list,
          available: live.available ?? 1,
          lastChecked: new Date().toISOString(),
        })
        return live
      }
      markChecked(listing.id, null)
      return null
    }

    if (store.includes('amazon')) {
      if (amazonPaused()) {
        return null
      }
      const url = listing.url || listing.external_id || ''
      if (isSearchUrl(url) || /\/s\?/.test(url)) {
        const hit = pickBest(await amazonSearch(title || url), title)
        if (hit?.price != null) {
          upsertListing({
            id: listing.id,
            productId: listing.product_id,
            store: listing.store,
            url: hit.url,
            externalId: hit.asin,
            lastPrice: hit.price,
            available: 1,
            lastChecked: new Date().toISOString(),
          })
          recordPrice(listing.id, hit.price, 1)
          return hit
        }
        markChecked(listing.id)
        return null
      }
      const live = await amazonProduct(url)
      if (live?.blocked) {
        markChecked(listing.id, live?.available ?? null)
        return null
      }
      if (live?.price != null) {
        recordPrice(listing.id, live.price, live.available ?? 1)
        return live
      }
      markChecked(listing.id, live?.available ?? null)
      return null
    }

    if (store.includes('gog')) {
      const hit = pickBest(await gogSearch(title), title)
      if (hit?.price != null) {
        upsertListing({
          id: listing.id,
          productId: listing.product_id,
          store: listing.store,
          url: hit.url || listing.url,
          externalId: hit.externalId || listing.external_id,
          lastPrice: hit.price,
          listPrice: hit.list,
          available: 1,
          lastChecked: new Date().toISOString(),
        })
        recordPrice(listing.id, hit.price, 1)
        return hit
      }
      markChecked(listing.id)
      return null
    }

    if (store.includes('instant')) {
      const hit = pickBest(await instantGamingSearch(title), title)
      if (hit?.price != null) {
        recordPrice(listing.id, hit.price, 1)
        return hit
      }
      markChecked(listing.id)
      return null
    }

    if (store.includes('xbox')) {
      const xboxId = listing.external_id && /^9[A-Z0-9]{11}$/i.test(listing.external_id)
        ? listing.external_id
        : extractXboxId(listing.url)
      if (xboxId) {
        const live = await xboxProduct(xboxId)
        if (live?.price != null) {
          upsertListing({
            id: listing.id,
            productId: listing.product_id,
            store: listing.store,
            url: live.url || listing.url,
            externalId: live.externalId || xboxId,
            lastPrice: live.price,
            listPrice: live.list,
            available: 1,
            lastChecked: new Date().toISOString(),
          })
          recordPrice(listing.id, live.price, 1)
          return live
        }
      }
      const hit = pickBest(await xboxSearch(title), title)
      if (hit?.price != null) {
        upsertListing({
          id: listing.id,
          productId: listing.product_id,
          store: listing.store,
          url: hit.url || listing.url,
          externalId: hit.externalId || listing.external_id,
          lastPrice: hit.price,
          listPrice: hit.list,
          available: 1,
          lastChecked: new Date().toISOString(),
        })
        recordPrice(listing.id, hit.price, 1)
        return hit
      }
      markChecked(listing.id)
      return null
    }

    if (store.includes('app store')) {
      const hit = pickBest(await itunesSearch(title), title)
      if (hit?.price != null) {
        upsertListing({
          id: listing.id,
          productId: listing.product_id,
          store: listing.store,
          url: hit.url || listing.url,
          externalId: hit.externalId || listing.external_id,
          lastPrice: hit.price,
          available: 1,
          lastChecked: new Date().toISOString(),
        })
        recordPrice(listing.id, hit.price, 1)
        return hit
      }
      markChecked(listing.id)
      return null
    }

    if (store.includes('playstation')) {
      markChecked(listing.id)
      return null
    }

    if (!isSearchUrl(listing.url) && listing.url) {
      const live = await officialPrice(listing.url)
      if (live?.price != null) {
        recordPrice(listing.id, live.price, live.available ?? 1)
        return live
      }
    }

    if (store.includes('ugreen') || store.includes('libreoffice') || store.includes('videolan')) {
      if (store.includes('libreoffice') || store.includes('videolan')) {
        recordPrice(listing.id, 0, 1)
        return { price: 0, isFree: true }
      }
      const live = await officialPrice(listing.url)
      if (live?.price != null) {
        recordPrice(listing.id, live.price, live.available ?? 1)
        if (live.list) {
          upsertListing({
            id: listing.id,
            productId: listing.product_id,
            store: listing.store,
            url: listing.url,
            externalId: listing.external_id,
            lastPrice: live.price,
            listPrice: live.list,
            available: 1,
            lastChecked: new Date().toISOString(),
          })
        }
        return live
      }
      markChecked(listing.id)
      return null
    }

    markChecked(listing.id)
    return null
  } catch (err) {
    markChecked(listing.id)
    throw err
  }
}

export async function refreshListing(listing) {
  try {
    const live = await refreshListingInner(listing)
    const store = String(listing.store || '')
    // Amazon si conta già in amazonProduct/amazonSearch (e nel cooldown non deve incrementare).
    if (!live?.blocked && !store.toLowerCase().includes('amazon')) {
      noteStoreResult(store, live?.price != null || live?.isFree === true, {
        productId: listing.product_id,
        reason: live?.price != null || live?.isFree ? undefined : 'no-price',
      })
    }
    return live
  } catch (err) {
    noteStoreResult(listing.store, false, {
      productId: listing.product_id,
      reason: err instanceof Error ? err.message : 'refresh',
    })
    markChecked(listing.id)
    return null
  }
}

export async function refreshProduct(productId, { force = false, quick = false } = {}) {
  const key = `p:${productId}`
  if (!force && recently(key, 2 * 60 * 1000)) return assembleProduct(productId)
  let listings = listingsFor(productId)
  if (quick) listings = listings.filter(listingCanLivePrice).slice(0, 3)
  await Promise.all(listings.map((listing) => refreshListing(listing)))
  touch(key)
  return assembleProduct(productId)
}

export async function refreshCatalog(limit = 12) {
  const rows = listCatalog('all').slice(0, limit)
  for (const row of rows) {
    try {
      await refreshProduct(row.id)
    } catch (err) {
      console.error('refresh', row.id, err)
    }
    await sleep(400)
  }
  console.log('catalog refresh done', rows.length)
}

function findGameProductId(title) {
  const q = String(title || '').toLowerCase()
  if (!q) return null
  const rows = listCatalog('steam')
  const exact = rows.find((r) => String(r.title).toLowerCase() === q)
  if (exact) return exact.id
  const loose = rows.find((r) => {
    const t = String(r.title).toLowerCase()
    return t.includes(q) || q.includes(t)
  })
  return loose?.id ?? null
}

function ensureGameStorefronts(productId, title) {
  const have = new Set(listingsFor(productId).map((l) => l.store))
  for (const sf of gameStorefronts(title)) {
    if (have.has(sf.store)) continue
    upsertListing({
      id: listingId(productId, sf.store),
      productId,
      store: sf.store,
      url: sf.url,
    })
  }
}

function slugId(title) {
  return String(title)
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)
}

export async function liveSearchExtras(query, category) {
  const q = query.trim()
  if (q.length < 2) return []
  const wantGames =
    category === 'steam' ||
    (category === 'all' &&
      /\b(steam|epic|gog|gioco|giochi|game|games|xbox|playstation|ps5|ps4|prevendita|preordine|preorder|gta|hades|stardew|balatro|witcher|portal)\b/i.test(
        q,
      ))
  const wantIos =
    category === 'ios' || (category === 'all' && /\b(ios|iphone|ipad|app store)\b/i.test(q))
  const amazonish =
    category === 'nas' ||
    category === 'pc' ||
    category === 'software' ||
    /\b(nas|ugreen|synology|qnap|hdd|ssd|wd|nasync|dxp|cpu|gpu|ryzen|rtx|ram|case)\b/i.test(q) ||
    category === 'all'

  const found = []

  if (wantGames) {
    await Promise.all([
    (async () => {
    try {
      const gogHits = await gogSearch(q)
      for (const hit of gogHits.slice(0, 3)) {
        const id = `gog-${hit.externalId || hit.title.toLowerCase().replace(/\s+/g, '-')}`
        upsertProduct({
          id,
          title: hit.title,
          subtitle: 'Prezzo dal negozio GOG (live).',
          category: 'steam',
          tags: ['gog', 'gioco', ...q.toLowerCase().split(/\s+/)],
          imageTone: '#4c1d95',
          source: 'gog',
        })
        const lid = listingId(id, 'GOG')
        upsertListing({
          id: lid,
          productId: id,
          store: 'GOG',
          url: hit.url,
          externalId: hit.externalId,
          lastPrice: hit.price,
          listPrice: hit.list,
          available: 1,
          lastChecked: new Date().toISOString(),
        })
        recordPrice(lid, hit.price, 1)
        ensureGameStorefronts(id, hit.title)
        const dto = assembleProduct(id)
        if (dto) found.push(dto)
      }
    } catch (err) {
      noteStoreResult('GOG', false, {
        reason: err instanceof Error ? err.message : 'search',
      })
    }
    })(),
    (async () => {
    try {
      const hits = await steamSearch(q)
      const qTokens = q
        .toLowerCase()
        .split(/\s+/)
        .filter(
          (t) =>
            t.length > 1 &&
            !/^(prevendita|preordine|preorder|playstation|xbox|steam|epic|gog)$/.test(t),
        )
      for (const hit of hits) {
        if (hit.price == null && hit.price !== 0) continue
        const title = String(hit.title || '').toLowerCase()
        if (qTokens.length && !qTokens.every((t) => title.includes(t))) continue
        const id = productIdByExternal('Steam', hit.appId) || `steam-${hit.appId}`
        upsertProduct({
          id,
          title: hit.title,
          subtitle: 'Prezzo dal negozio Steam (live).',
          category: 'steam',
          tags: ['steam', 'gioco', ...q.toLowerCase().split(/\s+/)],
          imageTone: '#1b2838',
          source: 'steam',
        })
        const lid = listingId(id, 'Steam')
        upsertListing({
          id: lid,
          productId: id,
          store: 'Steam',
          url: hit.url,
          externalId: hit.appId,
          lastPrice: hit.price,
          listPrice: hit.list,
          available: 1,
          lastChecked: new Date().toISOString(),
        })
        if (hit.price != null) recordPrice(lid, hit.price, 1)
        ensureGameStorefronts(id, hit.title)
        const dto = assembleProduct(id)
        if (dto) found.push(dto)
      }
    } catch (err) {
      noteStoreResult('Steam', false, {
        reason: err instanceof Error ? err.message : 'search',
      })
    }
    })(),
    (async () => {
    try {
      const xboxHits = await xboxSearch(q)
      for (const hit of xboxHits.slice(0, 3)) {
        const id =
          (hit.externalId && productIdByExternal('Xbox', hit.externalId)) ||
          findGameProductId(hit.title) ||
          `xbox-${hit.externalId || slugId(hit.title)}`
        if (!getProductRow(id)) {
          upsertProduct({
            id,
            title: hit.title,
            subtitle: hit.preorder
              ? 'Prevendita. Confronto Xbox, PlayStation Store e i negozi PC.'
              : 'Prezzo dal Microsoft Store / Xbox (live).',
            category: 'steam',
            tags: [
              'xbox',
              'gioco',
              ...(hit.preorder ? ['prevendita'] : []),
              ...q.toLowerCase().split(/\s+/),
            ],
            imageTone: '#107c10',
            source: 'xbox',
          })
        }
        const lid = listingId(id, 'Xbox')
        upsertListing({
          id: lid,
          productId: id,
          store: 'Xbox',
          url: hit.url,
          externalId: hit.externalId,
          lastPrice: hit.price,
          listPrice: hit.list,
          available: 1,
          lastChecked: new Date().toISOString(),
        })
        if (hit.price != null) recordPrice(lid, hit.price, 1)
        ensureGameStorefronts(id, hit.title)
        const dto = assembleProduct(id)
        if (dto) {
          const idx = found.findIndex((d) => d.id === id)
          if (idx >= 0) found[idx] = dto
          else found.push(dto)
        }
      }
    } catch (err) {
      noteStoreResult('Xbox', false, {
        reason: err instanceof Error ? err.message : 'search',
      })
    }
    })(),
    ])
  }

  if (wantIos) {
    try {
      let hits = await itunesSearch(q, { gamesOnly: true })
      if (!hits.length) hits = await itunesSearch(q, { gamesOnly: false })
      for (const hit of hits.slice(0, 4)) {
        const id =
          productIdByExternal('App Store', hit.externalId) ||
          `ios-${hit.externalId || slugId(hit.title)}`
        if (!getProductRow(id)) {
          upsertProduct({
            id,
            title: hit.title,
            subtitle:
              hit.genre === 'Games'
                ? 'Gioco sull’App Store. Prezzo live da iTunes.'
                : 'Prezzo live dall’App Store.',
            category: 'ios',
            tags: ['ios', ...(hit.genre === 'Games' ? ['gioco'] : []), ...q.toLowerCase().split(/\s+/)],
            imageTone: '#0a84ff',
            source: 'itunes',
          })
        }
        const lid = listingId(id, 'App Store')
        upsertListing({
          id: lid,
          productId: id,
          store: 'App Store',
          url: hit.url,
          externalId: hit.externalId,
          lastPrice: hit.price,
          available: 1,
          lastChecked: new Date().toISOString(),
        })
        recordPrice(lid, hit.price, 1)
        const dto = assembleProduct(id)
        if (dto) {
          const idx = found.findIndex((d) => d.id === id)
          if (idx >= 0) found[idx] = dto
          else found.push(dto)
        }
      }
    } catch (err) {
      noteStoreResult('App Store', false, {
        reason: err instanceof Error ? err.message : 'search',
      })
    }
  }

  if ((amazonish && !wantGames) || category === 'nas' || category === 'pc') {
    const key = `amz:${q.toLowerCase()}`
    if (!recently(key, 10 * 60 * 1000)) {
      try {
        const hits = await amazonSearch(q)
        touch(key)
        for (const hit of hits) {
          const id = `amz-${hit.asin}`
          if (getProductRow(id)) {
            const dto = assembleProduct(id)
            if (dto) found.push(dto)
            continue
          }
          upsertProduct({
            id,
            title: hit.title,
            subtitle: 'Trovato su Amazon.it. Se il buybox manca, il prezzo resta non disponibile.',
            category: category === 'all' ? 'nas' : category,
            tags: ['amazon', ...q.toLowerCase().split(/\s+/)],
            imageTone: '#1d3557',
            source: 'amazon',
          })
          const lid = listingId(id, 'Amazon')
          upsertListing({
            id: lid,
            productId: id,
            store: 'Amazon',
            url: hit.url,
            externalId: hit.asin,
            lastPrice: hit.price,
            available: 1,
            lastChecked: new Date().toISOString(),
          })
          recordPrice(lid, hit.price, 1)
          const dto = assembleProduct(id)
          if (dto) found.push(dto)
        }
      } catch (err) {
        noteStoreResult('Amazon', false, {
          reason: err instanceof Error ? err.message : 'search',
        })
      }
    }
  }

  return found
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

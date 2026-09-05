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
import { assembleProduct } from './product.mjs'

const lastLive = new Map()

function recently(key, ms) {
  const t = lastLive.get(key)
  return t != null && Date.now() - t < ms
}

function touch(key) {
  lastLive.set(key, Date.now())
}

export async function refreshListing(listing) {
  const store = String(listing.store || '').toLowerCase()
  try {
    if (store.includes('steam') && listing.external_id) {
      const live = await steamAppPrice(listing.external_id)
      if (live && live.price != null) {
        recordPrice(listing.id, live.price, live.available ?? 1)
        if (live.list != null) {
          upsertListing({
            id: listing.id,
            productId: listing.product_id,
            store: listing.store,
            url: live.url || listing.url,
            externalId: listing.external_id,
            lastPrice: live.price,
            listPrice: live.list,
            available: live.available ?? 1,
            lastChecked: new Date().toISOString(),
          })
        }
        return live
      }
      markChecked(listing.id, null)
      return null
    }

    if (store.includes('amazon')) {
      const live = await amazonProduct(listing.url || listing.external_id || '')
      if (live?.price != null) {
        recordPrice(listing.id, live.price, live.available ?? 1)
        return live
      }
      markChecked(listing.id, live?.available ?? null)
      return null
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
  } catch {
    markChecked(listing.id)
    return null
  }
}

export async function refreshProduct(productId, { force = false } = {}) {
  const key = `p:${productId}`
  if (!force && recently(key, 2 * 60 * 1000)) return assembleProduct(productId)
  const listings = listingsFor(productId)
  for (const listing of listings) {
    await refreshListing(listing)
  }
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

export async function liveSearchExtras(query, category) {
  const q = query.trim()
  if (q.length < 2) return []
  const steamish =
    category === 'steam' ||
    /\b(steam|gioco|giochi|game|hades|stardew|balatro|witcher|portal)\b/i.test(q)
  const amazonish =
    category === 'nas' ||
    category === 'pc' ||
    category === 'software' ||
    /\b(nas|ugreen|synology|qnap|hdd|ssd|wd|nasync|dxp|cpu|gpu|ryzen|rtx|ram|case)\b/i.test(q) ||
    category === 'all'

  const found = []

  if (steamish || category === 'all') {
    try {
      const hits = await steamSearch(q)
      const qTokens = q.toLowerCase().split(/\s+/).filter((t) => t.length > 2)
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
        const dto = assembleProduct(id)
        if (dto) found.push(dto)
      }
    } catch {
      /* Steam down: ignora */
    }
  }

  if ((amazonish && !steamish) || category === 'nas' || category === 'pc') {
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
      } catch {
        /* Amazon down: ignora */
      }
    }
  }

  return found
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

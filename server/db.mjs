import { mkdirSync, unlinkSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { SEED_PRODUCTS } from './catalog.mjs'

const sqliteMod = await import('node:sqlite').catch((err) => {
  console.error('node:sqlite assente', err.message)
  return null
})
const DatabaseSync = sqliteMod?.DatabaseSync

function canWrite(dir) {
  mkdirSync(dir, { recursive: true })
  const probe = join(dir, '.write-test')
  writeFileSync(probe, 'ok')
  unlinkSync(probe)
  return true
}

function openDatabase() {
  const candidates = [
    process.env.DATA_DIR,
    join(process.cwd(), 'data'),
    '/app/data',
    '/data',
    '/tmp/cercatrova',
  ].filter(Boolean)

  for (const dir of candidates) {
    try {
      canWrite(dir)
      const path = join(dir, 'cercatrova.sqlite')
      if (!DatabaseSync) throw new Error('modulo node:sqlite assente')
      const database = new DatabaseSync(path)
      // DELETE, non WAL: i bind-mount NAS/CIFS fanno crashare WAL all’avvio.
      database.exec('PRAGMA journal_mode = DELETE')
      database.exec('PRAGMA foreign_keys = ON')
      console.log(`sqlite ok ${path}`)
      return database
    } catch (err) {
      console.error(`sqlite no ${dir}: ${err.message}`)
    }
  }

  if (DatabaseSync) {
    console.error('sqlite fallback :memory: (i watch non sopravvivono al restart)')
    const memory = new DatabaseSync(':memory:')
    memory.exec('PRAGMA foreign_keys = ON')
    return memory
  }
  throw new Error('SQLite non disponibile su questo Node')
}

export const db = openDatabase()

db.exec(`
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL,
  tags TEXT NOT NULL DEFAULT '[]',
  image_tone TEXT NOT NULL DEFAULT '#1d3557',
  source TEXT NOT NULL DEFAULT 'catalog',
  free INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS listings (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  store TEXT NOT NULL,
  url TEXT NOT NULL,
  external_id TEXT,
  available INTEGER,
  last_price REAL,
  list_price REAL,
  last_checked TEXT,
  FOREIGN KEY(product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS prices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  listing_id TEXT NOT NULL,
  price REAL NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  available INTEGER,
  collected_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS devices (
  id TEXT PRIMARY KEY,
  plan TEXT NOT NULL DEFAULT 'free',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS watches (
  id TEXT PRIMARY KEY,
  device_id TEXT NOT NULL,
  product_id TEXT,
  title TEXT NOT NULL,
  query TEXT,
  category TEXT,
  target_price REAL NOT NULL,
  telegram_user TEXT,
  notify TEXT NOT NULL DEFAULT 'telegram',
  notify_exceptional INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS telegram_chats (
  device_id TEXT PRIMARY KEY,
  chat_id TEXT NOT NULL,
  username TEXT,
  linked_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS pending_links (
  token TEXT PRIMARY KEY,
  device_id TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS alerts_sent (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  watch_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  price REAL,
  sent_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS prices_listing_time ON prices(listing_id, collected_at);
CREATE INDEX IF NOT EXISTS watches_device ON watches(device_id);
CREATE INDEX IF NOT EXISTS listings_product ON listings(product_id);
`)

const insertProduct = db.prepare(`
INSERT INTO products (id, title, subtitle, category, tags, image_tone, source, free, created_at)
VALUES (?, ?, ?, ?, ?, ?, 'catalog', ?, ?)
ON CONFLICT(id) DO UPDATE SET
  title = excluded.title,
  subtitle = excluded.subtitle,
  category = excluded.category,
  tags = excluded.tags,
  image_tone = excluded.image_tone
`)
const insertListing = db.prepare(`
INSERT OR IGNORE INTO listings (id, product_id, store, url, external_id)
VALUES (?, ?, ?, ?, ?)
`)

const now = new Date().toISOString()
for (const p of SEED_PRODUCTS) {
  insertProduct.run(
    p.id,
    p.title,
    p.subtitle,
    p.category,
    JSON.stringify(p.tags),
    p.imageTone,
    p.free ? 1 : 0,
    now,
  )
  for (const l of p.listings) {
    insertListing.run(`${p.id}::${l.store}`, p.id, l.store, l.url, l.externalId ?? null)
  }
}

export function listingId(productId, store) {
  return `${productId}::${store}`
}

export function upsertProduct(p) {
  db.prepare(`
    INSERT INTO products (id, title, subtitle, category, tags, image_tone, source, free, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      subtitle = excluded.subtitle,
      category = excluded.category,
      tags = excluded.tags
  `).run(
    p.id,
    p.title,
    p.subtitle ?? '',
    p.category,
    JSON.stringify(p.tags ?? []),
    p.imageTone ?? '#1d3557',
    p.source ?? 'live',
    p.free ? 1 : 0,
    p.createdAt ?? new Date().toISOString(),
  )
}

export function upsertListing(l) {
  db.prepare(`
    INSERT INTO listings (id, product_id, store, url, external_id, available, last_price, list_price, last_checked)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      url = excluded.url,
      external_id = COALESCE(excluded.external_id, listings.external_id),
      available = COALESCE(excluded.available, listings.available),
      last_price = COALESCE(excluded.last_price, listings.last_price),
      list_price = COALESCE(excluded.list_price, listings.list_price),
      last_checked = COALESCE(excluded.last_checked, listings.last_checked)
  `).run(
    l.id,
    l.productId,
    l.store,
    l.url,
    l.externalId ?? null,
    l.available ?? null,
    l.lastPrice ?? null,
    l.listPrice ?? null,
    l.lastChecked ?? null,
  )
}

export function recordPrice(listingIdValue, price, available = 1, currency = 'EUR') {
  const collectedAt = new Date().toISOString()
  db.prepare(
    `UPDATE listings SET last_price = ?, list_price = COALESCE(list_price, ?), available = ?, last_checked = ? WHERE id = ?`,
  ).run(price, price, available, collectedAt, listingIdValue)
  const last = db
    .prepare(
      `SELECT price FROM prices WHERE listing_id = ? ORDER BY collected_at DESC LIMIT 1`,
    )
    .get(listingIdValue)
  if (!last || Number(last.price) !== Number(price)) {
    db.prepare(
      `INSERT INTO prices (listing_id, price, currency, available, collected_at) VALUES (?, ?, ?, ?, ?)`,
    ).run(listingIdValue, price, currency, available, collectedAt)
  } else {
    db.prepare(
      `UPDATE prices SET collected_at = ?, available = ? WHERE listing_id = ? AND price = ? AND id = (
        SELECT id FROM prices WHERE listing_id = ? ORDER BY collected_at DESC LIMIT 1
      )`,
    ).run(collectedAt, available, listingIdValue, price, listingIdValue)
  }
  return collectedAt
}

export function markChecked(listingIdValue, available = null) {
  db.prepare(`UPDATE listings SET last_checked = ?, available = COALESCE(?, available) WHERE id = ?`).run(
    new Date().toISOString(),
    available,
    listingIdValue,
  )
}

export function getProductRow(id) {
  return db.prepare(`SELECT * FROM products WHERE id = ?`).get(id)
}

export function resolveProductId(id) {
  const raw = decodeURIComponent(String(id || '')).trim()
  if (!raw) return null
  if (getProductRow(raw)) return raw
  const stripped = raw.replace(/^(xbox|steam|gog|ios|and|amz)-/i, '')
  const viaExt = productIdByExternal('', stripped) || productIdByExternal('', raw)
  if (viaExt) return viaExt
  if (stripped && stripped.length >= 8) {
    const urlRow = db
      .prepare(`SELECT product_id FROM listings WHERE url LIKE ? LIMIT 1`)
      .get(`%${stripped}%`)
    if (urlRow?.product_id) return urlRow.product_id
  }
  if (/gta|grand-theft-auto|9p3h4968|9nl3wwnzlzzn/i.test(raw) && getProductRow('game-gta6')) {
    return 'game-gta6'
  }
  const slug = raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  const rows = listCatalog('all')
  const hit = rows.find((r) => {
    const titleSlug = String(r.title)
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
    return r.id === slug || titleSlug === slug || titleSlug.includes(slug) && slug.length >= 8
  })
  return hit?.id ?? null
}

export function productIdByExternal(storeLike, externalId) {
  if (!externalId) return null
  const id = String(externalId)
  const row = db
    .prepare(
      `SELECT product_id FROM listings WHERE external_id = ? AND store LIKE ? LIMIT 1`,
    )
    .get(id, `%${storeLike}%`)
  if (row?.product_id) return row.product_id
  const any = db.prepare(`SELECT product_id FROM listings WHERE external_id = ? LIMIT 1`).get(id)
  return any?.product_id ?? null
}

export function listCatalog(category = 'all', { seededOnly = false } = {}) {
  const extra = seededOnly ? ` AND source = 'catalog'` : ''
  if (category && category !== 'all') {
    return db.prepare(`SELECT * FROM products WHERE category = ?${extra} ORDER BY title`).all(category)
  }
  return db.prepare(`SELECT * FROM products WHERE 1=1${extra} ORDER BY title`).all()
}

export function listingsFor(productId) {
  return db.prepare(`SELECT * FROM listings WHERE product_id = ?`).all(productId)
}

export function priceHistory(productId, days = 180) {
  const since = new Date(Date.now() - days * 86400000).toISOString()
  return db
    .prepare(
      `SELECT p.price, p.collected_at as collectedAt, l.store
       FROM prices p JOIN listings l ON l.id = p.listing_id
       WHERE l.product_id = ? AND p.collected_at >= ?
       ORDER BY p.collected_at ASC`,
    )
    .all(productId, since)
}

export function ensureDevice(id) {
  db.prepare(
    `INSERT OR IGNORE INTO devices (id, plan, created_at) VALUES (?, 'free', ?)`,
  ).run(id, new Date().toISOString())
  return db.prepare(`SELECT * FROM devices WHERE id = ?`).get(id)
}

export function setDevicePlan(id, plan) {
  ensureDevice(id)
  db.prepare(`UPDATE devices SET plan = ? WHERE id = ?`).run(plan, id)
}

export const FREE_WATCH_LIMIT = Number(process.env.FREE_WATCH_LIMIT || 3)
export const PLUS_WATCH_LIMIT = Number(process.env.PLUS_WATCH_LIMIT || 20)

export function watchLimit(device) {
  if (process.env.CERCATROVA_PLAN === 'plus') return PLUS_WATCH_LIMIT
  if (device?.plan === 'plus') return PLUS_WATCH_LIMIT
  return FREE_WATCH_LIMIT
}

export function listWatches(deviceId) {
  return db
    .prepare(`SELECT * FROM watches WHERE device_id = ? ORDER BY created_at DESC`)
    .all(deviceId)
}

export function allWatches() {
  return db.prepare(`SELECT * FROM watches`).all()
}

export function addWatchRow(row) {
  db.prepare(
    `INSERT INTO watches (id, device_id, product_id, title, query, category, target_price, telegram_user, notify, notify_exceptional, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    row.id,
    row.deviceId,
    row.productId ?? null,
    row.title,
    row.query ?? null,
    row.category ?? null,
    row.targetPrice,
    row.telegramUser ?? null,
    row.notify ?? 'telegram',
    row.notifyExceptional === false ? 0 : 1,
    row.createdAt ?? new Date().toISOString(),
  )
}

export function removeWatchRow(id, deviceId) {
  db.prepare(`DELETE FROM watches WHERE id = ? AND device_id = ?`).run(id, deviceId)
}

export function savePendingLink(token, deviceId) {
  db.prepare(`INSERT OR REPLACE INTO pending_links (token, device_id, created_at) VALUES (?, ?, ?)`).run(
    token,
    deviceId,
    new Date().toISOString(),
  )
}

export function consumePendingLink(token) {
  const row = db.prepare(`SELECT * FROM pending_links WHERE token = ?`).get(token)
  if (row) db.prepare(`DELETE FROM pending_links WHERE token = ?`).run(token)
  return row
}

export function linkTelegram(deviceId, chatId, username) {
  db.prepare(
    `INSERT OR REPLACE INTO telegram_chats (device_id, chat_id, username, linked_at) VALUES (?, ?, ?, ?)`,
  ).run(deviceId, String(chatId), username ?? null, new Date().toISOString())
}

export function telegramForDevice(deviceId) {
  return db.prepare(`SELECT * FROM telegram_chats WHERE device_id = ?`).get(deviceId)
}

export function telegramByChat(chatId) {
  return db.prepare(`SELECT * FROM telegram_chats WHERE chat_id = ?`).get(String(chatId))
}

export function recordAlert(watchId, kind, price) {
  db.prepare(`INSERT INTO alerts_sent (watch_id, kind, price, sent_at) VALUES (?, ?, ?, ?)`).run(
    watchId,
    kind,
    price ?? null,
    new Date().toISOString(),
  )
}

export function lastAlert(watchId, kind) {
  return db
    .prepare(
      `SELECT * FROM alerts_sent WHERE watch_id = ? AND kind = ? ORDER BY sent_at DESC LIMIT 1`,
    )
    .get(watchId, kind)
}

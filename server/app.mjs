import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import {
  addWatchRow,
  ensureDevice,
  FREE_WATCH_LIMIT,
  listWatches,
  PLUS_WATCH_LIMIT,
  removeWatchRow,
  resolveProductId,
  setDevicePlan,
  telegramForDevice,
  watchLimit,
} from './db.mjs'
import { refreshCatalog, refreshProduct } from './engine.mjs'
import { assembleProduct } from './product.mjs'
import { searchProducts } from './search.mjs'
import { refreshWatched } from './alerts.mjs'
import {
  botConfigured,
  createLinkToken,
  handleUpdate,
  startPolling,
  telegramStatus,
} from './telegram.mjs'

export const app = new Hono()
app.use('/api/*', cors())

function deviceId(c) {
  const id = c.req.header('x-device-id') || c.req.query('deviceId') || ''
  return id.trim().slice(0, 80)
}

function requireDevice(c) {
  const id = deviceId(c)
  if (id.length < 8) return null
  return ensureDevice(id)
}

function publicWatch(row) {
  if (!row) return null
  return {
    id: row.id,
    productId: row.product_id,
    title: row.title,
    query: row.query,
    category: row.category,
    targetPrice: row.target_price,
    telegram: row.telegram_user,
    notify: row.notify,
    createdAt: row.created_at,
  }
}

app.get('/api/health', (c) =>
  c.json({
    ok: true,
    ready: true,
    name: 'cercatrova',
    question: 'È questo il momento giusto per comprarlo?',
    telegram: botConfigured(),
    time: new Date().toISOString(),
  }),
)

app.get('/api/search', async (c) => {
  const query = c.req.query('q') || ''
  const category = c.req.query('category') || 'all'
  const mode = c.req.query('mode') || 'generico'
  const onlyFree = c.req.query('onlyFree') === '1'
  const maxRaw = c.req.query('maxPrice')
  const maxPrice = maxRaw && Number.isFinite(Number(maxRaw)) ? Number(maxRaw) : null
  const results = await searchProducts({ query, category, mode, onlyFree, maxPrice })
  return c.json({ results, count: results.length, live: true })
})

app.get('/api/products/:id', (c) => {
  const id = resolveProductId(c.req.param('id'))
  const product = id ? assembleProduct(id) : null
  if (!product) return c.json({ error: 'not_found' }, 404)
  return c.json({ product })
})

app.post('/api/products/:id/refresh', async (c) => {
  const id = resolveProductId(c.req.param('id')) || c.req.param('id')
  const product = await refreshProduct(id, { force: true })
  if (!product) return c.json({ error: 'not_found' }, 404)
  return c.json({ product })
})

app.get('/api/me', (c) => {
  const device = requireDevice(c)
  if (!device) return c.json({ error: 'device_required' }, 400)
  const watches = listWatches(device.id)
  const limit = watchLimit(device)
  const tg = telegramStatus(device.id)
  return c.json({
    deviceId: device.id,
    plan: limit >= PLUS_WATCH_LIMIT ? 'plus' : 'free',
    limit,
    used: watches.length,
    freeLimit: FREE_WATCH_LIMIT,
    plusLimit: PLUS_WATCH_LIMIT,
    plusPrice: '2,99 €/mese',
    telegram: tg,
  })
})

app.post('/api/plus', async (c) => {
  const device = requireDevice(c)
  if (!device) return c.json({ error: 'device_required' }, 400)
  const body = await c.req.json().catch(() => ({}))
  const key = String(body.key || '')
  const expected = process.env.PLUS_KEY || ''
  if (!expected || key !== expected) {
    return c.json({ ok: false, error: 'codice non valido' }, 403)
  }
  setDevicePlan(device.id, 'plus')
  return c.json({ ok: true, plan: 'plus', limit: PLUS_WATCH_LIMIT })
})

app.get('/api/watches', (c) => {
  const device = requireDevice(c)
  if (!device) return c.json({ error: 'device_required' }, 400)
  const rows = listWatches(device.id)
  return c.json({
    watches: rows.map(publicWatch),
    used: rows.length,
    limit: watchLimit(device),
  })
})

app.post('/api/watches', async (c) => {
  const device = requireDevice(c)
  if (!device) return c.json({ error: 'device_required' }, 400)
  const existing = listWatches(device.id)
  const limit = watchLimit(device)
  if (existing.length >= limit) {
    return c.json(
      {
        error: 'limit',
        message: `Piano ${limit >= PLUS_WATCH_LIMIT ? 'Plus' : 'gratis'}: massimo ${limit} monitoraggi. Cercatrova Plus è 2,99 €/mese per 20 alert.`,
        limit,
      },
      402,
    )
  }
  const body = await c.req.json().catch(() => ({}))
  const id = `w_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`
  addWatchRow({
    id,
    deviceId: device.id,
    productId: body.productId || null,
    title: String(body.title || body.query || 'Ricerca').slice(0, 160),
    query: body.query || null,
    category: body.category || null,
    targetPrice: Number(body.targetPrice) || 0,
    telegramUser: body.telegram || null,
    notify: body.notify || 'telegram',
    notifyExceptional: body.notifyExceptional !== false,
  })
  return c.json({ ok: true, watch: publicWatch(listWatches(device.id).find((w) => w.id === id)) })
})

app.delete('/api/watches/:id', (c) => {
  const device = requireDevice(c)
  if (!device) return c.json({ error: 'device_required' }, 400)
  removeWatchRow(c.req.param('id'), device.id)
  return c.json({ ok: true })
})

app.post('/api/telegram/link', (c) => {
  const device = requireDevice(c)
  if (!device) return c.json({ error: 'device_required' }, 400)
  const { token, url } = createLinkToken(device.id)
  return c.json({
    token,
    url,
    configured: botConfigured(),
    already: Boolean(telegramForDevice(device.id)),
  })
})

app.get('/api/telegram/status', (c) => {
  const device = requireDevice(c)
  if (!device) return c.json({ error: 'device_required' }, 400)
  return c.json(telegramStatus(device.id))
})

app.post('/api/telegram/webhook', async (c) => {
  const update = await c.req.json().catch(() => null)
  if (update) await handleUpdate(update)
  return c.json({ ok: true })
})

app.post('/api/collect', async (c) => {
  const secret = process.env.COLLECT_KEY
  if (secret && c.req.header('x-collect-key') !== secret) {
    return c.json({ error: 'forbidden' }, 403)
  }
  const result = await refreshWatched()
  return c.json({ ok: true, ...result })
})

const dist = join(process.cwd(), 'dist')
if (existsSync(dist)) {
  app.use('/*', serveStatic({ root: './dist' }))
  app.get('/*', serveStatic({ path: './dist/index.html' }))
}

export function startBackground() {
  startPolling()
  refreshCatalog(8).catch((err) => console.error('catalog refresh', err))
  const WATCH_MS = Number(process.env.WATCH_INTERVAL_MS || 30 * 60 * 1000)
  setInterval(() => {
    refreshWatched().catch((err) => console.error('watch refresh', err))
  }, WATCH_MS)
}

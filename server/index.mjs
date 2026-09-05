import { createServer } from 'node:http'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { extname, join } from 'node:path'

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.png': 'image/png',
}

let api = null
let bootError = null

function send(res, status, body, type = 'text/plain; charset=utf-8') {
  res.writeHead(status, { 'content-type': type })
  res.end(body)
}

function sendStatic(req, res) {
  const dist = join(process.cwd(), 'dist')
  let url = decodeURIComponent((req.url || '/').split('?')[0] || '/')
  if (url === '/') url = '/index.html'
  const wanted = join(dist, url)
  if (!wanted.startsWith(dist)) return send(res, 403, 'no')
  const file = existsSync(wanted) && statSync(wanted).isFile() ? wanted : join(dist, 'index.html')
  if (!existsSync(file)) {
    return send(res, 503, `Cercatrova in avvio. ${bootError || ''}`.trim())
  }
  send(res, 200, readFileSync(file), MIME[extname(file)] || 'application/octet-stream')
}

const server = createServer((req, res) => {
  try {
    if ((req.url || '').startsWith('/api/health')) {
      return send(
        res,
        200,
        JSON.stringify({
          ok: true,
          ready: Boolean(api),
          error: bootError,
          node: process.version,
          arch: process.arch,
        }),
        'application/json',
      )
    }
    if (api) {
      Promise.resolve(api(req, res)).catch((err) => {
        if (!res.headersSent) send(res, 500, String(err.message || err))
      })
      return
    }
    if ((req.url || '').startsWith('/api/')) {
      return send(
        res,
        503,
        JSON.stringify({ error: bootError || 'booting' }),
        'application/json',
      )
    }
    sendStatic(req, res)
  } catch (err) {
    if (!res.headersSent) send(res, 500, String(err.message || err))
  }
})

function listen(ports) {
  const port = ports[0]
  if (port == null) {
    console.error('nessuna porta libera')
    process.exit(1)
  }
  const onErr = (err) => {
    server.off('error', onErr)
    console.error(`porta ${port}: ${err.code || err.message}`)
    listen(ports.slice(1))
  }
  server.once('error', onErr)
  server.listen(port, '0.0.0.0', () => {
    server.off('error', onErr)
    console.log(`Cercatrova http://0.0.0.0:${port}`)
  })
}

console.log(`boot ${new Date().toISOString()} node=${process.version} arch=${process.arch}`)
listen(
  [...new Set([Number(process.env.PORT || 80), 80, 8080, 8787])].filter((p) => Number.isFinite(p) && p > 0),
)

process.on('uncaughtException', (err) => console.error('uncaught', err))
process.on('unhandledRejection', (err) => console.error('unhandled', err))

import('./app.mjs')
  .then(async (mod) => {
    const { getRequestListener } = await import('@hono/node-server')
    api = getRequestListener(mod.app.fetch)
    mod.startBackground?.()
    console.log('app ready')
  })
  .catch((err) => {
    bootError = err?.stack || err?.message || String(err)
    console.error('app load failed', err)
  })

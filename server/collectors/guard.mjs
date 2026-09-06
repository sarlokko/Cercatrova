const AMAZON_MIN_GAP_MS = Number(process.env.AMAZON_GAP_MS || 1500)
const AMAZON_BLOCKED_MS = Number(process.env.AMAZON_BLOCKED_MS || 15 * 60 * 1000)
const FAIL_ALERT_AFTER = Number(process.env.STORE_FAIL_ALERT || 5)

let amazonNextAt = 0
let amazonBlockedUntil = 0
let amazonTail = Promise.resolve()

const health = new Map()

export function sleep(ms) {
  return new Promise((r) => setTimeout(r, Math.max(0, ms)))
}

export function amazonPaused() {
  return Date.now() < amazonBlockedUntil
}

export function markAmazonBlocked(reason = 'captcha') {
  amazonBlockedUntil = Date.now() + AMAZON_BLOCKED_MS
  noteStoreResult('Amazon', false, { blocked: true, reason })
  console.warn(
    `amazon: blocco (${reason}), pausa ${Math.round(AMAZON_BLOCKED_MS / 1000)}s prima del prossimo giro`,
  )
}

/** Serializza le chiamate Amazon e rispetta il cooldown dopo un captcha. */
export function paceAmazon() {
  const job = amazonTail.then(async () => {
    if (amazonPaused()) return false
    const wait = amazonNextAt - Date.now()
    if (wait > 0) await sleep(wait)
    amazonNextAt = Date.now() + AMAZON_MIN_GAP_MS
    return true
  })
  amazonTail = job.then(
    () => undefined,
    () => undefined,
  )
  return job
}

export function noteStoreResult(store, ok, extra = {}) {
  const key = String(store || 'unknown').trim() || 'unknown'
  const prev = health.get(key) || { fails: 0, lastOk: true, alerted: false }
  if (ok) {
    if (!prev.lastOk && prev.fails > 0) {
      console.log(`collector ${key}: di nuovo ok dopo ${prev.fails} fallimenti`)
    }
    health.set(key, { fails: 0, lastOk: true, alerted: false })
    return
  }
  const fails = prev.fails + 1
  const firstAfterOk = prev.lastOk
  const crossed = !prev.alerted && fails >= FAIL_ALERT_AFTER
  if (firstAfterOk) {
    const where = extra.productId ? ` prodotto ${extra.productId}` : ''
    const why = extra.reason ? ` (${extra.reason})` : ''
    console.warn(`collector ${key}: primo fallimento dopo un successo${where}${why}`)
  }
  if (crossed) {
    console.error(
      `collector ${key}: ${fails} fallimenti consecutivi. Possibile markup rotto, blocco o rete. Controlla i log sul NAS.`,
    )
  }
  health.set(key, { fails, lastOk: false, alerted: prev.alerted || crossed })
}

export function storeHealth() {
  const out = {}
  for (const [store, row] of health) {
    out[store] = { fails: row.fails, ok: row.lastOk }
  }
  if (amazonPaused()) {
    out.Amazon = {
      ...(out.Amazon || { fails: 0, ok: false }),
      pausedMs: Math.max(0, amazonBlockedUntil - Date.now()),
    }
  }
  return out
}

export function resetGuardForTests() {
  amazonNextAt = 0
  amazonBlockedUntil = 0
  amazonTail = Promise.resolve()
  health.clear()
}

export function looksBlocked(html, status) {
  if (status === 429 || status === 503) return true
  const text = String(html || '')
  if (text.length >= 20000) return false
  return /sorry.*automated|enter the characters|captcha|robot check/i.test(text)
}

import { allWatches, lastAlert, recordAlert, telegramForDevice } from './db.mjs'
import { assembleProduct } from './product.mjs'
import { refreshProduct } from './engine.mjs'
import { sendTelegram } from './telegram.mjs'

function fmt(n) {
  return `€${Number(n).toFixed(2).replace('.', ',')}`
}

function recentlySent(watchId, kind, hours = 20) {
  const prev = lastAlert(watchId, kind)
  if (!prev) return false
  return Date.now() - new Date(prev.sent_at).getTime() < hours * 3600 * 1000
}

export function formatAlert(kind, product, watch) {
  if (kind === 'target') {
    return [
      'È il momento di comprarlo',
      '',
      product.title,
      `Prezzo attuale: ${product.priceUnknown ? 'non disponibile' : fmt(product.currentPrice)}`,
      `Il tuo limite: ${fmt(watch.target_price)}`,
      product.verdict?.detail || '',
      '',
      product.merchants?.[0]?.url || '',
    ].join('\n')
  }
  return [
    `${product.verdict?.label || 'PREZZO ECCEZIONALE'}`,
    '',
    product.title,
    product.normalPrice && !product.priceUnknown
      ? `${fmt(product.normalPrice)} → ${fmt(product.currentPrice)}`
      : `Prezzo attuale: ${fmt(product.currentPrice)}`,
    product.verdict?.detail || '',
    '',
    'È questo il momento giusto per comprarlo?',
    product.merchants?.[0]?.url || '',
  ].join('\n')
}

export async function runAlerts() {
  const watches = allWatches()
  let sent = 0
  for (const watch of watches) {
    if (!watch.product_id) continue
    const product = assembleProduct(watch.product_id) || (await refreshProduct(watch.product_id))
    if (!product || product.priceUnknown) continue
    const tg = telegramForDevice(watch.device_id)
    if (!tg?.chat_id) continue

    const hitTarget = product.currentPrice <= Number(watch.target_price)
    if (hitTarget && !recentlySent(watch.id, 'target')) {
      const r = await sendTelegram(tg.chat_id, formatAlert('target', product, watch))
      if (r.ok) {
        recordAlert(watch.id, 'target', product.currentPrice)
        sent += 1
      }
    }

    const hot = product.verdict?.kind === 'eccezionale' || product.verdict?.kind === 'ottimo'
    if (watch.notify_exceptional && hot && !recentlySent(watch.id, 'hot')) {
      const r = await sendTelegram(tg.chat_id, formatAlert('hot', product, watch))
      if (r.ok) {
        recordAlert(watch.id, 'hot', product.currentPrice)
        sent += 1
      }
    }
  }
  return { checked: watches.length, sent }
}

export async function refreshWatched() {
  const ids = [...new Set(allWatches().map((w) => w.product_id).filter(Boolean))]
  for (const id of ids) {
    await refreshProduct(id, { force: true })
  }
  return runAlerts()
}

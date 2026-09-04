import {
  consumePendingLink,
  linkTelegram,
  savePendingLink,
  telegramByChat,
  telegramForDevice,
} from './db.mjs'

const TOKEN = () => process.env.TELEGRAM_BOT_TOKEN || ''
const BOT = process.env.TELEGRAM_BOT_NAME || 'CercatrovaBot'

export function botConfigured() {
  return TOKEN().length > 10
}

export function botStartUrl(token) {
  return `https://t.me/${BOT}?start=${encodeURIComponent(token)}`
}

export function createLinkToken(deviceId) {
  const token = `d_${deviceId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 24)}_${Math.random().toString(36).slice(2, 10)}`
  savePendingLink(token, deviceId)
  return { token, url: botStartUrl(token) }
}

export async function sendTelegram(chatId, text) {
  if (!botConfigured()) return { ok: false, reason: 'no-token' }
  const res = await fetch(`https://api.telegram.org/bot${TOKEN()}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      disable_web_page_preview: true,
    }),
  })
  const json = await res.json().catch(() => ({}))
  return { ok: Boolean(json.ok), json }
}

export async function handleUpdate(update) {
  const msg = update?.message
  if (!msg?.text || !msg.chat) return
  const chatId = msg.chat.id
  const text = String(msg.text)
  if (text.startsWith('/start')) {
    const payload = text.replace('/start', '').trim()
    if (payload) {
      const pending = consumePendingLink(payload)
      if (pending) {
        linkTelegram(pending.device_id, chatId, msg.from?.username ? `@${msg.from.username}` : null)
        await sendTelegram(
          chatId,
          'Collegato. Cercatrova ti scrive qui quando conviene comprare, non a ogni sconto random.',
        )
        return
      }
    }
    const existing = telegramByChat(chatId)
    await sendTelegram(
      chatId,
      existing
        ? 'Sei già collegato. Imposta un monitoraggio dal sito.'
        : 'Apri Cercatrova → Collega bot, così associo questa chat.',
    )
    return
  }
  if (text.startsWith('/lista')) {
    await sendTelegram(chatId, 'I monitoraggi si gestiscono dal sito, pagina Cerca.')
  }
}

let offset = 0
let polling = false

export async function pollOnce() {
  if (!botConfigured()) return
  const res = await fetch(
    `https://api.telegram.org/bot${TOKEN()}/getUpdates?timeout=20&offset=${offset}`,
  )
  const json = await res.json().catch(() => ({}))
  if (!json.ok || !Array.isArray(json.result)) return
  for (const update of json.result) {
    offset = update.update_id + 1
    await handleUpdate(update)
  }
}

export function startPolling() {
  if (!botConfigured() || polling) return
  polling = true
  const loop = async () => {
    while (polling) {
      try {
        await pollOnce()
      } catch {
        await new Promise((r) => setTimeout(r, 4000))
      }
    }
  }
  loop()
}

export function telegramStatus(deviceId) {
  const row = telegramForDevice(deviceId)
  return {
    configured: botConfigured(),
    linked: Boolean(row),
    username: row?.username || null,
    chatId: row ? 'linked' : null,
  }
}

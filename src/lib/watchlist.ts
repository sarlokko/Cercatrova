const KEY = 'cercatrova.watches.v1'
const TELEGRAM_KEY = 'cercatrova.telegram.v1'

export type NotifyChannel = 'telegram' | 'email' | 'none'

export type WatchItem = {
  id: string
  title: string
  targetPrice: number
  /** @deprecated use telegram / email fields */
  email?: string
  telegram?: string
  notify: NotifyChannel
  mode?: 'generico' | 'specifico'
  category?: string
  query?: string
  createdAt: string
  note?: string
}

export type TelegramPrefs = {
  username: string
  linkedAt?: string
}

function read(): WatchItem[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as WatchItem[]
    if (!Array.isArray(parsed)) return []
    return parsed.map((w) => ({
      ...w,
      notify:
        w.notify ??
        (w.telegram ? 'telegram' : w.email ? 'email' : 'none'),
    }))
  } catch {
    return []
  }
}

function write(items: WatchItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items))
}

export function listWatches() {
  return read()
}

export function addWatch(item: WatchItem) {
  const next = [item, ...read()]
  write(next)
  return next
}

export function removeWatch(id: string, createdAt: string) {
  const next = read().filter((w) => !(w.id === id && w.createdAt === createdAt))
  write(next)
  return next
}

export function getTelegramPrefs(): TelegramPrefs | null {
  try {
    const raw = localStorage.getItem(TELEGRAM_KEY)
    if (!raw) return null
    return JSON.parse(raw) as TelegramPrefs
  } catch {
    return null
  }
}

export function saveTelegramPrefs(prefs: TelegramPrefs) {
  localStorage.setItem(TELEGRAM_KEY, JSON.stringify(prefs))
}

/** Deep link demo verso un bot Telegram (da sostituire col bot reale). */
export function telegramBotStartUrl(payload?: string) {
  const start = payload ? `?start=${encodeURIComponent(payload)}` : ''
  return `https://t.me/CercatrovaBot${start}`
}

export function normalizeTelegramUser(input: string) {
  const t = input.trim().replace(/^@/, '')
  return t ? `@${t}` : ''
}

const KEY = 'cercatrova.watches.v1'

export type WatchItem = {
  id: string
  title: string
  targetPrice: number
  email?: string
  createdAt: string
  note?: string
}

function read(): WatchItem[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as WatchItem[]
    return Array.isArray(parsed) ? parsed : []
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

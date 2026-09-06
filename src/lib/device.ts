const KEY = 'cercatrova.device.v1'
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

let memoryId: string | null = null

export function isDeviceId(value: string | undefined | null): value is string {
  return typeof value === 'string' && UUID_RE.test(value.trim())
}

function readStore(storage: Storage | undefined): string | null {
  try {
    const value = storage?.getItem(KEY)
    return isDeviceId(value) ? value.trim() : null
  } catch {
    return null
  }
}

function writeStore(storage: Storage | undefined, id: string) {
  try {
    storage?.setItem(KEY, id)
  } catch {
    /* private mode: resta solo in memoria */
  }
}

/** UUID da crypto.randomUUID. Mai un fallback prevedibile tipo anon-local. */
export function getDeviceId(): string {
  if (memoryId && isDeviceId(memoryId)) return memoryId
  const local = typeof localStorage !== 'undefined' ? localStorage : undefined
  const session = typeof sessionStorage !== 'undefined' ? sessionStorage : undefined
  const existing = readStore(local) || readStore(session)
  if (existing) {
    memoryId = existing
    return existing
  }
  const id = crypto.randomUUID()
  writeStore(local, id)
  writeStore(session, id)
  memoryId = id
  return id
}

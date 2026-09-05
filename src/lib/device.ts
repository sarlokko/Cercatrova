const KEY = 'cercatrova.device.v1'

export function getDeviceId() {
  try {
    const existing = localStorage.getItem(KEY)
    if (existing && existing.length >= 8) return existing
    const id = crypto.randomUUID()
    localStorage.setItem(KEY, id)
    return id
  } catch {
    return 'anon-local'
  }
}

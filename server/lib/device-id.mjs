/** UUID v1–v8, come quelli di crypto.randomUUID(). */
export const DEVICE_ID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function isDeviceId(value) {
  return DEVICE_ID_RE.test(String(value || '').trim())
}

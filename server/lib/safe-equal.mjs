import { timingSafeEqual } from 'node:crypto'

/** Confronto a tempo costante. Lunghezze diverse restano false senza uscire subito. */
export function safeKeyEqual(received, expected) {
  const a = Buffer.from(String(received ?? ''), 'utf8')
  const b = Buffer.from(String(expected ?? ''), 'utf8')
  if (!b.length) return false
  const padded = Buffer.alloc(b.length)
  a.copy(padded, 0, 0, Math.min(a.length, b.length))
  const sameLen = a.length === b.length
  return timingSafeEqual(padded, b) && sameLen
}

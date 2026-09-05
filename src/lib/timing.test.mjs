import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

/**
 * Replica minima delle regole “conviene ora” vs “aspetta”.
 * Se cambi src/lib/timing.ts, aggiorna anche qui.
 */
const BUY_NOW = new Set(['eccezionale', 'ottimo', 'gratis'])

function isWorthBuyingNow(deal) {
  const kind = deal.verdict?.kind
  if (kind && BUY_NOW.has(kind)) return true
  if (deal.isFree) return true
  return false
}

describe('timing: conviene ora vs aspetta', () => {
  it('mostra i gratis e i prezzi eccezionali', () => {
    assert.equal(isWorthBuyingNow({ isFree: true, verdict: { kind: 'gratis' } }), true)
    assert.equal(isWorthBuyingNow({ isFree: false, verdict: { kind: 'eccezionale' } }), true)
    assert.equal(isWorthBuyingNow({ isFree: false, verdict: { kind: 'ottimo' } }), true)
  })

  it('tiene i listini e “abbastanza” nella lista aspetta', () => {
    assert.equal(isWorthBuyingNow({ isFree: false, verdict: { kind: 'normale' } }), false)
    assert.equal(isWorthBuyingNow({ isFree: false, verdict: { kind: 'abbastanza' } }), false)
    assert.equal(isWorthBuyingNow({ isFree: false, verdict: { kind: 'sconosciuto' } }), false)
    assert.equal(isWorthBuyingNow({ isFree: false, verdict: { kind: 'pochi-dati' } }), false)
  })
})

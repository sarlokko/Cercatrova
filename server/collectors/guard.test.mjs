import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  amazonPaused,
  looksBlocked,
  markAmazonBlocked,
  noteStoreResult,
  paceAmazon,
  resetGuardForTests,
  storeHealth,
} from './guard.mjs'

describe('guard Amazon e salute collector', () => {
  it('pausa le chiamate dopo un captcha', async () => {
    resetGuardForTests()
    markAmazonBlocked('captcha')
    assert.equal(amazonPaused(), true)
    assert.equal(await paceAmazon(), false)
    const health = storeHealth()
    assert.ok(health.Amazon)
    assert.equal(health.Amazon.ok, false)
    assert.ok(health.Amazon.pausedMs > 0)
  })

  it('conta i fallimenti consecutivi e si resetta al successo', () => {
    resetGuardForTests()
    noteStoreResult('Steam', true)
    noteStoreResult('Steam', false, { productId: 'game-1', reason: 'timeout' })
    noteStoreResult('Steam', false, { productId: 'game-2' })
    assert.equal(storeHealth().Steam.fails, 2)
    assert.equal(storeHealth().Steam.ok, false)
    noteStoreResult('Steam', true)
    assert.equal(storeHealth().Steam.fails, 0)
    assert.equal(storeHealth().Steam.ok, true)
  })

  it('riconosce html di blocco corto, non le pagine prodotto lunghe', () => {
    assert.equal(looksBlocked('Enter the characters you see', 200), true)
    assert.equal(looksBlocked('ok', 429), true)
    assert.equal(looksBlocked(`<html>${'x'.repeat(25000)} captcha</html>`, 200), false)
  })
})

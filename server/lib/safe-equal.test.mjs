import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { safeKeyEqual } from './safe-equal.mjs'

describe('safeKeyEqual', () => {
  it('accetta solo la chiave intera', () => {
    assert.equal(safeKeyEqual('plus-segreto', 'plus-segreto'), true)
    assert.equal(safeKeyEqual('plus-segreto', 'plus-segretoX'), false)
    assert.equal(safeKeyEqual('plus', 'plus-segreto'), false)
    assert.equal(safeKeyEqual('plus-segreto', ''), false)
    assert.equal(safeKeyEqual('', 'plus-segreto'), false)
  })
})

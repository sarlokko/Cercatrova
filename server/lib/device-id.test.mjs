import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { isDeviceId } from './device-id.mjs'

describe('isDeviceId', () => {
  it('accetta solo UUID, non id corti o anon-local', () => {
    assert.equal(isDeviceId('550e8400-e29b-41d4-a716-446655440000'), true)
    assert.equal(isDeviceId('anon-local'), false)
    assert.equal(isDeviceId('12345678'), false)
    assert.equal(isDeviceId('device-abc'), false)
    assert.equal(isDeviceId(''), false)
  })
})

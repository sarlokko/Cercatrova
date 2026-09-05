import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { isSearchUrl, titleMatches } from './match.mjs'

describe('titleMatches', () => {
  it('accetta il modello giusto', () => {
    assert.equal(titleMatches('Ryzen 7 7800X3D', 'Processore AMD Ryzen 7 7800X3D 8 core'), true)
  })
  it('rifiuta un cavo a caso', () => {
    assert.equal(titleMatches('Ryzen 7 7800X3D', 'Cavo HDMI 2 metri'), false)
  })
})

describe('isSearchUrl', () => {
  it('riconosce le ricerche Amazon e i comparatori', () => {
    assert.equal(isSearchUrl('https://www.amazon.it/s?k=7800X3D'), true)
    assert.equal(isSearchUrl('https://www.amazon.it/dp/B0BTZB7F88'), false)
    assert.equal(isSearchUrl('https://www.ldlc.com/it-it/recherche/?q=7800'), true)
  })
})

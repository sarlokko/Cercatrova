import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { parseAmazonProduct } from './amazon.mjs'

describe('parseAmazonProduct', () => {
  it('legge olpMessage e non usa i caroselli', () => {
    const html = `
      <span id="productTitle">UGREEN NASync DXP2800</span>
      <span class="a-offscreen">12,00€</span>
      {"displayData":{"olpMessage":"2 opzioni da 369,99 €"}}
      attualmente non disponibile
    `
    const r = parseAmazonProduct(html)
    assert.equal(r.price, 369.99)
    assert.equal(r.available, 0)
    assert.match(r.title, /UGREEN/)
  })

  it('legge og:price', () => {
    const html = `<meta property="og:price:amount" content="249,00"><span id="productTitle">SSD</span>`
    assert.equal(parseAmazonProduct(html).price, 249)
  })

  it('senza segnale affidabile torna null, non il primo a-offscreen', () => {
    const html = `<html>${'x'.repeat(600)}<span class="a-offscreen">12,00€</span></html>`
    assert.equal(parseAmazonProduct(html).price, null)
  })
})

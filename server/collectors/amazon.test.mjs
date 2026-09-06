import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { parseAmazonProduct, parseAmazonSearch } from './amazon.mjs'

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

  it('legge titolo e prezzo dalle schede di ricerca Amazon', () => {
    const html = `
      <div data-asin="B0BTZB7F88" data-component-type="s-search-result">
        <h2 class="a-size-mini"><a><span>Processore AMD Ryzen 7 7800X3D 8 core</span></a></h2>
        ${'x'.repeat(2000)}
        <span class="a-price" data-a-size="xl"><span class="a-offscreen">400,26 €</span>
        <span class="a-price-whole">400</span><span class="a-price-fraction">26</span></span>
      </div>
    `
    const hits = parseAmazonSearch(html, 'Ryzen 7 7800X3D')
    assert.equal(hits.length, 1)
    assert.equal(hits[0].asin, 'B0BTZB7F88')
    assert.equal(hits[0].price, 400.26)
    assert.match(hits[0].title, /7800X3D/)
  })

  it('scarta le schede che non c’entrano con la query', () => {
    const html = `
      <div data-asin="B0AAAAAAAA">
        <h2><span>Cavo HDMI 2 metri nero</span></h2>
        <span class="a-offscreen">9,99 €</span>
      </div>
    `
    assert.equal(parseAmazonSearch(html, 'Ryzen 7 7800X3D').length, 0)
  })

  it('senza segnale affidabile torna null, non il primo a-offscreen', () => {
    const html = `<html>${'x'.repeat(600)}<span class="a-offscreen">12,00€</span></html>`
    assert.equal(parseAmazonProduct(html).price, null)
  })

  it('segna blocked: true sul captcha, senza inventare un prezzo', () => {
    const html = `<html><title>Amazon</title><p>Enter the characters you see below</p>${'x'.repeat(80)}</html>`
    const r = parseAmazonProduct(html)
    assert.equal(r.blocked, true)
    assert.equal(r.price, null)
  })

  it('la ricerca captcha non produce schede', () => {
    const html = `<html><p>Enter the characters you see below</p>${'x'.repeat(100)}</html>`
    assert.equal(parseAmazonSearch(html, 'Ryzen').length, 0)
  })
})

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { browseKind, expandMarketQueries, isBrowseQuery, titleHasSpecific } from './query-kind.mjs'
import { offerScore } from '../search.mjs'
import { parseSteamFeatured } from '../collectors/steam.mjs'

describe('isBrowseQuery', () => {
  it('riconosce genere e tipo, non un titolo', () => {
    assert.equal(isBrowseQuery('rpg'), true)
    assert.equal(isBrowseQuery('android gioco'), true)
    assert.equal(isBrowseQuery('cpu'), true)
    assert.equal(isBrowseQuery('mid-tower atx'), true)
    assert.equal(browseKind('gioco'), 'any')
    assert.equal(browseKind('rpg'), 'genre')
    assert.equal(isBrowseQuery('gta vi'), false)
    assert.equal(isBrowseQuery('7800x3d'), false)
    assert.equal(browseKind('ryzen 7 7800x3d'), 'specific')
  })

  it('tratta le famiglie di mercato come browse, non un solo SKU', () => {
    assert.equal(isBrowseQuery('ryzen'), true)
    assert.equal(isBrowseQuery('intel cpu'), true)
    assert.equal(isBrowseQuery('rtx'), true)
    assert.equal(isBrowseQuery('radeon'), true)
    assert.equal(isBrowseQuery('gpu'), true)
    assert.equal(isBrowseQuery('ugreen nasync 2 bay'), true)
    assert.equal(isBrowseQuery('rtx 5070'), false)
    assert.equal(isBrowseQuery('14600k'), false)
  })

  it('accetta un titolo specifico, non un tag generico', () => {
    assert.equal(titleHasSpecific('Baldur’s Gate 3', 'rpg'), false)
    assert.equal(titleHasSpecific('Baldur’s Gate 3', 'baldur gate'), true)
  })
})

describe('expandMarketQueries', () => {
  it('apre CPU e GPU a due ricerche, non un modello solo', () => {
    assert.deepEqual(expandMarketQueries('cpu'), ['processore amd ryzen', 'processore intel core'])
    assert.deepEqual(expandMarketQueries('gpu'), ['scheda video nvidia rtx', 'scheda video amd radeon'])
    assert.deepEqual(expandMarketQueries('ryzen'), ['processore amd ryzen'])
    assert.deepEqual(expandMarketQueries('rtx'), ['scheda video nvidia rtx'])
    assert.deepEqual(expandMarketQueries('7800x3d'), ['7800x3d'])
    assert.deepEqual(expandMarketQueries('rtx 5070'), ['rtx 5070'])
  })
})

describe('offerScore', () => {
  it('mette avanti lo sconto vero, non il catalogo senza prezzo', () => {
    assert.ok(
      offerScore({ discountPct: 40, verdict: { kind: 'eccezionale' }, priceUnknown: false }) >
        offerScore({ discountPct: 0, verdict: { kind: 'normale' }, priceUnknown: false }),
    )
    assert.equal(offerScore({ priceUnknown: true }), -100)
  })
})

describe('parseSteamFeatured', () => {
  it('ordina per sconto e non inventa prezzi', () => {
    const hits = parseSteamFeatured(
      {
        specials: {
          items: [
            { id: 1, name: 'Poco sconto', final_price: 900, original_price: 1000, discount_percent: 10 },
            { id: 2, name: 'Bel sconto', final_price: 499, original_price: 1999, discount_percent: 75 },
          ],
        },
        top_sellers: { items: [] },
      },
      8,
    )
    assert.equal(hits[0].title, 'Bel sconto')
    assert.equal(hits[0].price, 4.99)
    assert.equal(hits[0].discountPct, 75)
  })
})

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { browseKind, isBrowseQuery, titleHasSpecific } from './query-kind.mjs'
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

  it('accetta un titolo specifico, non un tag generico', () => {
    assert.equal(titleHasSpecific('Baldur’s Gate 3', 'rpg'), false)
    assert.equal(titleHasSpecific('Baldur’s Gate 3', 'baldur gate'), true)
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

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  expandGameQuery,
  extractXboxId,
  gameTitleMatches,
  parseItunesResults,
  parseXboxSuggests,
} from './console.mjs'

describe('expandGameQuery', () => {
  it('apre GTA e i numeri romani, toglie prevendita', () => {
    assert.equal(expandGameQuery('prevendita gta 6'), 'grand theft auto vi')
    assert.equal(expandGameQuery('gta vi'), 'grand theft auto vi')
  })
})

describe('gameTitleMatches', () => {
  it('riconosce GTA VI da gta 6 / gta vi', () => {
    assert.equal(gameTitleMatches('gta vi', 'Grand Theft Auto VI'), true)
    assert.equal(gameTitleMatches('gta 6', 'Grand Theft Auto VI'), true)
    assert.equal(gameTitleMatches('prevendita gta vi', 'Grand Theft Auto VI'), true)
  })
})

describe('extractXboxId', () => {
  it('legge l’id dal path Xbox / Microsoft', () => {
    assert.equal(
      extractXboxId('https://www.xbox.com/it-IT/games/store/grand-theft-auto-vi/9p3h4968grsm'),
      '9P3H4968GRSM',
    )
  })
})

describe('parseXboxSuggests', () => {
  it('prende i giochi e ignora il resto', () => {
    const json = {
      ResultSets: [
        {
          Suggests: [
            {
              Title: 'Grand Theft Auto VI',
              Url: '//www.microsoft.com/it-it/p/grand-theft-auto-vi/9p3h4968grsm',
              Source: 'Gioco',
              Metas: [
                { Key: 'BigCatalogId', Value: '9P3H4968GRSM' },
                { Key: 'ProductType', Value: 'Games' },
              ],
            },
            {
              Title: 'Surface Laptop',
              Url: '//www.microsoft.com/it-it/p/surface/xxxx',
              Metas: [{ Key: 'ProductType', Value: 'Devices' }],
            },
          ],
        },
      ],
    }
    const hits = parseXboxSuggests(json, 'gta vi')
    assert.equal(hits.length, 1)
    assert.equal(hits[0].externalId, '9P3H4968GRSM')
    assert.match(hits[0].url, /microsoft.com|xbox.com/)
  })
})

describe('parseItunesResults', () => {
  it('filtra i giochi iOS con prezzo', () => {
    const json = {
      results: [
        {
          trackName: 'Stardew Valley',
          price: 5.99,
          primaryGenreName: 'Games',
          trackId: 1406710800,
          trackViewUrl: 'https://apps.apple.com/it/app/stardew-valley/id1406710800',
        },
        {
          trackName: 'Guida dei fan a Stardew Valley',
          price: 0,
          primaryGenreName: 'Utilities',
          trackId: 1,
          trackViewUrl: 'https://apps.apple.com/x',
        },
      ],
    }
    const hits = parseItunesResults(json, 'stardew valley', { gamesOnly: true })
    assert.equal(hits.length, 1)
    assert.equal(hits[0].price, 5.99)
  })
})

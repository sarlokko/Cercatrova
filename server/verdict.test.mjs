import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { judgePrice } from './verdict.mjs'

describe('judgePrice', () => {
  it('non inventa un giudizio se manca il prezzo', () => {
    const v = judgePrice({ current: null, avg: 399, min: 349, list: 439 })
    assert.equal(v.kind, 'sconosciuto')
    assert.match(v.label, /NON DISPONIBILE/)
  })

  it('segnala un prezzo eccezionale sotto la media del 25%', () => {
    const v = judgePrice({ current: 299, avg: 399, min: 349, list: 439, sampleCount: 20 })
    assert.equal(v.kind, 'eccezionale')
    assert.equal(v.pctBelowAvg, 25)
  })

  it('dice abbastanza vicino alla media', () => {
    const v = judgePrice({ current: 369.99, avg: 399, min: 349, list: 439.99, sampleCount: 10 })
    assert.equal(v.kind, 'abbastanza')
  })

  it('aspetta lo storico se c’è un solo rilevamento a listino', () => {
    const v = judgePrice({ current: 13.99, avg: null, min: 13.99, list: 13.99, sampleCount: 1 })
    assert.equal(v.kind, 'pochi-dati')
  })

  it('usa lo sconto listino Steam anche senza storico lungo', () => {
    const v = judgePrice({ current: 6.99, avg: null, min: 6.99, list: 13.99, sampleCount: 1 })
    assert.equal(v.kind, 'eccezionale')
  })

  it('riconosce il gratis vero', () => {
    const v = judgePrice({ current: 0, avg: 0, min: 0, list: 0, isFree: true })
    assert.equal(v.kind, 'gratis')
  })
})

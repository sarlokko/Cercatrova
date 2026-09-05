import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { guessCategory } from './search.mjs'

describe('guessCategory', () => {
  it('mette i componenti PC nella categoria pc', () => {
    assert.equal(guessCategory('ryzen 7 7800x3d'), 'pc')
    assert.equal(guessCategory('rtx 5070'), 'pc')
    assert.equal(guessCategory('ram ddr5 32gb'), 'pc')
    assert.equal(guessCategory('case fractal north'), 'pc')
    assert.equal(guessCategory('scheda madre b650'), 'pc')
  })

  it('tiene i NAS distinti dai componenti', () => {
    assert.equal(guessCategory('ugreen nasync dxp2800'), 'nas')
    assert.equal(guessCategory('wd red plus 12tb nas'), 'nas')
  })

  it('mette PlayStation, Xbox e le prevendite tra i giochi', () => {
    assert.equal(guessCategory('gta vi'), 'steam')
    assert.equal(guessCategory('gta vi prevendita'), 'steam')
    assert.equal(guessCategory('playstation store'), 'steam')
    assert.equal(guessCategory('xbox series'), 'steam')
  })
})

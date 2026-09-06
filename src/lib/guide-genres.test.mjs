import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const src = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'guide.ts'), 'utf8')

const MAIN = [
  'Azione',
  'Avventura',
  'RPG',
  'Sparatutto',
  'Strategia',
  'Simulazione',
  'Sport',
  'Corse',
  'Horror',
  'Survival',
  'Puzzle',
  'Picchiaduro',
  'Piattaforma',
  'Indie',
  'Mondo aperto',
]

describe('generi nella guida giochi', () => {
  it('elenca i generi principali, non solo tre', () => {
    for (const label of MAIN) {
      assert.match(src, new RegExp(`label: '${label}'`))
    }
    assert.match(src, /label: 'Qualsiasi'/)
    assert.doesNotMatch(src, /Indie \/ avventura/)
    assert.doesNotMatch(src, /query: 'stardew'/)
    assert.doesNotMatch(src, /query: 'dead cells'/)
    assert.doesNotMatch(src, /query: 'minecraft'/)
  })
})

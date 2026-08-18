/**
 * Garde-fou de traduction.
 *
 * Une clé absente d'une langue est ici une **erreur de test**, pas un avertissement de console :
 * un avertissement se perd dans le bruit et l'anglais finirait par afficher du français sans que
 * personne ne s'en aperçoive.
 */
import { describe, expect, it } from 'vitest'

import { SUPPORTED_LOCALES } from '../locales.js'
import { MESSAGE_CATALOGS } from './index.js'

const reference = MESSAGE_CATALOGS.fr
const referenceKeys = Object.keys(reference).sort()

describe('catalogues d’interface', () => {
  it('couvre les trois langues supportées', () => {
    expect(Object.keys(MESSAGE_CATALOGS).sort()).toEqual([...SUPPORTED_LOCALES].sort())
  })

  it.each(SUPPORTED_LOCALES.filter((l) => l !== 'fr'))(
    'la langue %s déclare exactement les mêmes clés que le français',
    (locale) => {
      const keys = Object.keys(MESSAGE_CATALOGS[locale]).sort()
      const missing = referenceKeys.filter((k) => !keys.includes(k))
      const extra = keys.filter((k) => !referenceKeys.includes(k))
      expect({ missing, extra }).toEqual({ missing: [], extra: [] })
    },
  )

  it.each(SUPPORTED_LOCALES)('la langue %s n’a aucune valeur vide', (locale) => {
    const empty = Object.entries(MESSAGE_CATALOGS[locale])
      .filter(([, value]) =>
        typeof value === 'object'
          ? Object.values(value).some((form) => !String(form).trim())
          : !String(value).trim(),
      )
      .map(([key]) => key)
    expect(empty).toEqual([])
  })

  it.each(SUPPORTED_LOCALES)(
    'la langue %s garde les mêmes formes plurielles et les mêmes jetons que le français',
    (locale) => {
      const mismatched = []
      for (const [key, frValue] of Object.entries(reference)) {
        const value = MESSAGE_CATALOGS[locale][key]
        if (typeof frValue === 'object' && typeof value !== 'object') {
          mismatched.push(`${key} (pluriel attendu)`)
          continue
        }
        // Un jeton {count} oublié à la traduction donnerait « articles » sans le nombre.
        const tokensOf = (v) =>
          [...String(typeof v === 'object' ? Object.values(v).join(' ') : v).matchAll(/\{(\w+)\}/g)]
            .map((m) => m[1])
            .sort()
        const expected = [...new Set(tokensOf(frValue))]
        const actual = [...new Set(tokensOf(value))]
        if (expected.join(',') !== actual.join(',')) {
          mismatched.push(`${key} (jetons ${expected.join('|')} ≠ ${actual.join('|')})`)
        }
      }
      expect(mismatched).toEqual([])
    },
  )
})

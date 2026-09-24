/**
 * Garde-fous des pastilles de couleur de cadran.
 *
 * `watch_details.dial_color` reste du texte libre : les pastilles n'existent qu'à travers le
 * vocabulaire. Une `value` qui ne se relirait pas vers sa propre ligne ferait perdre la
 * pastille à la prochaine ouverture du formulaire.
 */
import { describe, expect, it } from 'vitest'

import {
  WATCH_DIAL_COLORS,
  getDialColorByText,
  parseDialColor,
  serializeDialColor,
} from './watchDialColors.js'

describe('WATCH_DIAL_COLORS', () => {
  it('a des slugs uniques', () => {
    const slugs = WATCH_DIAL_COLORS.map((c) => c.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it.each(WATCH_DIAL_COLORS.map((c) => [c.value, c.slug]))(
    '« %s » se relit comme la pastille %s',
    (value, slug) => {
      expect(getDialColorByText(value)?.slug).toBe(slug)
    },
  )
})

describe('parseDialColor', () => {
  it('reconnaît les anciennes saisies, casse et accords compris', () => {
    expect(parseDialColor('noir')).toEqual({ slugs: ['black'], other: '' })
    expect(parseDialColor('Argentée')).toEqual({ slugs: ['silver'], other: '' })
    expect(parseDialColor('Or')).toEqual({ slugs: ['gold'], other: '' })
  })

  it('garde l’ordre de saisie des cadrans bicolores, sans doublon', () => {
    expect(parseDialColor('Blanc / Noir, blanc')).toEqual({ slugs: ['white', 'black'], other: '' })
  })

  it('range ce qui n’est pas une pastille dans « Autre »', () => {
    expect(parseDialColor('Bleu / Ice Blue')).toEqual({ slugs: ['blue'], other: 'Ice Blue' })
    expect(parseDialColor('Saumon')).toEqual({ slugs: [], other: 'Saumon' })
  })

  it('ne confond pas « Rose » et « Or rose »', () => {
    expect(parseDialColor('Rose')).toEqual({ slugs: ['pink'], other: '' })
    expect(parseDialColor('Or rose')).toEqual({ slugs: [], other: 'Or rose' })
  })

  it('renvoie un état vide pour une valeur absente', () => {
    expect(parseDialColor(null)).toEqual({ slugs: [], other: '' })
    expect(parseDialColor('  ')).toEqual({ slugs: [], other: '' })
  })
})

describe('serializeDialColor', () => {
  it('écrit les valeurs françaises puis le texte libre', () => {
    expect(serializeDialColor(['white', 'black'], ' Nacre ')).toBe('Blanc / Noir / Nacre')
  })

  it('ignore les slugs inconnus et renvoie une chaîne vide si rien n’est choisi', () => {
    expect(serializeDialColor(['nope'])).toBe('')
    expect(serializeDialColor([], '')).toBe('')
  })

  it('fait l’aller-retour avec parseDialColor', () => {
    const state = { slugs: ['copper', 'turquoise'], other: 'Bleu glacier' }
    expect(parseDialColor(serializeDialColor(state.slugs, state.other))).toEqual(state)
  })
})

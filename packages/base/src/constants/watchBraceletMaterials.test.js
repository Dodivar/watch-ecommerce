/**
 * Garde-fou de normalisation des matières de bracelet.
 *
 * La colonne `watch_details.bracelet_materials` est un `text[]` : rien côté base n'oblige la
 * saisie à y déposer un slug. Deux montres du catalogue y stockent du texte libre
 * (« Acier », « Cuir de crocodile ») — la lecture doit les récupérer, pas les effacer.
 */
import { describe, expect, it } from 'vitest'

import {
  mapPrestaShopBraceletMaterial,
  normalizeBraceletMaterials,
} from './watchBraceletMaterials.js'

describe('normalizeBraceletMaterials', () => {
  it('accepte les slugs déjà valides', () => {
    expect(normalizeBraceletMaterials(['steel', 'leather'])).toEqual(['steel', 'leather'])
  })

  it('récupère le texte libre stocké dans le tableau', () => {
    // Régression : la branche tableau ne validait que les slugs, donc ces valeurs
    // disparaissaient et la montre s'affichait sans matière de bracelet.
    expect(normalizeBraceletMaterials(['Acier'])).toEqual(['steel'])
    expect(normalizeBraceletMaterials(['Cuir de crocodile'])).toEqual(['leather'])
  })

  it('mélange slugs et texte libre sans doublon', () => {
    expect(normalizeBraceletMaterials(['steel', 'Acier', 'Cuir'])).toEqual(['steel', 'leather'])
  })

  it('ordonne selon la liste de référence, pas selon la saisie', () => {
    expect(normalizeBraceletMaterials(['leather', 'steel'])).toEqual(['steel', 'leather'])
  })

  it('ignore ce qui ne correspond à aucune matière connue', () => {
    expect(normalizeBraceletMaterials(['steel', 'Météorite', null, 42])).toEqual(['steel'])
  })

  it('accepte la chaîne legacy de l’ancienne colonne singulière', () => {
    expect(normalizeBraceletMaterials('Acier')).toEqual(['steel'])
    expect(normalizeBraceletMaterials('')).toEqual([])
  })

  it('renvoie un tableau vide pour une valeur absente', () => {
    expect(normalizeBraceletMaterials(null)).toEqual([])
    expect(normalizeBraceletMaterials(undefined)).toEqual([])
  })
})

describe('mapPrestaShopBraceletMaterial', () => {
  it('ignore la casse et les accents', () => {
    expect(mapPrestaShopBraceletMaterial('ACIER INOXYDABLE')).toBe('steel')
    expect(mapPrestaShopBraceletMaterial('Céramique')).toBe('ceramic')
  })

  it('range le cuir de crocodile avec le cuir', () => {
    // Le filtre de collection n'a que sept matières : la précision « crocodile » est
    // conservée à l'affichage de la valeur libre, pas dans le slug.
    expect(mapPrestaShopBraceletMaterial('Cuir de crocodile')).toBe('leather')
  })

  it('renvoie null sur une matière inconnue', () => {
    expect(mapPrestaShopBraceletMaterial('Météorite')).toBeNull()
    expect(mapPrestaShopBraceletMaterial('')).toBeNull()
  })
})

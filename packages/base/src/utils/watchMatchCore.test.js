/**
 * Le noyau partagé entre le parcours front et le backend d'alerte e-mail.
 *
 * Deux choses à garder vraies ici, et elles ne se surveillent pas toutes seules :
 *
 * 1. **La pureté du module.** Vitest résout `@/` comme Vite : un alias qui se glisserait dans
 *    la chaîne d'imports du noyau passerait toute la suite au vert et ne casserait qu'en
 *    production, au démarrage du backend. Le premier test lit donc le *source* des fichiers,
 *    comme `i18n/messages/messageUsage.test.js`, plutôt que de leur faire confiance.
 * 2. **Le seuil de correspondance.** C'est la règle qui décide d'écrire à quelqu'un ; ses cas
 *    limites (aucun critère, budget seul) sont testés nommément parce qu'ils sont muets quand
 *    ils sont faux — pas d'erreur, juste une alerte qui ne part jamais ou qui part trop.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import {
  MATCH_ALERT_THRESHOLD,
  affinityRatio,
  buildMatchWatchFromRow,
  matchesPreferences,
  measureAffinity,
  sanitizePreferences,
  watchValuesFor,
} from './watchMatchCore.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CORE_ENTRY = path.join(__dirname, 'watchMatchCore.js')

/** Préférences complètes depuis un objet partiel (les critères absents restent vides). */
function prefs(overrides = {}) {
  return sanitizePreferences(overrides)
}

/** Montre dans la forme que lit `VALUES_OF`. */
function makeWatch(overrides = {}) {
  const { details, ...rest } = overrides
  return {
    id: 'w',
    brand: 'Rolex',
    price: 5000,
    details: {
      movement: '',
      caseMaterial: '',
      braceletMaterials: [],
      braceletColors: [],
      dialColor: '',
      ...details,
    },
    ...rest,
  }
}

describe('pureté du noyau (chargeable hors Vite)', () => {
  /**
   * Ferme transitivement les imports relatifs depuis le noyau et renvoie chaque fichier
   * atteint avec ses spécificateurs d'import.
   */
  function importClosure(entry) {
    const seen = new Map()
    const queue = [entry]
    while (queue.length > 0) {
      const file = queue.shift()
      if (seen.has(file)) continue
      const source = fs.readFileSync(file, 'utf8')
      const specifiers = [...source.matchAll(/\bfrom\s+'([^']+)'/g)].map((m) => m[1])
      seen.set(file, specifiers)
      for (const specifier of specifiers) {
        if (!specifier.startsWith('.')) continue
        queue.push(path.resolve(path.dirname(file), specifier))
      }
    }
    return seen
  }

  it("n'importe rien par alias, ni directement ni par transitivité", () => {
    const offenders = []
    for (const [file, specifiers] of importClosure(CORE_ENTRY)) {
      for (const specifier of specifiers) {
        // Un import nu (`vue`, `@/i18n`, `@site-config`) n'est résolvable que par Vite.
        if (!specifier.startsWith('.')) {
          offenders.push(`${path.relative(__dirname, file)} → ${specifier}`)
        }
      }
    }
    expect(offenders).toEqual([])
  })

  it('atteint bien les référentiels dont la correspondance dépend (garde-fou du test)', () => {
    const files = [...importClosure(CORE_ENTRY).keys()].map((f) => path.basename(f))
    expect(files).toEqual(
      expect.arrayContaining([
        'watchMatchCore.js',
        'watchBraceletColors.js',
        'watchBraceletMaterials.js',
        'watchSpecVocabulary.js',
        'watchPricing.js',
      ]),
    )
  })
})

describe('matchesPreferences — cas limites', () => {
  it('déclenche sur une alerte sans aucun critère (le visiteur a demandé les nouveautés)', () => {
    expect(matchesPreferences(makeWatch(), prefs({}))).toBe(true)
  })

  it("déclenche sur une alerte « budget seul » quand la montre y entre — un score nul n'est pas un refus", () => {
    const budgetOnly = prefs({ budget: { min: 1000, max: 10000 } })
    // Régression : le score vaut 0 ici quoi qu'il arrive (aucun critère de liste exprimé).
    // Un seuil posé sur le score brut rendrait cette alerte muette pour toujours.
    expect(measureAffinity(makeWatch(), budgetOnly).score).toBe(0)
    expect(affinityRatio(makeWatch(), budgetOnly)).toBeNull()
    expect(matchesPreferences(makeWatch({ price: 5000 }), budgetOnly)).toBe(true)
  })

  it('ne déclenche pas hors budget, seul filtre dur', () => {
    const budgetOnly = prefs({ budget: { min: 1000, max: 4000 } })
    expect(matchesPreferences(makeWatch({ price: 9000 }), budgetOnly)).toBe(false)
  })

  it("laisse passer une montre sans prix : l'inconnu n'écarte pas", () => {
    const budgetOnly = prefs({ budget: { min: 1000, max: 4000 } })
    expect(matchesPreferences(makeWatch({ price: null }), budgetOnly)).toBe(true)
  })

  it('ne plafonne pas une borne haute ouverte : « à partir de » vaut aussi pour plus cher', () => {
    // Régression : le curseur poussé à fond enregistrait le prix de la montre la plus chère du
    // stock du jour. Des mois plus tard, l'alerte manquait toute montre au-dessus de ce prix —
    // exactement celles que le visiteur avait demandées en poussant le curseur au bout.
    const openTop = prefs({ budget: { min: 8000, max: null } })
    expect(matchesPreferences(makeWatch({ price: 9000 }), openTop)).toBe(true)
    expect(matchesPreferences(makeWatch({ price: 120000 }), openTop)).toBe(true)
    // La borne basse, elle, reste un plancher.
    expect(matchesPreferences(makeWatch({ price: 3000 }), openTop)).toBe(false)
  })
})

describe('matchesPreferences — critères exprimés', () => {
  it('déclenche quand la montre coche le seul critère demandé', () => {
    expect(matchesPreferences(makeWatch({ brand: 'Rolex' }), prefs({ brand: ['rolex'] }))).toBe(
      true,
    )
  })

  it('ne déclenche pas quand la montre contredit le seul critère demandé', () => {
    expect(matchesPreferences(makeWatch({ brand: 'Omega' }), prefs({ brand: ['rolex'] }))).toBe(
      false,
    )
  })

  it('ne déclenche pas quand la caractéristique demandée est inconnue : le silence ne vaut pas oui', () => {
    const watch = makeWatch({ brand: '' })
    expect(watchValuesFor('brand', watch)).toEqual([])
    expect(matchesPreferences(watch, prefs({ brand: ['rolex'] }))).toBe(false)
  })

  it('déclenche quand la moitié du poids exprimé est satisfaite, le reste étant inconnu', () => {
    // brand (3) coché, color (2) inconnue → 3/5 = 0,6.
    const wanted = prefs({ brand: ['rolex'], color: ['black'] })
    const watch = makeWatch({ brand: 'Rolex' })
    expect(affinityRatio(watch, wanted)).toBeCloseTo(0.6)
    expect(matchesPreferences(watch, wanted)).toBe(true)
  })

  it('ne déclenche pas pour une fiche presque vide qui ne coche qu’un critère léger', () => {
    // movement (1) coché sur 10 de poids exprimé → 0,1.
    const wanted = prefs({
      brand: ['rolex'],
      bracelet: ['steel'],
      caseMaterial: ['watchSpec.material.steel'],
      color: ['black'],
      movement: ['watchSpec.movement.automatic'],
    })
    const watch = makeWatch({ brand: '', details: { movement: 'Remontage automatique' } })
    expect(affinityRatio(watch, wanted)).toBeCloseTo(0.1)
    expect(matchesPreferences(watch, wanted)).toBe(false)
  })

  it('une contradiction pèse moitié moins qu’une correspondance (poids repris du deck)', () => {
    const wanted = prefs({ brand: ['rolex'] })
    expect(measureAffinity(makeWatch({ brand: 'Rolex' }), wanted)).toEqual({
      score: 3,
      expressedWeight: 3,
    })
    expect(measureAffinity(makeWatch({ brand: 'Omega' }), wanted)).toEqual({
      score: -1.5,
      expressedWeight: 3,
    })
  })

  it('accepte un seuil explicite (le défaut reste la moitié)', () => {
    const wanted = prefs({ brand: ['rolex'], color: ['black'] })
    const watch = makeWatch({ brand: 'Rolex' }) // ratio 0,6
    expect(MATCH_ALERT_THRESHOLD).toBe(0.5)
    expect(matchesPreferences(watch, wanted, 0.8)).toBe(false)
    expect(matchesPreferences(watch, wanted, 0.6)).toBe(true)
  })
})

describe('matchesPreferences — question jamais posée (`offered`)', () => {
  // Le visiteur a coché Rolex et noir le jour où le stock n'offrait que Rolex/Tudor et
  // noir/argent. L'alerte est relue des mois plus tard, face à un catalogue qui a bougé.
  const wanted = prefs({
    brand: ['rolex'],
    color: ['black'],
    offered: { brand: ['rolex', 'tudor'], color: ['black', 'silver'] },
  })

  it("une marque qui n'était pas proposée ne contredit pas : le visiteur n'en a rien dit", () => {
    // Sans `offered`, cette Omega noire valait −1,5 + 2 = 0,5 / 5 = 0,1 → aucun e-mail.
    const watch = makeWatch({ brand: 'Omega', details: { dialColor: 'Noir' } })
    expect(measureAffinity(watch, wanted)).toEqual({ score: 2, expressedWeight: 2 })
    expect(matchesPreferences(watch, wanted)).toBe(true)
  })

  it('une montre entièrement hors des options proposées ne relève que du budget', () => {
    const watch = makeWatch({ brand: 'Omega', details: { dialColor: 'Rouge' } })
    expect(affinityRatio(watch, wanted)).toBeNull()
    expect(matchesPreferences(watch, wanted)).toBe(true)
    expect(matchesPreferences(watch, { ...wanted, budget: { min: 0, max: 3000 } })).toBe(false)
  })

  it('une option proposée mais pas cochée reste une contradiction : là, le visiteur a répondu', () => {
    const watch = makeWatch({ brand: 'Tudor', details: { dialColor: 'Argent' } })
    expect(measureAffinity(watch, wanted)).toEqual({ score: -2.5, expressedWeight: 5 })
    expect(matchesPreferences(watch, wanted)).toBe(false)
  })

  it('une caractéristique inconnue reste inconnue, `offered` ou pas', () => {
    // Rolex (3) coché, couleur absente de la fiche → 3/5, comme avant.
    const watch = makeWatch({ brand: 'Rolex' })
    expect(affinityRatio(watch, wanted)).toBeCloseTo(0.6)
  })

  it('une montre multicolore compte dès qu’une de ses couleurs était proposée', () => {
    // Argent était proposé (et pas coché), rouge ne l'était pas : la couleur reste jugée.
    const watch = makeWatch({
      brand: 'Rolex',
      details: { braceletColors: ['silver'], dialColor: 'Rouge' },
    })
    expect(measureAffinity(watch, wanted)).toEqual({ score: 2, expressedWeight: 5 })
  })

  it('sans `offered` (alertes plus anciennes), la règle d’avant s’applique', () => {
    const legacy = prefs({ brand: ['rolex'], color: ['black'] })
    const watch = makeWatch({ brand: 'Omega', details: { dialColor: 'Rouge' } })
    expect(matchesPreferences(watch, legacy)).toBe(false)
  })
})

describe('MATCH_COLOR_OPTIONS — couleurs pas encore en stock', () => {
  it('reconnaît un cadran dont la couleur ne figure ni parmi les bracelets ni dans le stock', () => {
    for (const [dialColor, slug] of [
      ['Rouge', 'red'],
      ['Bordeaux', 'burgundy'],
      ['Rose', 'pink'],
      ['Violet', 'purple'],
      ['Turquoise', 'turquoise'],
      ['Beige', 'beige'],
      ['Orange', 'orange'],
      ['Jaune', 'yellow'],
      ['Cuivre', 'copper'],
    ]) {
      expect(watchValuesFor('color', makeWatch({ details: { dialColor } }))).toEqual([slug])
    }
  })

  it('« or rose » reste l’or rose des bracelets, pas le rose', () => {
    expect(watchValuesFor('color', makeWatch({ details: { dialColor: 'Or rose' } }))).toEqual([
      'rose_gold',
    ])
  })
})

describe('sanitizePreferences', () => {
  it("n'emporte que les préférences : l'historique de swipe ne peut pas traverser", () => {
    const clean = sanitizePreferences({
      budget: { min: 1000, max: 5000 },
      brand: ['rolex'],
      // Ce que le navigateur garde pour lui (matchSessionStorage.js) — jamais transmis.
      seen: ['w1', 'w2'],
      liked: ['w1'],
      passed: ['w2'],
      email: 'fuite@example.fr',
    })
    expect(Object.keys(clean).sort()).toEqual([
      'bracelet',
      'brand',
      'budget',
      'caseMaterial',
      'color',
      'movement',
    ])
  })

  it('ignore un budget incohérent plutôt que de le propager', () => {
    expect(sanitizePreferences({ budget: { min: 5000, max: 1000 } }).budget).toBeNull()
    expect(sanitizePreferences({ budget: 'cher' }).budget).toBeNull()
    expect(sanitizePreferences({ budget: { min: 1000, max: 'cher' } }).budget).toBeNull()
    expect(sanitizePreferences({ budget: { max: 5000 } }).budget).toBeNull()
  })

  it('conserve une borne haute ouverte au lieu de la prendre pour une erreur', () => {
    // C'est la forme que produit le curseur au maximum, et celle que le backend relit des mois
    // plus tard : la traiter comme un budget invalide rendrait le plancher muet lui aussi.
    expect(sanitizePreferences({ budget: { min: 8000, max: null } }).budget).toEqual({
      min: 8000,
      max: null,
    })
    expect(sanitizePreferences({ budget: { min: 8000 } }).budget).toEqual({ min: 8000, max: null })
  })

  it('garde `offered` pour les seuls critères de liste connus, et l’omet s’il est vide', () => {
    const clean = sanitizePreferences({
      offered: { brand: ['rolex', 'rolex', 3], budget: [1000], seen: ['w1'], color: 'black' },
    })
    expect(clean.offered).toEqual({ brand: ['rolex'] })
    expect(sanitizePreferences({ offered: { seen: ['w1'] } })).not.toHaveProperty('offered')
    expect(sanitizePreferences({ offered: 'tout' })).not.toHaveProperty('offered')
  })

  it('déduplique et rejette les valeurs non textuelles', () => {
    expect(sanitizePreferences({ brand: ['rolex', 'rolex', 42, null, ' '] }).brand).toEqual([
      'rolex',
    ])
  })
})

describe('buildMatchWatchFromRow', () => {
  const row = {
    id: 'w1',
    slug: 'rolex-submariner',
    name: 'Submariner',
    brand: 'Rolex',
    reference: '126610LN',
    price: 12000,
    promotion_price: 11000,
    created_at: '2026-09-01T10:00:00Z',
  }

  it('produit les champs que lit la correspondance', () => {
    const watch = buildMatchWatchFromRow(row, {
      movement: 'Remontage automatique',
      case_material: 'Acier',
      bracelet_materials: ['steel'],
      bracelet_colors: ['silver'],
      dial_color: 'Noir',
    })
    expect(watchValuesFor('brand', watch)).toEqual(['rolex'])
    expect(watchValuesFor('bracelet', watch)).toEqual(['steel'])
    expect(watchValuesFor('caseMaterial', watch)).toEqual(['watchSpec.material.steel'])
    expect(watchValuesFor('color', watch)).toEqual(['silver', 'black'])
    expect(watchValuesFor('movement', watch)).toEqual(['watchSpec.movement.automatic'])
  })

  it('applique le prix promotionnel comme le front (budget en euros réels)', () => {
    const watch = buildMatchWatchFromRow(row)
    expect(matchesPreferences(watch, prefs({ budget: { min: 10500, max: 11500 } }))).toBe(true)
  })

  it('lit encore la colonne `bracelet_material` au singulier (héritage)', () => {
    const watch = buildMatchWatchFromRow(row, { bracelet_material: 'Cuir' })
    expect(watchValuesFor('bracelet', watch)).toEqual(['leather'])
  })

  it('sur une ligne sans détails, tout est inconnu plutôt que faux', () => {
    const watch = buildMatchWatchFromRow(row, null)
    expect(watchValuesFor('caseMaterial', watch)).toEqual([])
    expect(watchValuesFor('color', watch)).toEqual([])
    expect(watchValuesFor('movement', watch)).toEqual([])
  })
})

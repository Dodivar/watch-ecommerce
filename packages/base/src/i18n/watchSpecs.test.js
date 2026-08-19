/**
 * Garde-fou de la traduction des valeurs de fiche montre.
 *
 * Le corpus ci-dessous n'est pas inventé : ce sont les valeurs distinctes réellement présentes
 * dans `watches` / `watch_details` / `watch_accessories`. Deux propriétés y sont vérifiées, et
 * la seconde compte autant que la première :
 *
 * 1. le vocabulaire connu est bien traduit dans les trois langues ;
 * 2. **tout le reste traverse intact** — un calibre, un nom commercial ou une formulation
 *    inédite ne doit jamais être remplacé par une clé ni par du vide.
 */
import { describe, expect, it } from 'vitest'

import { MESSAGE_CATALOGS } from './messages/index.js'
import { createTranslator } from './translator.js'
import {
  formatWaterResistance,
  resolveConditionSchemaValue,
  translateAccessory,
  translateDuration,
  translateGuarantee,
  translateSpec,
  translateSpecList,
} from './watchSpecs.js'

/** Traducteur figé sur une langue, pour couvrir les trois dans un même fichier. */
function i18nFor(locale) {
  return createTranslator({ locale, fallbackLocale: 'fr', catalogs: MESSAGE_CATALOGS })
}

const fr = i18nFor('fr')
const en = i18nFor('en')
const de = i18nFor('de')

describe('valeurs simples', () => {
  it.each([
    ['material', 'Acier', 'Acier', 'Steel', 'Stahl'],
    ['crystal', 'Saphir', 'Saphir', 'Sapphire', 'Saphirglas'],
    ['crystal', 'Plexiglas', 'Plexiglas', 'Acrylic', 'Acrylglas'],
    ['color', 'Noir', 'Noir', 'Black', 'Schwarz'],
    ['color', 'Argent', 'Argent', 'Silver', 'Silber'],
    ['movement', 'Remontage automatique', 'Remontage automatique', 'Automatic', 'Automatikaufzug'],
    ['movement', 'Quartz', 'Quartz', 'Quartz', 'Quarz'],
    ['content', 'Full set', 'Full set', 'Full set', 'Full Set'],
    ['content', 'Montre seule', 'Montre seule', 'Watch only', 'Nur Uhr'],
    ['audience', 'homme', 'Homme', 'Men', 'Herren'],
  ])('%s « %s » se traduit', (family, raw, expectedFr, expectedEn, expectedDe) => {
    expect(translateSpec(family, raw, fr)).toBe(expectedFr)
    expect(translateSpec(family, raw, en)).toBe(expectedEn)
    expect(translateSpec(family, raw, de)).toBe(expectedDe)
  })

  it('absorbe les variantes de saisie sur une même notion', () => {
    // « Excellent » et « Excellent état » cohabitent en base, de même que « Très bon ».
    for (const raw of ['Excellent', 'Excellent état', 'excellent  etat']) {
      expect(translateSpec('condition', raw, en)).toBe('Excellent condition')
    }
    for (const raw of ['Très bon', 'Très bon état']) {
      expect(translateSpec('condition', raw, de)).toBe('Sehr guter Zustand')
    }
  })

  it('rend une valeur vide comme une chaîne vide', () => {
    expect(translateSpec('material', null, en)).toBe('')
    expect(translateSpec('material', '   ', en)).toBe('')
  })
})

describe('valeurs hors vocabulaire', () => {
  // Le champ `movement` porte tantôt un type, tantôt un calibre ; `dial_color` un nom
  // commercial. Les traduire serait une régression, pas une amélioration.
  it.each([
    ['movement', '3235'],
    ['movement', 'MT5400'],
    ['movement', '1863'],
    ['color', 'Ice Blue'],
    ['color', 'Noir wave'],
  ])('%s « %s » traverse intact dans les trois langues', (family, raw) => {
    for (const i18n of [fr, en, de]) {
      expect(translateSpec(family, raw, i18n)).toBe(raw)
    }
  })

  it('nettoie les espaces parasites sans altérer la valeur', () => {
    expect(translateSpec('movement', '\tBreitling 01', en)).toBe('Breitling 01')
  })
})

describe('listes composées', () => {
  it('traduit chaque terme d’une matière composite', () => {
    expect(translateSpecList('material', 'Acier / Or jaune', en)).toBe('Steel / Yellow gold')
    expect(translateSpecList('material', 'Acier / Or rose', de)).toBe('Stahl / Roségold')
  })

  it('traduit les fonctions et capitalise la tête de liste', () => {
    expect(translateSpecList('fn', 'Heures, minutes, secondes, date', fr)).toBe(
      'Heures, minutes, secondes, date',
    )
    expect(translateSpecList('fn', 'Heures, minutes, secondes, date', en)).toBe(
      'Hours, minutes, seconds, date',
    )
    expect(translateSpecList('fn', 'Heures, minutes, secondes, date', de)).toBe(
      'Stunden, Minuten, Sekunden, Datum',
    )
  })

  it('distingue chronographe et chronomètre', () => {
    expect(translateSpecList('fn', 'Heures, secondes, chronographe', en)).toBe(
      'Hours, seconds, chronograph',
    )
    expect(translateSpecList('fn', 'Heures, secondes, chronomètre', en)).toBe(
      'Hours, seconds, chronometer',
    )
  })

  it('rattrape une virgule sans espace', () => {
    expect(translateSpecList('fn', 'Heures, minutes,seconde, date', en)).toBe(
      'Hours, minutes, seconds, date',
    )
  })

  it('garde les termes inconnus au milieu d’une liste', () => {
    expect(translateSpecList('fn', 'Heures, minutes, Zenith El Primero', en)).toBe(
      'Hours, minutes, Zenith El Primero',
    )
  })
})

describe('durées', () => {
  it.each([
    ['42 Heures', '42 heures', '42 hours', '42 Stunden'],
    ['70h', '70 heures', '70 hours', '70 Stunden'],
    ['48 Heures', '48 heures', '48 hours', '48 Stunden'],
  ])('« %s » s’uniformise et se traduit', (raw, expectedFr, expectedEn, expectedDe) => {
    expect(translateDuration(raw, fr)).toBe(expectedFr)
    expect(translateDuration(raw, en)).toBe(expectedEn)
    expect(translateDuration(raw, de)).toBe(expectedDe)
  })

  it('accorde le singulier', () => {
    expect(translateDuration('1 heure', en)).toBe('1 hour')
    expect(translateDuration('1 jour', de)).toBe('1 Tag')
  })

  it('laisse passer une formulation non reconnue', () => {
    expect(translateDuration('environ deux jours', en)).toBe('environ deux jours')
  })
})

describe('garanties', () => {
  it('accorde la durée de garantie', () => {
    expect(translateGuarantee('1 an de garantie', fr)).toBe('1 an de garantie')
    expect(translateGuarantee('1 an de garantie', en)).toBe('1 year warranty')
    expect(translateGuarantee('1 an de garantie', de)).toBe('1 Jahr Garantie')
    expect(translateGuarantee('2 ans de garantie', en)).toBe('2 years warranty')
  })

  it('ne traduit que le mot « garantie », pas la marque ni la date', () => {
    expect(translateGuarantee('Garantie Rolex 05/2027', fr)).toBe('Garantie Rolex 05/2027')
    expect(translateGuarantee('Garantie Rolex 05/2027', en)).toBe('Rolex 05/2027 warranty')
    expect(translateGuarantee('Garantie Tudor 06/2029', de)).toBe('Garantie Tudor 06/2029')
  })

  it('laisse passer une valeur qui n’est pas une garantie formulée', () => {
    expect(translateGuarantee('Breitling', en)).toBe('Breitling')
  })
})

describe('accessoires', () => {
  it.each([
    ["Boîte d'origine", 'Original box', 'Originalbox'],
    ["Boite d'origine", 'Original box', 'Originalbox'],
    ["Papiers d'origine", 'Original papers', 'Originalpapiere'],
    ["papiers d'origines", 'Original papers', 'Originalpapiere'],
    ["Certificat d'authenticité", 'Certificate of authenticity', 'Echtheitszertifikat'],
    ["Manuel d'utilisation", 'User manual', 'Bedienungsanleitung'],
    ['Étiquettes', 'Tags', 'Etiketten'],
    ["Sur-boîte d'origine", 'Original outer box', 'Original-Umkarton'],
    ["Facture d'origine", 'Original invoice', 'Originalrechnung'],
  ])('« %s » se traduit', (raw, expectedEn, expectedDe) => {
    expect(translateAccessory(raw, en)).toBe(expectedEn)
    expect(translateAccessory(raw, de)).toBe(expectedDe)
  })

  it('conserve la marque dans les formulations décorées', () => {
    expect(translateAccessory("Boîte Rolex d'origine", en)).toBe('Original Rolex box')
    expect(translateAccessory("Boite Hamilton d'origine", de)).toBe('Original-Hamilton-Box')
    expect(translateAccessory("Carte d'origine Oméga", en)).toBe('Original Oméga card')
  })

  it('laisse intact un accessoire trop spécifique pour être traduit', () => {
    for (const raw of [
      'Ecrin de voyage Breitling',
      'Tag Breitling',
      "2ème bracelet cuir Breitling - état d'usage",
    ]) {
      expect(translateAccessory(raw, en)).toBe(raw)
    }
  })
})

describe('étanchéité', () => {
  it('uniformise sans traduire', () => {
    expect(formatWaterResistance('3ATM')).toBe('3 ATM')
    expect(formatWaterResistance('3 ATM')).toBe('3 ATM')
    expect(formatWaterResistance('100m')).toBe('100 m')
    expect(formatWaterResistance('300m')).toBe('300 m')
  })

  it('laisse passer une formulation libre', () => {
    expect(formatWaterResistance('Étanche à la pluie')).toBe('Étanche à la pluie')
  })
})

describe('état pour le JSON-LD', () => {
  // La page comparait la valeur brute à la chaîne exacte « Neuf » : « neuf » et « Comme neuf »
  // étaient donc classés en occasion.
  it('reconnaît le neuf quelle que soit la casse', () => {
    expect(resolveConditionSchemaValue('Neuf')).toBe('new')
    expect(resolveConditionSchemaValue('neuf')).toBe('new')
  })

  it('classe le reste du vocabulaire en occasion', () => {
    expect(resolveConditionSchemaValue('Comme neuf')).toBe('used')
    expect(resolveConditionSchemaValue('Excellent')).toBe('used')
    expect(resolveConditionSchemaValue('Très bon état')).toBe('used')
  })

  it('ne tranche pas sur une valeur inconnue', () => {
    expect(resolveConditionSchemaValue('MT5400')).toBeNull()
    expect(resolveConditionSchemaValue('')).toBeNull()
  })
})

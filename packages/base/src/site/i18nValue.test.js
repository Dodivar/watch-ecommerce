import { describe, expect, it } from 'vitest'

import { isI18nValue, localizeTree, pickI18nValue, t } from './i18nValue.js'

describe('t()', () => {
  it('marque un objet de traductions', () => {
    const node = t({ fr: 'Bonjour', en: 'Hello', de: 'Hallo' })
    expect(isI18nValue(node)).toBe(true)
    expect(node.fr).toBe('Bonjour')
  })

  it('accepte une traduction partielle', () => {
    expect(isI18nValue(t({ fr: 'Bonjour' }))).toBe(true)
  })

  it('refuse une langue inconnue', () => {
    expect(() => t({ fr: 'Bonjour', es: 'Hola' })).toThrow(/es/)
  })

  it('refuse un objet vide ou une valeur non-objet', () => {
    expect(() => t({})).toThrow()
    expect(() => t('Bonjour')).toThrow()
    expect(() => t(null)).toThrow()
  })

  it('n’expose que les langues en clés énumérables (marqueur invisible)', () => {
    const node = t({ fr: 'Bonjour', en: 'Hello' })
    expect(Object.keys(node)).toEqual(['fr', 'en'])
  })

  it('dégrade vers la première langue si un lecteur oublie localizeTree()', () => {
    // Filet de sécurité : mieux vaut du français dans un PDF qu’un « [object Object] ».
    const node = t({ fr: 'Bonjour', en: 'Hello' })
    expect(`${node}`).toBe('Bonjour')
    expect(JSON.parse(JSON.stringify({ label: node }))).toEqual({ label: 'Bonjour' })
  })

  it('ne considère pas un objet ordinaire comme traduisible', () => {
    expect(isI18nValue({ fr: 'Bonjour', en: 'Hello' })).toBe(false)
    expect(isI18nValue('Bonjour')).toBe(false)
    expect(isI18nValue(null)).toBe(false)
  })
})

describe('pickI18nValue()', () => {
  const node = t({ fr: 'Bonjour', de: 'Hallo' })

  it('retourne la langue demandée', () => {
    expect(pickI18nValue(node, 'de')).toBe('Hallo')
  })

  it('retombe sur la langue de repli quand la traduction manque', () => {
    expect(pickI18nValue(node, 'en', 'fr')).toBe('Bonjour')
  })

  it('retombe sur la première langue déclarée si le repli manque aussi', () => {
    expect(pickI18nValue(t({ de: 'Hallo' }), 'en', 'fr')).toBe('Hallo')
  })
})

describe('localizeTree()', () => {
  it('aplatit les nœuds traduisibles imbriqués', () => {
    const config = {
      copy: {
        footerTagline: t({ fr: 'Montres', en: 'Watches', de: 'Uhren' }),
        copyrightLine: '© 2026',
      },
      faq: {
        items: [{ id: 'a', question: t({ fr: 'Quoi ?', en: 'What?', de: 'Was?' }) }],
      },
    }

    expect(localizeTree(config, 'de')).toEqual({
      copy: { footerTagline: 'Uhren', copyrightLine: '© 2026' },
      faq: { items: [{ id: 'a', question: 'Was?' }] },
    })
  })

  it('laisse intactes les valeurs non textuelles', () => {
    const config = {
      theme: { colors: { primary: '#123456' } },
      features: { collection: true, blog: false },
      home: { sections: ['hero', 'nouvelles'] },
      checkout: { vatRate: 0.2, freeShippingFrom: null },
    }
    expect(localizeTree(config, 'en')).toEqual(config)
  })

  it('applique le repli langue par langue sur une traduction partielle', () => {
    const config = { a: t({ fr: 'Oui', en: 'Yes' }), b: t({ fr: 'Non' }) }
    expect(localizeTree(config, 'de', 'fr')).toEqual({ a: 'Oui', b: 'Non' })
  })

  it('résout un nœud traduisible contenant une structure', () => {
    const config = {
      guarantees: t({
        fr: [{ label: 'Authentique' }],
        en: [{ label: 'Authentic' }],
      }),
    }
    expect(localizeTree(config, 'en')).toEqual({ guarantees: [{ label: 'Authentic' }] })
  })

  it('ne modifie pas le manifest source', () => {
    const config = { copy: { tagline: t({ fr: 'Montres', en: 'Watches' }) } }
    localizeTree(config, 'en')
    expect(isI18nValue(config.copy.tagline)).toBe(true)
  })

  it('préserve le partage de références et supporte les cycles', () => {
    const shared = { label: t({ fr: 'Partagé', en: 'Shared' }) }
    const config = { a: shared, b: shared }
    const out = localizeTree(config, 'en')
    expect(out.a).toBe(out.b)

    const cyclic = { name: t({ fr: 'Boucle', en: 'Loop' }) }
    cyclic.self = cyclic
    const localized = localizeTree(cyclic, 'en')
    expect(localized.name).toBe('Loop')
    expect(localized.self).toBe(localized)
  })
})

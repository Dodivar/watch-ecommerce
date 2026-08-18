/**
 * Le backend est monolingue : il travaille sur la langue par défaut du site.
 *
 * `normalize.js` filtre par exemple les modes de livraison sur la seule véracité de `label`
 * (`m && m.id && m.type && m.label`) : un texte `t({ fr, en, de })` non aplati est un objet,
 * donc véridique, et finirait tel quel dans un e-mail ou un PDF de commande. Ce test verrouille
 * l'aplatissement fait par `registry.js` avant `normalizeSiteConfig`.
 */
import { describe, expect, it } from 'vitest'

import { localizeTree } from '../../packages/base/src/site/i18nValue.js'
import { t } from '../../packages/base/src/site/i18nValue.js'
import { resolveI18nConfig } from '../../packages/base/src/site/resolveI18nConfig.js'

const { normalizeSiteConfig } = await import('../../backend/sites/normalize.js')

/** Reproduit ce que fait `backend/sites/registry.js#loadSiteConfig`. */
function loadLikeRegistry(rawConfig) {
  const { defaultLocale } = resolveI18nConfig(rawConfig)
  return normalizeSiteConfig(localizeTree(rawConfig, defaultLocale, defaultLocale))
}

const rawConfig = {
  siteId: 'acme-watches',
  locale: 'fr',
  i18n: { enabled: true, defaultLocale: 'fr', locales: ['fr', 'en', 'de'] },
  brand: { legalName: 'Acme SARL', displayName: 'Acme Watches' },
  contact: { email: 'contact@acme.test' },
  legal: { companyName: 'Acme SARL' },
  urls: { production: 'https://acme.test' },
  copy: {
    copyrightLine: t({ fr: '© 2026 Acme', en: '© 2026 Acme Ltd', de: '© 2026 Acme GmbH' }),
  },
  checkout: {
    currency: 'EUR',
    shipping: {
      methods: [
        {
          id: 'standard',
          type: 'shipping',
          price: 900,
          label: t({ fr: 'Livraison standard', en: 'Standard delivery', de: 'Standardversand' }),
        },
      ],
    },
  },
}

describe('manifest client côté backend', () => {
  it('aplatit les textes traduits avant la normalisation', () => {
    // `backend/orders/receiptBranding.js` lit précisément `raw.copy?.copyrightLine`.
    const site = loadLikeRegistry(rawConfig)
    expect(site.raw.copy.copyrightLine).toBe('© 2026 Acme')
  })

  it('conserve un libellé de livraison exploitable (chaîne, pas objet)', () => {
    const site = loadLikeRegistry(rawConfig)
    const [method] = site.checkout.shipping.methods
    expect(method.label).toBe('Livraison standard')
  })

  it('ne laisse survivre aucun objet de traduction dans le manifest normalisé', () => {
    const site = loadLikeRegistry(rawConfig)
    const markers = []
    const walk = (node, trail) => {
      if (Array.isArray(node)) return node.forEach((item, i) => walk(item, `${trail}[${i}]`))
      if (node && typeof node === 'object') {
        const keys = Object.keys(node)
        // Un objet dont toutes les clés sont des codes langue trahit un t() non aplati.
        if (keys.length > 0 && keys.every((k) => ['fr', 'en', 'de'].includes(k))) {
          markers.push(trail)
          return
        }
        return Object.entries(node).forEach(([k, v]) => walk(v, `${trail}.${k}`))
      }
    }
    walk(site.raw, 'raw')
    expect(markers).toEqual([])
  })

  it('laisse intact un manifest monolingue', () => {
    const monolingual = { ...rawConfig, i18n: undefined, copy: { copyrightLine: '© 2026 Acme' } }
    expect(loadLikeRegistry(monolingual).raw.copy.copyrightLine).toBe('© 2026 Acme')
  })
})

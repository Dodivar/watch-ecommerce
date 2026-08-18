/**
 * Test pivot de la stratégie de préfixe de langue.
 *
 * Toute l’approche repose sur un contrat de vue-router 4 : `createWebHistory('/en/')` retire
 * la base des URLs entrantes (donc la table de routes reste identique dans les trois langues)
 * et la remet sur chaque lien résolu (donc les `RouterLink` existants se préfixent seuls).
 * Si ce test tombe, c’est la stratégie qu’il faut revoir, pas le test.
 *
 * @vitest-environment happy-dom
 */
import { describe, expect, it } from 'vitest'
import { createApp, h } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'

import { localeHistoryBase } from './localePaths.js'

const Stub = { template: '<div />' }

const ROUTES = [
  { path: '/', component: Stub },
  { path: '/collection', component: Stub },
  { path: '/collection/:brandSlug', component: Stub },
  { path: '/montre/:slug', component: Stub },
  { path: '/admin/orders', component: Stub },
]

const i18n = { enabled: true, defaultLocale: 'fr', locales: ['fr', 'en', 'de'] }

/** La navigation initiale ne démarre qu’une fois le routeur installé sur une application. */
async function mountAt(pathname, locale) {
  window.history.replaceState({}, '', pathname)
  const router = makeRouter(locale)
  const app = createApp({ render: () => h('div') })
  app.use(router)
  app.mount(document.createElement('div'))
  await router.isReady()
  return router
}

function makeRouter(locale) {
  return createRouter({
    history: createWebHistory(localeHistoryBase(locale, i18n)),
    routes: ROUTES,
  })
}

describe('base d’historique préfixée par la langue', () => {
  it('préfixe les href résolus — les RouterLink existants suivent sans modification', () => {
    const router = makeRouter('en')
    expect(router.resolve('/collection').href).toBe('/en/collection')
    expect(router.resolve('/montre/rolex-submariner').href).toBe('/en/montre/rolex-submariner')
    expect(router.resolve('/').href).toBe('/en/')
  })

  it('laisse `path` dépréfixé — la table de routes et les gardes restent inchangées', () => {
    const router = makeRouter('de')
    const resolved = router.resolve('/collection/rolex')
    expect(resolved.path).toBe('/collection/rolex')
    expect(resolved.params.brandSlug).toBe('rolex')
    expect(resolved.matched).toHaveLength(1)
  })

  it('conserve query et hash dans le href préfixé', () => {
    const router = makeRouter('de')
    expect(router.resolve('/collection?page=2#top').href).toBe('/de/collection?page=2#top')
  })

  it('n’altère rien pour la langue par défaut', () => {
    const router = makeRouter('fr')
    expect(router.resolve('/collection').href).toBe('/collection')
    expect(router.resolve('/collection').path).toBe('/collection')
  })

  it('fait correspondre une URL entrante préfixée à la route dépréfixée', async () => {
    const router = await mountAt('/de/collection', 'de')
    expect(router.currentRoute.value.path).toBe('/collection')
    // `fullPath` est dépréfixé lui aussi : d’où le besoin de `localizedUrl()` pour les canoniques.
    expect(router.currentRoute.value.fullPath).toBe('/collection')
  })

  it('résout la racine préfixée vers « / »', async () => {
    const router = await mountAt('/en', 'en')
    expect(router.currentRoute.value.path).toBe('/')
  })
})

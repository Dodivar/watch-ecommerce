/** Métadonnées de routes (path + feature) sans import de composants Vue. */

import { isRouteActiveForFeatures } from './routeFeatures.js'

export const APP_ROUTE_META = [
  { path: '/maintenance' },
  { path: '/' },
  { path: '/merci', feature: 'merci' },
  { path: '/recherche', feature: 'recherche' },
  { path: '/estimation', feature: 'estimation' },
  { path: '/estimation/processus', feature: 'estimationProcess' },
  { path: '/collection/recherche', feature: 'collection' },
  { path: '/collection/marques', feature: 'collection' },
  { path: '/collection', feature: 'collection' },
  { path: '/watch/:id', feature: 'collection' },
  { path: '/blog', feature: 'blog' },
  { path: '/blog/:id', feature: 'blog' },
  { path: '/a-propos', feature: 'about' },
  { path: '/services', feature: 'servicesPage' },
  { path: '/guide-horloger', feature: 'guidePage' },
  { path: '/contact', feature: 'contact' },
  { path: '/faq', feature: 'faq' },
  { path: '/politique-confidentialite', feature: 'legal' },
  { path: '/mentions-legales', feature: 'legal' },
  { path: '/conditions-generales-utilisation', feature: 'legal' },
  { path: '/checkout', feature: 'purchase' },
  { path: '/commande/succes', feature: 'paymentReturn' },
  { path: '/commande/annulee', feature: 'paymentReturn' },
  { path: '/paiement-succes' },
  { path: '/paiement-annule' },
  { path: '/admin/login', feature: 'admin' },
  { path: '/admin', feature: 'admin' },
  { path: '/admin/watches/new', feature: 'admin' },
  { path: '/admin/watches/:id/edit', feature: 'admin' },
  { path: '/admin/watches/stats', feature: 'admin' },
  { path: '/admin/orders', feature: 'admin' },
  { path: '/admin/orders/:id', feature: 'admin' },
  { path: '/admin/leads', feature: 'admin' },
  { path: '/admin/leads/:id', feature: 'admin' },
  { path: '/admin/promo', feature: 'admin' },
  { path: '/admin/promo/new', feature: 'admin' },
  { path: '/admin/promo/:id/edit', feature: 'admin' },
  { path: '/admin/home-featured', feature: 'admin' },
  { path: '/admin/users', feature: 'admin' },
  { path: '/admin/articles', feature: 'admin', requiresFeatures: ['blog'] },
  { path: '/admin/articles/new', feature: 'admin', requiresFeatures: ['blog'] },
  { path: '/admin/articles/generate', feature: 'admin', requiresFeatures: ['blog'] },
  { path: '/admin/articles/:id/edit', feature: 'admin', requiresFeatures: ['blog'] },
  { path: '/:pathMatch(.*)*' },
]

/**
 * Chemins de routes actives pour le jeu de features donné.
 * @param {Record<string, boolean>} features
 * @returns {string[]}
 */
export function getActiveRoutePaths(features) {
  return APP_ROUTE_META.filter((def) => isRouteActiveForFeatures(def, features)).map(
    (def) => def.path,
  )
}

/** Métadonnées de routes (path + feature) sans import de composants Vue. */

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
  { path: '/contact', feature: 'contact' },
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
  { path: '/admin/articles', feature: 'admin' },
  { path: '/admin/articles/new', feature: 'admin' },
  { path: '/admin/articles/generate', feature: 'admin' },
  { path: '/admin/articles/:id/edit', feature: 'admin' },
  { path: '/:pathMatch(.*)*' },
]

/**
 * Chemins de routes actives pour le jeu de features donné.
 * @param {Record<string, boolean>} features
 * @returns {string[]}
 */
export function getActiveRoutePaths(features) {
  return APP_ROUTE_META.filter((def) => !def.feature || features[def.feature]).map(
    (def) => def.path,
  )
}

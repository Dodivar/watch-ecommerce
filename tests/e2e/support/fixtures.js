/**
 * Données de test partagées pour le tunnel d'achat.
 *
 * Le même produit sert à la fois à amorcer le panier (localStorage) et à
 * répondre côté « backend commandes » simulé, pour garder des montants
 * cohérents de bout en bout.
 */

/** Site ciblé par les tests e2e (SITE_ID par défaut du dev Vite). */
export const SITE_ID = 'sauvage-watches'

/** Clé localStorage du panier (voir composables/useCart.js). */
export const CART_STORAGE_KEY = `watch_cart:${SITE_ID}`

/** Clé localStorage du contournement de la page de maintenance. */
export const MAINTENANCE_KEY = `maintenance_authenticated_${SITE_ID}`

/** Un produit de démonstration : 3 490,00 €. */
export const SAMPLE_WATCH = {
  watchId: 'e2e-watch-001',
  name: 'Sauvage Héritage Automatique',
  reference: 'SVG-HER-001',
  price: 3490, // euros (format panier)
  imageUrl: null,
  quantity: 1,
}

/** Ligne panier telle que persistée par useCart. */
export function cartLineFromWatch(watch = SAMPLE_WATCH) {
  return {
    watchId: watch.watchId,
    name: watch.name,
    reference: watch.reference,
    price: watch.price,
    imageUrl: watch.imageUrl ?? null,
    quantity: watch.quantity ?? 1,
  }
}

/** Catalogue indexé par watchId pour le backend simulé (prix en centimes). */
export function catalogFromWatches(watches = [SAMPLE_WATCH]) {
  const catalog = {}
  for (const w of watches) {
    catalog[w.watchId] = {
      watchId: w.watchId,
      name: w.name,
      reference: w.reference,
      unitPriceCents: Math.round(w.price * 100),
      imageUrl: w.imageUrl ?? null,
    }
  }
  return catalog
}

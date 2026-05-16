/**
 * Drapeaux par site (`site.config.js` → `features`) pour activer ou non les routes
 * et les entrées de navigation. Les clés absentes du manifest client héritent
 * de DEFAULT_SITE_FEATURES.
 */
export const DEFAULT_SITE_FEATURES = {
  collection: true,
  blog: true,
  recherche: true,
  estimation: true,
  estimationProcess: true,
  merci: true,
  about: true,
  /** Page dédiée `/contact` (formulaire + récapitulatif des coordonnées). */
  contact: true,
  legal: true,
  /** Section #faq sur l’accueil et lien « FAQ » — activé si `site.config` exporte `faq` avec entrées (voir getSiteConfig). */
  faq: false,
  /** Boutons « Acheter » et flux Stripe Checkout sur les fiches montre. */
  purchase: true,
  paymentReturn: true,
  admin: true,
  /**
   * Panier : permettre plusieurs exemplaires d’une même montre (quantité + / − dans le tiroir).
   * Nécessite que le flux checkout envoie `lines` avec quantités (voir `createCheckoutSessionFromCart`).
   */
  cartMultiQuantity: false,
}

export function mergeSiteFeatures(partial = {}) {
  const merged = { ...DEFAULT_SITE_FEATURES, ...partial }
  if (!merged.estimation) {
    merged.estimationProcess = false
  }
  return merged
}

/** Cible de secours après paiement ou liens « retour boutique » si la collection est off. */
export function getBrowsePath(features) {
  return features.collection ? '/collection' : '/'
}

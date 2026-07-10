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
  /** Page dédiée `/services` (contenu `servicesPage` dans le manifest client). */
  servicesPage: false,
  /** Page dédiée `/guide-horloger` (contenu `guidePage` dans le manifest client). */
  guidePage: false,
  legal: true,
  /** Section #faq sur l’accueil, page `/faq` et lien « FAQ » — activé si `site.config` exporte `faq` avec entrées (voir getSiteConfig). */
  faq: false,
  /** Boutons « Acheter » et flux Stripe Checkout sur les fiches montre. */
  purchase: true,
  paymentReturn: true,
  admin: true,
  /**
   * Panier : permettre plusieurs exemplaires d’une même montre (quantité + / − dans le tiroir).
   * Nécessite que le flux checkout envoie `lines` avec quantités (voir `orderService.createOrder`).
   */
  cartMultiQuantity: false,
  /**
   * Carrousel d'images pleine largeur en tête de page d'accueil (Supabase Storage + admin).
   */
  homeCarousel: false,
  /**
   * Carrousel « nouveautés » sur l'accueil — dérivé de `home.sections` contenant `nouvelles` (voir resolveSiteConfig).
   */
  homeNouvelles: false,
  /**
   * Afficher la référence montre sur les cartes catalogue et fiches produit.
   * Dérivé de `watchCatalog.mode === 'resale'` dans getSiteConfig() — ne pas surcharger sauf cas exceptionnel.
   */
  watchReference: false,
  /** Campagnes promotionnelles groupées dans l'admin (événements soldes, etc.). */
  adminWatchPromotions: false,
  /**
   * Archive publique des montres vendues : page `/ventes`, fiches montre
   * consultables après la vente (badge « Vendue », CTA recherche personnalisée).
   * Preuve sociale + SEO. Nécessite `collection` (désactivé sinon).
   */
  soldArchive: false,
  /**
   * Newsletter : gestion des abonnés, composition et envoi de campagnes email
   * depuis l'admin (+ formulaire d'inscription vitrine). Nécessite la migration
   * `20260701120000_newsletter.sql` et Mailjet configuré.
   */
  newsletter: false,
}

export function mergeSiteFeatures(partial = {}) {
  const merged = { ...DEFAULT_SITE_FEATURES, ...partial }
  if (!merged.estimation) {
    merged.estimationProcess = false
  }
  if (!merged.collection) {
    merged.soldArchive = false
  }
  return merged
}

/** Cible de secours après paiement ou liens « retour boutique » si la collection est off. */
export function getBrowsePath(features) {
  return features.collection ? '/collection' : '/'
}

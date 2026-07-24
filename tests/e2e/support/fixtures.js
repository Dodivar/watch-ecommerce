/**
 * Données de test partagées pour le tunnel d'achat.
 *
 * Le même produit sert à la fois à amorcer le panier (localStorage) et à
 * répondre côté « backend commandes » simulé, pour garder des montants
 * cohérents de bout en bout.
 */

/** Site ciblé par défaut (SITE_ID par défaut du dev Vite). */
export const SITE_ID = 'sauvage-watches'

/** Clé localStorage du panier pour un site (voir composables/useCart.js). */
export function cartStorageKey(siteId = SITE_ID) {
  return `watch_cart:${siteId}`
}

/** Clé localStorage du contournement de la page de maintenance. */
export function maintenanceKey(siteId = SITE_ID) {
  return `maintenance_authenticated_${siteId}`
}

/** Clé localStorage du panier (site par défaut). */
export const CART_STORAGE_KEY = cartStorageKey()

/** Clé localStorage du contournement de la page de maintenance (site par défaut). */
export const MAINTENANCE_KEY = maintenanceKey()

/** Un produit de démonstration : 3 490,00 €. */
export const SAMPLE_WATCH = {
  watchId: 'e2e-watch-001',
  name: 'Sauvage Héritage Automatique',
  reference: 'SVG-HER-001',
  price: 3490, // euros (format panier)
  imageUrl: null,
  quantity: 1,
}

/**
 * Deuxième produit : 5 200,00 €. Slug distinct pour cohabiter avec
 * `SAMPLE_WATCH` dans un même catalogue (résolution de slug par le service).
 */
export const SECOND_WATCH = {
  watchId: 'e2e-watch-002',
  name: 'Sauvage Explorateur Chronographe',
  reference: 'SVG-EXP-002',
  price: 5200,
  slug: 'sauvage-explorateur-chronographe',
  brand: 'Sauvage',
  model: 'Explorateur',
  imageUrl: null,
  quantity: 1,
}

/**
 * Montre déjà vendue (`is_sold`) : sa fiche reste consultable en archive
 * (`features.soldArchive`) mais l'achat est impossible — garde anti-survente.
 */
export const SOLD_WATCH = {
  watchId: 'e2e-watch-sold',
  name: 'Sauvage Vintage Or 1968',
  reference: 'SVG-VNT-1968',
  price: 8900,
  slug: 'sauvage-vintage-or-1968',
  brand: 'Sauvage',
  model: 'Vintage',
  isSold: true,
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

/** Slug canonique de la fiche produit de démonstration (/montre/:slug). */
export const SAMPLE_WATCH_SLUG = 'sauvage-heritage-automatique'

/** Image inline (data URI 1x1) — évite tout appel réseau pour les visuels. */
const INLINE_IMAGE =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

/** Ligne table `watches` telle que renvoyée par PostgREST. */
export function watchDbRow(watch = SAMPLE_WATCH) {
  return {
    id: watch.watchId,
    slug: watch.slug || SAMPLE_WATCH_SLUG,
    ad_code: watch.adCode ?? null,
    name: watch.name,
    brand: watch.brand || 'Sauvage',
    model: watch.model || 'Héritage',
    reference: watch.reference,
    price: watch.price,
    promotion_price: null,
    discount_percent: null,
    year: 2024,
    condition: 'Excellent état',
    description: 'Montre automatique de démonstration pour les tests e2e.',
    is_available: watch.isAvailable ?? true,
    is_sold: watch.isSold ?? false,
    stock_quantity: null,
    sale_date: null,
    display_order: 10,
    audience: 'unisexe',
    created_at: '2026-01-01T00:00:00.000Z',
  }
}

/** Ligne table `watch_details`. */
export function watchDetailsDbRow(watch = SAMPLE_WATCH) {
  return {
    watch_id: watch.watchId,
    content: 'Pièce d’exception révisée par nos horlogers.',
    movement: 'Automatique',
    case_material: 'Acier 316L',
    bracelet_materials: ['Cuir'],
    bracelet_material: 'Cuir',
    bracelet_colors: ['Marron'],
    case_size: '40',
    thickness: '11 mm',
    dial_color: 'Noir',
    crystal: 'Saphir',
    water_resistance: '50 m',
    functions: 'Heures, minutes, secondes',
    power_reserve: '42 h',
    frequency: '28 800 A/h',
    case_condition: 'Très bon',
    dial_condition: 'Impeccable',
  }
}

/** Lignes table `watch_images`. */
export function watchImagesDbRows(watch = SAMPLE_WATCH) {
  return [
    { watch_id: watch.watchId, image_url: INLINE_IMAGE, image_path: null, image_order: 0 },
  ]
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

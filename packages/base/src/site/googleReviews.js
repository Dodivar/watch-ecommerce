/**
 * Avis Google d'une fiche d'établissement — résolution du bloc `googleReviews` du manifest.
 *
 * Le pendant backend vit dans `backend/sites/normalize.js` (`normalizeGoogleReviews`) : les deux
 * doivent rester alignés, comme `utils/googleMapsLinks.js` l'est avec `backend/utils/`.
 */

// Chemin relatif : atteint par `api/sitemap.js` via `resolveSiteConfig` (voir plus bas).
import { buildGoogleMapsPlaceUrl } from '../utils/googleMapsLinks.js'

/** Plafond dur de l'API Places (New) : une fiche ne renvoie jamais plus de 5 avis. */
export const MAX_GOOGLE_REVIEWS = 5

/** Préfixe des liens de recherche Maps que `buildGoogleMapsPlaceUrl` construit faute d'URL. */
const MAPS_SEARCH_PREFIX = 'https://www.google.com/maps/search/'

/**
 * @param {unknown} value
 * @returns {string}
 */
function trimmedString(value) {
  return typeof value === 'string' ? value.trim() : ''
}

/**
 * Valide et normalise `googleReviews` depuis le manifest client.
 *
 * `enabled` n'est vrai qu'avec un `placeId` renseigné : un manifest livré avec le placeholder
 * vide laisse la section éteinte, sans rien changer au rendu existant.
 *
 * @param {Record<string, unknown>} siteConfig
 * @returns {{ enabled: boolean, placeId: string, maxReviews: number, profileUrl: string }}
 */
export function resolveGoogleReviewsConfig(siteConfig) {
  const raw = siteConfig?.googleReviews
  const cfg = raw && typeof raw === 'object' ? raw : {}

  const placeId = trimmedString(cfg.placeId)
  const parsedMax = Number(cfg.maxReviews)
  const maxReviews =
    Number.isFinite(parsedMax) && parsedMax > 0
      ? Math.min(Math.floor(parsedMax), MAX_GOOGLE_REVIEWS)
      : MAX_GOOGLE_REVIEWS

  // Lien de repli vers la fiche tant que l'API n'a pas renvoyé son `googleMapsUri` : URL
  // explicite du manifest, sinon celle de la carte boutique, sinon une recherche sur le placeId.
  const profileUrl =
    buildGoogleMapsPlaceUrl({
      url: trimmedString(cfg.profileUrl) || trimmedString(siteConfig?.storeMap?.googleMapsUrl),
      placeId,
    }) || ''

  return {
    enabled: cfg.enabled !== false && placeId.length > 0,
    placeId,
    maxReviews,
    profileUrl,
  }
}

/**
 * URL de la fiche Google Business **déclarée** par le manifest (`googleReviews.profileUrl`, sinon
 * `storeMap.googleMapsUrl`), pour le `sameAs` du JSON-LD : c'est ce lien qui aide Google à
 * rattacher le site à sa fiche d'établissement.
 *
 * Le lien de repli de `resolveGoogleReviewsConfig` — une recherche Maps sur le placeId — est
 * écarté : il mène bien à la fiche pour un visiteur, mais ce n'est pas l'adresse de la fiche.
 * Accepte indifféremment le manifest brut ou résolu (`resolveSiteConfig` remplace
 * `googleReviews` par sa forme résolue, où ce repli a pu être écrit dans `profileUrl`).
 *
 * @param {Record<string, any>} siteConfig
 * @returns {string} URL, ou chaîne vide.
 */
export function resolveGoogleBusinessProfileUrl(siteConfig) {
  const url =
    trimmedString(siteConfig?.googleReviews?.profileUrl) ||
    trimmedString(siteConfig?.storeMap?.googleMapsUrl)
  return url && !url.startsWith(MAPS_SEARCH_PREFIX) ? url : ''
}

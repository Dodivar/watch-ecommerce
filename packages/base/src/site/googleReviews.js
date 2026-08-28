/**
 * Avis Google d'une fiche d'établissement — résolution du bloc `googleReviews` du manifest.
 *
 * Le pendant backend vit dans `backend/sites/normalize.js` (`normalizeGoogleReviews`) : les deux
 * doivent rester alignés, comme `utils/googleMapsLinks.js` l'est avec `backend/utils/`.
 */

import { buildGoogleMapsPlaceUrl } from '@/utils/googleMapsLinks.js'

/** Plafond dur de l'API Places (New) : une fiche ne renvoie jamais plus de 5 avis. */
export const MAX_GOOGLE_REVIEWS = 5

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

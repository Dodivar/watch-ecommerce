/**
 * Lecture des avis Google via le backend Express (`GET /api/reviews`).
 *
 * Le navigateur n'appelle jamais Google directement : la clé serveur et le cache partagé
 * vivent côté backend (voir `backend/routes/reviews.js`).
 */

import { getBackendApiUrl, readApiResponseBody } from '@/services/backendApiUrl.js'

/**
 * @typedef {{
 *   id: string,
 *   rating: number,
 *   text: string,
 *   publishTime: string,
 *   relativeTime: string,
 *   authorName: string,
 *   authorPhotoUrl: string,
 *   authorUri: string,
 * }} GoogleReview
 */

/**
 * Récupère les avis de la fiche du site courant.
 *
 * Ne lève jamais : `getBackendApiUrl()` lève quand le backend n'est pas configuré au build, et
 * un avis manquant ne doit pas casser une page d'accueil. Tout échec renvoie `null`, et
 * l'appelant masque simplement la section.
 *
 * @param {{ locale?: string, signal?: AbortSignal }} [options]
 * @returns {Promise<{ rating: number|null, userRatingCount: number, googleMapsUri: string, reviews: GoogleReview[] } | null>}
 */
export async function fetchGoogleReviews(options = {}) {
  try {
    const query = options.locale ? `?lang=${encodeURIComponent(options.locale)}` : ''
    const response = await fetch(`${getBackendApiUrl()}/api/reviews${query}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: options.signal,
    })

    const body = await readApiResponseBody(response)
    if (!response.ok || !body?.success || !body?.data) {
      // `console.warn` et non `console.info` en DEV seulement : la section disparaît sans bruit
      // quand l'appel échoue, et une console muette laissait croire à un `placeId` mal renseigné
      // alors que la cause (503 « secret absent », 502 « Places injoignable ») est dans la réponse.
      console.warn('[Watch] Avis Google indisponibles :', body?.error || `HTTP ${response.status}`)
      return null
    }

    const data = body.data
    return {
      rating: typeof data.rating === 'number' ? data.rating : null,
      userRatingCount: typeof data.userRatingCount === 'number' ? data.userRatingCount : 0,
      googleMapsUri: typeof data.googleMapsUri === 'string' ? data.googleMapsUri : '',
      reviews: Array.isArray(data.reviews) ? data.reviews : [],
    }
  } catch (error) {
    if (error?.name === 'AbortError') return null
    console.warn('[Watch] Avis Google : appel impossible —', error?.message || error)
    return null
  }
}

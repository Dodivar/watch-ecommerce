/**
 * Inscription à la newsletter depuis la vitrine (formulaire public).
 */
import { getBackendApiUrl, readApiResponseBody } from './backendApiUrl.js'
import { getActiveLocale } from '@/i18n'

/** Site actif (build Vite) — cohérent avec emailService.js. */
const SITE_ID = import.meta.env.VITE_SITE_ID || 'sauvage-watches'

/**
 * @param {{ email: string, name?: string, website?: string }} input
 *   `website` est le pot de miel anti-bot du formulaire : vide pour un humain.
 * @returns {Promise<object>}
 */
export async function subscribeToNewsletter(input) {
  const apiUrl = getBackendApiUrl()
  const response = await fetch(`${apiUrl}/api/newsletter/subscribe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-Site-Id': SITE_ID,
    },
    body: JSON.stringify({
      email: input.email,
      name: input.name || undefined,
      website: input.website || undefined,
      // Le backend confirme aujourd'hui en français ; la langue voyage pour qu'il puisse changer.
      locale: getActiveLocale(),
    }),
  })

  const data = await readApiResponseBody(response)
  if (!response.ok || data.success === false) {
    throw new Error(data.error || data.message || "Échec de l'inscription")
  }
  return data
}

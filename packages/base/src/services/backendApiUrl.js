/**
 * URL du backend Express (formulaires, commandes, proxy n8n).
 * En prod : VITE_BACKEND_URL au build, ou backend.publicApiUrl dans le site.config.js du client.
 */

function normalizeBackendUrl(url) {
  if (!url || typeof url !== 'string') return ''
  return url.trim().replace(/\/+$/, '')
}

/**
 * @returns {string} Origine du backend sans slash final (ex. https://api.example.com)
 */
export function getBackendApiUrl() {
  if (!import.meta.env.PROD) {
    return 'http://localhost:3000'
  }

  const url = normalizeBackendUrl(import.meta.env.VITE_BACKEND_URL)
  if (!url) {
    throw new Error(
      'Backend non configuré : définissez VITE_BACKEND_URL au build (GitHub Actions → Variables du dépôt ou environnement github-pages) ou backend.publicApiUrl dans site.config.js, puis reconstruisez le site.',
    )
  }
  return url
}

/**
 * @param {Response} response
 * @returns {Promise<Record<string, unknown>>}
 */
export async function readApiResponseBody(response) {
  const contentType = response.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    return response.json()
  }
  const text = (await response.text()).trim()
  if (!text) return {}
  try {
    return JSON.parse(text)
  } catch {
    return { error: text }
  }
}

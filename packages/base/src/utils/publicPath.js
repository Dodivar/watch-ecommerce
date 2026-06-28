/**
 * Préfixe un asset du dossier `public/` avec le base path Vite (`import.meta.env.BASE_URL`).
 * GitHub Pages (projet) : `/watch-ecommerce/` ; local ou domaine racine : `/`.
 *
 * @param {string} path - Chemin depuis `public/` (avec ou sans `/` initial)
 * @returns {string}
 */
export function publicPath(path) {
  const base =
    (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) ||
    process.env.VITE_BASE_PATH ||
    '/'
  const trimmed = String(path || '').trim().replace(/^\//, '')
  return trimmed ? `${base}${trimmed}` : base
}

/**
 * Accès bas niveau à `gtag` / `dataLayer`.
 *
 * Le stub est créé indépendamment du chargement de `gtag.js` : les commandes poussées avant
 * (Consent Mode notamment) sont rejouées dans l’ordre dès que le vrai script prend la main.
 */

/**
 * Crée `window.dataLayer` et `window.gtag` s’ils n’existent pas encore.
 * @returns {((...args: unknown[]) => void) | null}
 */
export function ensureGtagStub() {
  if (typeof window === 'undefined') return null

  window.dataLayer = window.dataLayer || []
  if (typeof window.gtag !== 'function') {
    window.gtag = function gtag() {
      // `arguments` (et non un tableau) : gtag.js attend cet objet tel quel.
      window.dataLayer.push(arguments)
    }
  }
  return window.gtag
}

/**
 * Pousse une commande gtag sans jamais laisser remonter d’erreur : un bloqueur de publicité
 * ou une extension qui casse `gtag` ne doit pas interrompre le tunnel d’achat.
 * @param {...unknown} args
 */
export function pushGtag(...args) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return
  try {
    window.gtag(...args)
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn('[analytics] commande gtag ignorée', err)
    }
  }
}

/**
 * @param {string} name Nom de l’événement (GA4 ou Google Ads).
 * @param {Record<string, unknown>} [params]
 */
export function gtagEvent(name, params) {
  pushGtag('event', name, params || {})
}

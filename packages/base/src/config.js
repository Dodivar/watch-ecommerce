import { getActiveLocalePrefix, localizedPath } from './i18n/activeLocale.js'
import { getSiteConfig } from './site/getSiteConfig.js'

const site = getSiteConfig()

export const WHATSAPP_NUMBER = site.contact.whatsappE164
export const EMAIL_CONTACT = site.contact.email

/**
 * Identité publique du responsable du traitement (RGPD).
 * Renseigner VITE_PUBLIC_LEGAL_* dans l’environnement ou .env pour affichage sur les pages légales (politique de confidentialité, mentions légales).
 */
export const LEGAL_COMPANY_NAME = site.legal.companyName

export const LEGAL_ADDRESS = site.legal.address

export const LEGAL_SIRET = site.legal.siret

/**
 * Afficher la section d'achat (boutons « Acheter ») sur les fiches montre.
 * Combine `features.purchase` du manifest client (`site.config.js`) et `VITE_PURCHASE_ENABLED`
 * (désactive explicitement si la valeur est la chaîne `'false'`).
 */
export const PURCHASE_ENABLED =
  site.features.purchase !== false && import.meta.env.VITE_PURCHASE_ENABLED !== 'false'

/** Clé publique Stripe (Payment Element) — `VITE_STRIPE_PUBLISHABLE_KEY` par déploiement. */
export const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || ''

/** Clé Google Maps / Places (carte boutique + autocomplétion checkout) — `VITE_GOOGLE_PLACES_API_KEY` par déploiement. */
export const GOOGLE_PLACES_API_KEY = import.meta.env.VITE_GOOGLE_PLACES_API_KEY || ''

/**
 * Mesure et attribution. Tous optionnels : une valeur vide désactive proprement la
 * destination correspondante (voir `packages/base/src/services/analytics/`).
 */

/** GA4 — `VITE_GA_ID`, ex. `G-XXXXXXXXXX`. */
export const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_ID || ''

/** Google Ads — `VITE_GOOGLE_ADS_ID`, ex. `AW-123456789`. Partage le script gtag.js de GA4. */
export const GOOGLE_ADS_ID = import.meta.env.VITE_GOOGLE_ADS_ID || ''

/**
 * Libellé de l'action de conversion « achat » dans Google Ads — `VITE_GOOGLE_ADS_PURCHASE_LABEL`.
 * Sans lui, aucune conversion n'est remontée même si `GOOGLE_ADS_ID` est renseigné : le
 * `send_to` d'une conversion s'écrit `AW-123456789/AbC-D_efGh12`.
 */
export const GOOGLE_ADS_PURCHASE_LABEL = import.meta.env.VITE_GOOGLE_ADS_PURCHASE_LABEL || ''

/** Meta (Facebook / Instagram) — `VITE_META_PIXEL_ID`, identifiant numérique du pixel. */
export const META_PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID || ''

const urlProduction = site.urls.production
const urlStaging = site.urls.staging
const urlDevelopment = site.urls.development
const previewFallbackHost = site.urls.previewFallbackHost

// Détection automatique de l'URL de base selon l'environnement
function getBaseUrl() {
  // Si VITE_BASE_URL est défini explicitement, l'utiliser (priorité)
  if (import.meta.env.VITE_BASE_URL) {
    return import.meta.env.VITE_BASE_URL
  }

  // En production Vercel (branche main)
  if (import.meta.env.VERCEL_ENV === 'production') {
    return urlProduction
  }

  // En preview/staging Vercel (branche staging ou autres previews)
  if (import.meta.env.VERCEL_ENV === 'preview' || import.meta.env.VERCEL_URL) {
    // Si on est sur le domaine de staging, utiliser l'URL de recette
    if (
      import.meta.env.VERCEL_URL?.includes('recette') ||
      (typeof window !== 'undefined' && window.location.hostname.includes('recette'))
    ) {
      return urlStaging
    }
    // Sinon, utiliser l'URL Vercel preview
    return `https://${import.meta.env.VERCEL_URL || previewFallbackHost}`
  }

  // En développement local
  if (import.meta.env.MODE === 'development' || import.meta.env.DEV) {
    return urlDevelopment
  }

  // Par défaut : production
  return urlProduction
}

export const BASE_URL = getBaseUrl()

/**
 * Origine de la page **dans la langue active** : `https://…` ou `https://…/en`.
 *
 * À utiliser pour tout ce qui désigne la page courante — `canonical`, `og:url`, fil d'Ariane,
 * `url` d'un produit en JSON-LD — car `route.fullPath` est dépréfixé par la base d'historique
 * vue-router et perdrait la langue.
 *
 * `BASE_URL` reste l'origine nue : les ressources (logo, images) et l'URL de l'organisation
 * ne doivent surtout pas être préfixées.
 */
export const CANONICAL_BASE_URL = `${BASE_URL}${getActiveLocalePrefix()}`

/**
 * URL absolue d'un chemin applicatif, dans une langue donnée (langue active par défaut).
 * Sert aux alternates `hreflang` et au sélecteur de langue.
 *
 * @param {string} path Chemin dépréfixé, tel que le rend `route.fullPath`.
 * @param {string} [locale]
 * @returns {string}
 */
export function localizedUrl(path, locale) {
  const localized = localizedPath(path || '/', locale)
  return `${BASE_URL}${localized === '/' ? '' : localized}`
}

export { getSiteConfig } from './site/getSiteConfig.js'

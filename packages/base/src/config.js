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

export { getSiteConfig } from './site/getSiteConfig.js'

import { getSiteConfig } from '@/site/getSiteConfig.js'

/**
 * Identifiant site actif (build Vite / manifest).
 * @returns {string}
 */
export function getAdminSiteId() {
  return getSiteConfig().siteId
}

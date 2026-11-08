/**
 * Tête d'une page statique : titre, description, Open Graph et canonique.
 *
 * Le bloc `seo.<section>` du manifest prime ; c'est aussi lui que le pré-rendu écrit dans le HTML
 * servi (`site/staticRouteHead.js`). Sans bloc, la page prend `fallbackTitle` suivi du nom de la
 * marque : un titre propre à la route plutôt que celui de l'accueil, qu'elle héritait jusque-là
 * — et que Google ne peut pas proposer en lien annexe (sitelink) puisqu'il double l'accueil.
 */

import { useHead } from '@vueuse/head'

import { CANONICAL_BASE_URL } from '@/config'
import { getSiteConfig } from '@/site/getSiteConfig.js'

/**
 * @param {object} input
 * @param {string} input.path Chemin dépréfixé de la route (`/rachat`).
 * @param {string} input.section Clé du bloc `seo` du manifest.
 * @param {string} input.fallbackTitle Libellé de la page, sans la marque.
 * @param {string} [input.fallbackDescription]
 */
export function useStaticPageHead({ path, section, fallbackTitle, fallbackDescription = '' }) {
  const site = getSiteConfig()
  const block = site.seo?.[section] ?? null
  const brand = site.brand?.displayName || site.brand?.legalName || ''

  const title = block?.title ?? (brand ? `${fallbackTitle} — ${brand}` : fallbackTitle)
  const description = block?.metaDescription ?? fallbackDescription
  const ogTitle = block?.ogTitle ?? title
  const ogDescription = block?.ogDescription ?? description
  const url = `${CANONICAL_BASE_URL}${path}`

  const meta = [
    { property: 'og:title', content: ogTitle },
    { property: 'og:url', content: url },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: block?.twitterTitle ?? ogTitle },
  ]
  // Une description vide écraserait celle de la coquille par rien : mieux vaut la garder.
  if (description) {
    meta.unshift({ name: 'description', content: description })
    meta.push(
      { property: 'og:description', content: ogDescription },
      { name: 'twitter:description', content: block?.twitterDescription ?? ogDescription },
    )
  }

  useHead({ title, meta, link: [{ rel: 'canonical', href: url }] })
}

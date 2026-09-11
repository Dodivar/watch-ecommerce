/**
 * Métadonnées de tête des routes statiques, pour le pré-rendu.
 *
 * Le pré-rendu (`scripts/prerender-static-routes.mjs`) recopiait la coquille d'accueil dans
 * `dist/contact/`, `dist/faq/`… : chaque page servait donc le titre, la description **et la
 * canonique** de l'accueil. Google exécute le JS et corrige au rendu ; les robots sociaux
 * (Facebook, LinkedIn, WhatsApp, Slack) ne l'exécutent pas et s'arrêtent à ce HTML.
 *
 * Deux niveaux de correction, volontairement distincts :
 *
 * 1. La **canonique** et `og:url` se déduisent de la route seule. Ils sont donc toujours justes,
 *    quelle que soit la vitrine — c'est la partie qui nuisait réellement au référencement.
 * 2. Le **titre et la description** viennent du bloc `seo.<section>` du manifest, quand la route
 *    en a un. Sinon on garde ceux de la coquille (`seo.indexHtml`), comme aujourd'hui.
 *
 * La table ci-dessous reproduit le bloc que lit chaque composant de page. C'est une duplication
 * assumée : les composants lisent leur bloc au runtime, ce module au build. `staticRouteHead.test.js`
 * vérifie que la table ne référence que des sections réellement présentes dans les manifests.
 */

import { withLocalePrefix } from '../i18n/localePaths.js'

/**
 * Route statique → section `seo` du manifest, telle que la lit le composant correspondant.
 * Une route absente de la table garde la copie de la coquille.
 */
export const STATIC_ROUTE_SEO_SECTIONS = {
  '': 'home',
  '/collection': 'collection',
  '/collection/marques': 'brandsIndex',
  '/ventes': 'soldArchive',
  '/blog': 'blog',
  '/coup-de-foudre': 'matchmaking',
  '/a-propos': 'aPropos',
  '/faq': 'faq',
  '/services': 'servicesPage',
  '/guide-horloger': 'guidePage',
  '/politique-confidentialite': 'politique',
  '/mentions-legales': 'mentions',
  '/conditions-generales-utilisation': 'cgu',
}

/**
 * Routes statiques listées au sitemap dont aucun composant ne pose de `useHead`, et qu'aucun
 * bloc `seo` ne décrit : elles héritent donc de la copie de l'accueil, au pré-rendu **comme**
 * au rendu. Leur canonique est corrigée ici, mais leur titre reste à écrire côté manifest.
 *
 * Documenté plutôt que corrigé en silence : rédiger ces textes relève du client.
 */
export const STATIC_ROUTES_WITHOUT_OWN_COPY = [
  '/contact',
  '/recherche',
  '/estimation',
  '/estimation/processus',
]

/**
 * URL absolue et canonique d'une route statique dans une langue.
 *
 * @param {string} baseUrl Origine, sans slash final.
 * @param {string} routePath Chemin dépréfixé (`''` pour l'accueil).
 * @param {string} locale
 * @param {{ enabled: boolean, locales: string[], defaultLocale: string }} i18n
 * @returns {string}
 */
export function buildStaticRouteUrl(baseUrl, routePath, locale, i18n) {
  const localized = withLocalePrefix(routePath || '/', locale, i18n)
  // `withLocalePrefix` rend « / » pour la racine ; la canonique la veut sans slash final,
  // comme la coquille et le sitemap.
  return `${baseUrl}${localized === '/' ? '' : localized}`
}

/**
 * @param {object} input
 * @param {Record<string, any>} input.siteConfig Manifest **déjà aplati** dans la langue voulue.
 * @param {string} input.routePath
 * @param {string} input.locale
 * @param {{ enabled: boolean, locales: string[], defaultLocale: string }} input.i18n
 * @param {string} input.baseUrl
 * @returns {{ url: string, title: string, description: string, ogTitle: string,
 *   ogDescription: string, twitterTitle: string, twitterDescription: string, hasOwnCopy: boolean }}
 */
export function buildStaticRouteHead({ siteConfig, routePath, locale, i18n, baseUrl }) {
  const seo = siteConfig?.seo ?? {}
  const shell = seo.indexHtml ?? {}
  const section = STATIC_ROUTE_SEO_SECTIONS[routePath]
  const block = section ? seo[section] : null

  const url = buildStaticRouteUrl(baseUrl, routePath, locale, i18n)

  // Sans bloc dédié — route hors table, ou vitrine qui n'active pas la page — la coquille
  // reste la meilleure copie disponible ; seule l'URL est corrigée.
  if (!block) {
    return {
      url,
      title: shell.title ?? '',
      description: shell.metaDescription ?? '',
      ogTitle: shell.ogTitle ?? shell.title ?? '',
      ogDescription: shell.ogDescription ?? shell.metaDescription ?? '',
      twitterTitle: shell.twitterTitle ?? shell.ogTitle ?? shell.title ?? '',
      twitterDescription:
        shell.twitterDescription ?? shell.ogDescription ?? shell.metaDescription ?? '',
      hasOwnCopy: false,
    }
  }

  const title = block.title ?? shell.title ?? ''
  const description = block.metaDescription ?? shell.metaDescription ?? ''

  return {
    url,
    title,
    description,
    ogTitle: block.ogTitle ?? title,
    ogDescription: block.ogDescription ?? description,
    twitterTitle: block.twitterTitle ?? block.ogTitle ?? title,
    twitterDescription: block.twitterDescription ?? block.ogDescription ?? description,
    hasOwnCopy: true,
  }
}

function escapeHtmlAttr(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
}

function escapeHtmlText(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/**
 * Remplace la valeur d'une balise `<meta>` déjà présente. Une balise absente est laissée telle
 * quelle : la coquille est produite par `vite/site-from-config.mjs`, on ne réinvente pas ce
 * qu'elle n'a pas voulu émettre.
 *
 * @param {string} html
 * @param {'name' | 'property'} attr
 * @param {string} key
 * @param {string} value
 * @returns {string}
 */
export function replaceMetaContent(html, attr, key, value) {
  const pattern = new RegExp(`(<meta\\s+${attr}="${key}"\\s+content=")[^"]*(")`, 'i')
  return html.replace(pattern, `$1${escapeHtmlAttr(value)}$2`)
}

/**
 * Applique à une coquille les métadonnées d'une route.
 *
 * @param {string} html Coquille de la langue, telle que sortie du build.
 * @param {ReturnType<typeof buildStaticRouteHead>} head
 * @returns {string}
 */
export function applyStaticRouteHead(html, head) {
  let out = html.replace(/<title>[^<]*<\/title>/i, `<title>${escapeHtmlText(head.title)}</title>`)

  out = out.replace(
    /(<link\s+rel="canonical"\s+href=")[^"]*(")/i,
    `$1${escapeHtmlAttr(head.url)}$2`,
  )

  out = replaceMetaContent(out, 'name', 'description', head.description)
  out = replaceMetaContent(out, 'property', 'og:url', head.url)
  out = replaceMetaContent(out, 'property', 'og:title', head.ogTitle)
  out = replaceMetaContent(out, 'property', 'og:description', head.ogDescription)
  out = replaceMetaContent(out, 'name', 'twitter:url', head.url)
  out = replaceMetaContent(out, 'name', 'twitter:title', head.twitterTitle)
  out = replaceMetaContent(out, 'name', 'twitter:description', head.twitterDescription)

  return out
}

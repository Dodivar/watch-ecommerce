/**
 * Titre principal (`<h1>`) des pages publiques statiques, pour le pré-rendu.
 *
 * Le HTML servi aux robots avant exécution du JavaScript ne portait aucun `<h1>` : la coquille
 * pré-rendue n'a que la tête de page (`staticRouteHead.js`), le corps reste un `<div id="app">`
 * vide. `scripts/prerender-static-routes.mjs` y écrit désormais ce titre, que Vue remplace au
 * montage par la page complète.
 *
 * Chaque entrée reproduit **le texte que rend le composant de la page** (même clé de catalogue,
 * même champ du manifest) : le titre lu sans JavaScript est celui que le visiteur voit ensuite.
 * C'est la même duplication assumée que `STATIC_ROUTE_SEO_SECTIONS` ; `pageHeadings.test.js`
 * vérifie qu'aucune route statique n'en est dépourvue, pour chaque vitrine et chaque langue.
 */

import { isHomeHeroRenderable, resolveHomeHeroConfig } from './homeHero.js'

/**
 * @typedef {object} HeadingContext
 * @property {Record<string, any>} siteConfig Manifest **déjà aplati** dans la langue voulue.
 * @property {(key: string, params?: Record<string, unknown>) => string} t Traducteur de la langue.
 */

/** @param {unknown} value */
function text(value) {
  return typeof value === 'string' ? value.trim() : ''
}

/**
 * @param {Record<string, any>} siteConfig
 * @param {'privacy' | 'mentions' | 'terms'} doc
 */
function legalHeading(siteConfig, doc) {
  return text(siteConfig?.legalDocuments?.[doc]?.title)
}

/**
 * Route statique → titre rendu par son composant (fichier indiqué en commentaire).
 *
 * @type {Record<string, (ctx: HeadingContext) => string>}
 */
export const STATIC_ROUTE_HEADINGS = {
  // WatchesCollection.vue — `pageHeadingTitle`, sans marque ni campagne sélectionnée.
  '/collection': ({ t }) => t('collection.title'),
  // BrandsIndexPage.vue
  '/collection/marques': ({ siteConfig, t }) =>
    text(siteConfig.seo?.brandsIndex?.h1) || t('watch.allBrands'),
  // SoldWatchesArchivePage.vue
  '/ventes': ({ siteConfig, t }) =>
    text(siteConfig.seo?.soldArchive?.h1) || t('watch.soldArchiveHeading'),
  // BlogList.vue
  '/blog': ({ t }) => t('blog.title'),
  // MatchOnboarding.vue — premier écran d'une visite, avant tout choix.
  '/coup-de-foudre': ({ t }) => t('matchmaking.onboarding.title'),
  // Recherche.vue
  '/recherche': ({ t }) => t('crossSell.sourcing'),
  // EstimationPage.vue
  '/rachat': ({ t }) => t('valuation.pageTitle'),
  // EstimationProcess.vue
  '/rachat/processus': ({ t }) => t('process.pageTitle'),
  // APropos.vue
  '/a-propos': ({ siteConfig, t }) =>
    t('about.pageTitle', { brand: siteConfig.brand?.displayName ?? '' }),
  // ContactPage.vue
  '/contact': ({ t }) => t('contact.title'),
  // Faq.vue (`as-page`)
  '/faq': ({ siteConfig, t }) => text(siteConfig.faq?.heading) || t('faq.headingFallback'),
  // ServicesPage.vue
  '/services': ({ siteConfig }) => text(siteConfig.servicesPage?.hero?.title),
  // GuidePage.vue
  '/guide-horloger': ({ siteConfig }) => text(siteConfig.guidePage?.hero?.title),
  // Pages légales : texte du client (`legalDocuments.<doc>`, rendu par `legal/LegalDocument.vue`)
  // quand le manifest en fournit un, sinon texte générique du socle.
  // PolitiqueConfidentialite.vue
  '/politique-confidentialite': ({ siteConfig, t }) =>
    legalHeading(siteConfig, 'privacy') || t('legal.privacy'),
  // MentionsLegales.vue
  '/mentions-legales': ({ siteConfig, t }) =>
    legalHeading(siteConfig, 'mentions') || t('legal.mentions'),
  // ConditionsGeneralesUtilisation.vue
  '/conditions-generales-utilisation': ({ siteConfig, t }) =>
    legalHeading(siteConfig, 'terms') || t('legal.cguTitle'),
}

/**
 * Titre de repli quand aucune section de l'accueil ne porte de `<h1>` (pas de hero, ou hero
 * piloté par la config mais sans titre) : le titre SEO de l'accueil, sinon le nom du site.
 * `HomePage.vue` l'affiche alors en titre masqué, pour que la page en garde un.
 *
 * @param {Record<string, any>} siteConfig Manifest aplati dans la langue voulue.
 * @returns {string}
 */
export function resolveHomeFallbackHeading(siteConfig) {
  const brand = siteConfig?.brand ?? {}
  return (
    text(siteConfig?.seo?.home?.title) ||
    text(brand.searchSiteName) ||
    text(brand.legalName) ||
    text(brand.displayName)
  )
}

/**
 * Titre de l'accueil, tel que le rend son hero (`HomeHeroSection.vue` et ses variants).
 *
 * @param {HeadingContext} ctx
 * @returns {string}
 */
export function resolveHomeHeading({ siteConfig, t }) {
  // Mêmes conditions que `filterHomeSectionsByFeatures` : sans `home.sections`, aucune section.
  const sections = Array.isArray(siteConfig?.home?.sections) ? siteConfig.home.sections : []
  const heroRendered = sections.includes('hero') && isHomeHeroRenderable(siteConfig?.home?.hero)
  const hero = resolveHomeHeroConfig(siteConfig)

  if (heroRendered) {
    if (hero.variant === 'compact' || hero.variant === 'vitrine') return hero.title ?? ''
    // Hero `parallax` : le segment du milieu est écrit en dur dans le composant.
    return [t('home.heroTitleLead'), 'montres disponibles', t('home.heroTitleTail')]
      .map((part) => text(part))
      .filter(Boolean)
      .join(' ')
  }

  return resolveHomeFallbackHeading(siteConfig)
}

/**
 * Titre d'une route statique (`''` pour l'accueil). Une route hors table, ou dont le composant
 * n'a rien à afficher, retombe sur le titre de repli : une page servie garde toujours un `<h1>`.
 *
 * @param {{ routePath: string } & HeadingContext} input
 * @returns {string}
 */
export function buildStaticRouteHeading({ routePath, siteConfig, t }) {
  const ctx = { siteConfig, t }
  const resolver = routePath ? STATIC_ROUTE_HEADINGS[routePath] : resolveHomeHeading
  const heading = resolver ? text(resolver(ctx)) : ''
  return heading || resolveHomeFallbackHeading(siteConfig)
}

function escapeHtmlText(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/**
 * Écrit le titre dans le conteneur de l'application, à la place d'un éventuel contenu
 * pré-rendu précédent. Vue remplace ce contenu au montage (`app.mount`, sans hydratation).
 * Une coquille sans `<div id="app">` est laissée telle quelle.
 *
 * @param {string} html
 * @param {string} heading
 * @returns {string}
 */
export function applyStaticRouteHeading(html, heading) {
  if (!heading) return html
  return html.replace(
    /<div id="app">[\s\S]*?<\/div>/i,
    () => `<div id="app"><h1>${escapeHtmlText(heading)}</h1></div>`,
  )
}

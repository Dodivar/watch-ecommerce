import { filterHomeSectionsByFeatures, resolveHomeSections } from './homeSections.js'

/**
 * Navigation principale (header desktop + menu mobile) et liens colonne « Navigation » du footer.
 *
 * Déclarer dans `sites/<SITE_ID>/site.config.js` :
 *
 * ```js
 * navigation: {
 *   main: [
 *     { type: 'link', label: 'Accueil', to: '/' },
 *     { type: 'link', label: 'Nos montres', to: '/collection', feature: 'collection' },
 *     {
 *       type: 'group',
 *       label: 'Nos services',
 *       to: '/services',
 *       items: [
 *         { label: 'Recherche personnalisée', to: '/recherche', feature: 'recherche' },
 *         { label: 'Estimation', to: '/estimation', feature: 'estimation' },
 *       ],
 *     },
 *     {
 *       type: 'megaMenu',
 *       label: 'Nos montres',
 *       to: '/collection',
 *       feature: 'collection',
 *       columns: [
 *         {
 *           title: 'Genre',
 *           items: [
 *             { label: 'Montre homme', to: '/collection?public=homme' },
 *             { label: 'Montre femme', to: '/collection?public=femme' },
 *             { label: 'Montre enfant', to: '/collection?public=enfant' },
 *           ],
 *         },
 *         {
 *           title: 'Marques',
 *           source: 'brands',
 *           columns: 2,
 *           footerLink: { label: 'Toutes les marques', to: '/collection/marques' },
 *         },
 *       ],
 *     },
 *     { type: 'link', label: 'Blog', to: '/blog', feature: 'blog' },
 *     { type: 'link', label: 'FAQ', to: '/faq', feature: 'faq' },
 *   ],
 *   footer: [
 *     { label: 'Accueil', to: '/#accueil' },
 *     { label: 'Nos montres', to: '/collection', feature: 'collection' },
 *   ],
 * },
 * ```
 *
 * - `feature` (optionnel) sur un lien ou sur un groupe : masque l’entrée (ou tout le groupe) si `site.features[feature]` est faux.
 * - Les liens `to: '/faq'` deviennent `/#faq` automatiquement si `home.sections` contient `faq` (section visible après garde-fous features).
 * - Sur un `group`, `to` (optionnel) rend le libellé du groupe cliquable (`RouterLink`) en plus du sous-menu.
 * - Sur un `megaMenu`, `columns` décrit les colonnes du panneau pleine largeur (items statiques ou `source: 'brands'`). `titleLink` rend le titre de colonne cliquable.
 * - Si `navigation.main` est absent ou vide, un menu principal par défaut est utilisé.
 * - Si `navigation.footer` est absent ou vide, la colonne footer reprend le comportement historique du template (sans lien FAQ ; Contact vers `/contact` si `features.contact`).
 */

/**
 * @param {{ navigation?: { main?: RawNavEntry[], footer?: RawFooterLink[] }, features: Record<string, boolean> }} site
 * @returns {MainNavItem[]}
 */
export function resolveMainNavigation(site) {
  const features = site.features
  const raw = site.navigation?.main
  if (Array.isArray(raw) && raw.length > 0) {
    return filterConfiguredMainNav(raw, features, site)
  }
  return getDefaultMainNavigation(features, site)
}

/**
 * FAQ affichée sur l’accueil (`home.sections` contient `faq` et la section passe les garde-fous features).
 *
 * @param {Record<string, unknown>} site
 * @returns {boolean}
 */
export function isFaqOnHomepage(site) {
  const sections = resolveHomeSections(site)
  const filtered = filterHomeSectionsByFeatures(sections, site.features, site)
  return filtered.includes('faq')
}

/**
 * Liens menu `/faq` → `/#faq` lorsque la FAQ est une section d’accueil.
 *
 * @param {string} to
 * @param {Record<string, unknown>} site
 * @returns {string}
 */
function resolveNavTo(to, site) {
  if (to === '/faq' && isFaqOnHomepage(site)) {
    return '/#faq'
  }
  return to
}

/**
 * Indique si la navigation affiche un mega-menu alimenté par les marques catalogue.
 * @param {MainNavItem[]} navItems
 * @returns {boolean}
 */
export function navigationUsesCatalogBrands(navItems) {
  return navItems.some(
    (item) =>
      item.type === 'megaMenu' &&
      item.columns?.some((column) => column.source === 'brands'),
  )
}

/**
 * @typedef {{ label: string, to: string }} NavSubLinkResolved
 * @typedef {{ type: 'link', label: string, to: string }} NavLinkResolved
 * @typedef {{ type: 'group', label: string, items: NavSubLinkResolved[], to?: string }} NavGroupResolved
 * @typedef {{ title: string, titleLink?: string, items?: NavSubLinkResolved[], source?: 'brands', columns?: number, footerLink?: NavSubLinkResolved }} MegaMenuColumnResolved
 * @typedef {{ type: 'megaMenu', label: string, to: string, columns: MegaMenuColumnResolved[] }} NavMegaMenuResolved
 * @typedef {NavLinkResolved | NavGroupResolved | NavMegaMenuResolved} MainNavItem
 */

/**
 * @typedef {{ type?: 'link' | 'group' | 'megaMenu', label: string, to?: string, feature?: string, items?: Array<{ label: string, to: string, feature?: string }>, columns?: Array<{ title: string, titleLink?: string, items?: Array<{ label: string, to: string, feature?: string }>, source?: 'brands', columns?: number, footerLink?: { label: string, to: string } }> }} RawNavEntry
 * @typedef {{ label: string, to: string, feature?: string }} RawFooterLink
 * @typedef {{ label: string, to: string }} FooterNavLinkResolved
 */

/**
 * @param {RawNavEntry[]} items
 * @param {Record<string, boolean>} features
 * @returns {MainNavItem[]}
 */
function filterConfiguredMainNav(items, features, site) {
  /** @type {MainNavItem[]} */
  const out = []
  for (const raw of items) {
    const type = resolveRawType(raw)
    if (type === 'link') {
      if (raw.feature && !features[raw.feature]) continue
      if (!raw.to) continue
      out.push({ type: 'link', label: raw.label, to: resolveNavTo(raw.to, site) })
    } else if (type === 'group' && Array.isArray(raw.items)) {
      if (raw.feature && !features[raw.feature]) continue
      const children = raw.items.filter((sub) => !sub.feature || features[sub.feature])
      if (children.length === 0) continue
      /** @type {NavGroupResolved} */
      const group = {
        type: 'group',
        label: raw.label,
        items: children.map(({ label, to }) => ({ label, to: resolveNavTo(to, site) })),
      }
      if (raw.to) {
        group.to = resolveNavTo(raw.to, site)
      }
      out.push(group)
    } else if (type === 'megaMenu' && Array.isArray(raw.columns)) {
      if (raw.feature && !features[raw.feature]) continue
      if (!raw.to) continue
      const columns = resolveMegaMenuColumns(raw.columns, features, site)
      if (columns.length === 0) continue
      /** @type {NavMegaMenuResolved} */
      const megaMenu = {
        type: 'megaMenu',
        label: raw.label,
        to: resolveNavTo(raw.to, site),
        columns,
      }
      out.push(megaMenu)
    }
  }
  return out
}

/**
 * @param {NonNullable<RawNavEntry['columns']>} rawColumns
 * @param {Record<string, boolean>} features
 * @returns {MegaMenuColumnResolved[]}
 */
function resolveMegaMenuColumns(rawColumns, features, site) {
  /** @type {MegaMenuColumnResolved[]} */
  const out = []
  for (const column of rawColumns) {
    if (!column?.title) continue
    if (column.source === 'brands') {
      /** @type {MegaMenuColumnResolved} */
      const dynamicColumn = {
        title: column.title,
        source: 'brands',
      }
      if (typeof column.columns === 'number' && column.columns > 1) {
        dynamicColumn.columns = column.columns
      }
      if (column.footerLink?.label && column.footerLink?.to) {
        dynamicColumn.footerLink = {
          label: column.footerLink.label,
          to: resolveNavTo(column.footerLink.to, site),
        }
      }
      out.push(dynamicColumn)
      continue
    }
    const items = (column.items ?? []).filter((sub) => !sub.feature || features[sub.feature])
    const titleLink = column.titleLink ? resolveNavTo(column.titleLink, site) : undefined
    if (items.length === 0 && !titleLink) continue
    /** @type {MegaMenuColumnResolved} */
    const staticColumn = {
      title: column.title,
      items: items.map(({ label, to }) => ({ label, to: resolveNavTo(to, site) })),
    }
    if (titleLink) {
      staticColumn.titleLink = titleLink
    }
    out.push(staticColumn)
  }
  return out
}

/** @param {RawNavEntry} raw */
function resolveRawType(raw) {
  if (raw.type === 'megaMenu') return 'megaMenu'
  if (raw.type === 'group') return 'group'
  if (raw.type === 'link') return 'link'
  if (Array.isArray(raw.columns)) return 'megaMenu'
  if (Array.isArray(raw.items)) return 'group'
  return 'link'
}

/**
 * @param {Record<string, boolean>} features
 * @returns {MainNavItem[]}
 */
function getDefaultMainNavigation(features, site) {
  /** @type {MainNavItem[]} */
  const items = [{ type: 'link', label: 'Accueil', to: '/' }]

  if (features.collection) {
    items.push({ type: 'link', label: 'Nos montres', to: '/collection' })
  }

  if (features.recherche || features.estimation) {
    /** @type {NavSubLinkResolved[]} */
    const sub = []
    if (features.recherche) {
      sub.push({ label: 'Recherche personnalisée', to: '/recherche' })
    }
    if (features.estimation) {
      sub.push({ label: 'Estimation', to: '/estimation' })
    }
    if (sub.length > 0) {
      items.push({ type: 'group', label: 'Nos services', items: sub })
    }
  }

  if (features.blog) {
    items.push({ type: 'link', label: 'Blog', to: '/blog' })
  }
  if (features.about) {
    items.push({ type: 'link', label: 'À propos', to: '/a-propos' })
  }

  if (features.faq) {
    items.push({ type: 'link', label: 'FAQ', to: resolveNavTo('/faq', site) })
  }
  if (features.contact) {
    items.push({ type: 'link', label: 'Contact', to: '/contact' })
  }

  return items
}

/**
 * Liens de la colonne « Navigation » du footer (liste plate).
 *
 * @param {{ navigation?: { footer?: RawFooterLink[] }, features: Record<string, boolean> }} site
 * @returns {FooterNavLinkResolved[]}
 */
export function resolveFooterNavigation(site) {
  const features = site.features
  const raw = site.navigation?.footer
  if (Array.isArray(raw) && raw.length > 0) {
    return filterConfiguredFooterNav(raw, features, site)
  }
  return getDefaultFooterNavigation(features)
}

/**
 * @param {RawFooterLink[]} items
 * @param {Record<string, boolean>} features
 * @returns {FooterNavLinkResolved[]}
 */
function filterConfiguredFooterNav(items, features, site) {
  /** @type {FooterNavLinkResolved[]} */
  const out = []
  for (const entry of items) {
    if (entry.feature && !features[entry.feature]) continue
    if (!entry.label || !entry.to) continue
    out.push({ label: entry.label, to: resolveNavTo(entry.to, site) })
  }
  return out
}

/**
 * Colonne footer historique (sans FAQ / Contact), avec Accueil vers l’ancre #accueil.
 *
 * @param {Record<string, boolean>} features
 * @returns {FooterNavLinkResolved[]}
 */
function getDefaultFooterNavigation(features) {
  /** @type {FooterNavLinkResolved[]} */
  const items = [{ label: 'Accueil', to: '/#accueil' }]

  if (features.collection) {
    items.push({ label: 'Nos montres', to: '/collection' })
  }
  if (features.recherche) {
    items.push({ label: 'Recherche personnalisée', to: '/recherche' })
  }
  if (features.estimation) {
    items.push({ label: 'Estimation', to: '/estimation' })
  }
  if (features.blog) {
    items.push({ label: 'Blog', to: '/blog' })
  }
  if (features.about) {
    items.push({ label: 'À propos', to: '/a-propos' })
  }
  if (features.contact) {
    items.push({ label: 'Contact', to: '/contact' })
  }

  return items
}

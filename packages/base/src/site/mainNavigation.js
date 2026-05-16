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
 *     { type: 'link', label: 'Blog', to: '/blog', feature: 'blog' },
 *     { type: 'link', label: 'FAQ', to: '/#faq', feature: 'faq' },
 *   ],
 *   footer: [
 *     { label: 'Accueil', to: '/#accueil' },
 *     { label: 'Nos montres', to: '/collection', feature: 'collection' },
 *   ],
 * },
 * ```
 *
 * - `feature` (optionnel) sur un lien ou sur un groupe : masque l’entrée (ou tout le groupe) si `site.features[feature]` est faux.
 * - Sur un `group`, `to` (optionnel) rend le libellé du groupe cliquable (`RouterLink`) en plus du sous-menu.
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
    return filterConfiguredMainNav(raw, features)
  }
  return getDefaultMainNavigation(features)
}

/**
 * @typedef {{ label: string, to: string }} NavSubLinkResolved
 * @typedef {{ type: 'link', label: string, to: string }} NavLinkResolved
 * @typedef {{ type: 'group', label: string, items: NavSubLinkResolved[], to?: string }} NavGroupResolved
 * @typedef {NavLinkResolved | NavGroupResolved} MainNavItem
 */

/**
 * @typedef {{ type?: 'link' | 'group', label: string, to?: string, feature?: string, items?: Array<{ label: string, to: string, feature?: string }> }} RawNavEntry
 * @typedef {{ label: string, to: string, feature?: string }} RawFooterLink
 * @typedef {{ label: string, to: string }} FooterNavLinkResolved
 */

/**
 * @param {RawNavEntry[]} items
 * @param {Record<string, boolean>} features
 * @returns {MainNavItem[]}
 */
function filterConfiguredMainNav(items, features) {
  /** @type {MainNavItem[]} */
  const out = []
  for (const raw of items) {
    const type = resolveRawType(raw)
    if (type === 'link') {
      if (raw.feature && !features[raw.feature]) continue
      if (!raw.to) continue
      out.push({ type: 'link', label: raw.label, to: raw.to })
    } else if (type === 'group' && Array.isArray(raw.items)) {
      if (raw.feature && !features[raw.feature]) continue
      const children = raw.items.filter((sub) => !sub.feature || features[sub.feature])
      if (children.length === 0) continue
      /** @type {NavGroupResolved} */
      const group = {
        type: 'group',
        label: raw.label,
        items: children.map(({ label, to }) => ({ label, to })),
      }
      if (raw.to) {
        group.to = raw.to
      }
      out.push(group)
    }
  }
  return out
}

/** @param {RawNavEntry} raw */
function resolveRawType(raw) {
  if (raw.type === 'group') return 'group'
  if (raw.type === 'link') return 'link'
  if (Array.isArray(raw.items)) return 'group'
  return 'link'
}

/**
 * @param {Record<string, boolean>} features
 * @returns {MainNavItem[]}
 */
function getDefaultMainNavigation(features) {
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
    items.push({ type: 'link', label: 'FAQ', to: '/#faq' })
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
    return filterConfiguredFooterNav(raw, features)
  }
  return getDefaultFooterNavigation(features)
}

/**
 * @param {RawFooterLink[]} items
 * @param {Record<string, boolean>} features
 * @returns {FooterNavLinkResolved[]}
 */
function filterConfiguredFooterNav(items, features) {
  /** @type {FooterNavLinkResolved[]} */
  const out = []
  for (const entry of items) {
    if (entry.feature && !features[entry.feature]) continue
    if (!entry.label || !entry.to) continue
    out.push({ label: entry.label, to: entry.to })
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

/**
 * Source de vérité des permissions du panel d'administration.
 *
 * Trois rôles (colonne `admin_users.role`) :
 * - `admin`     : accès total, seul à gérer les utilisateurs.
 * - `moderator` : commandes, messages, montres, articles, newsletter ;
 *                 pas de contenu site (carrousels), promos ni utilisateurs.
 * - `visitor`   : lecture seule partout.
 *
 * Module pur (aucune dépendance) : la vraie sécurité est assurée par les
 * policies RLS Supabase et le backend ; ceci pilote l'UX (menu grisé, guard
 * routeur, boutons masqués).
 */

export const ADMIN_ROLES = ['admin', 'moderator', 'visitor']

export const ROLE_LABELS = {
  admin: 'Administrateur',
  moderator: 'Modérateur',
  visitor: 'Visiteur (lecture seule)',
}

/** Sections réservées au rôle admin (contenu site, promotions, utilisateurs). */
const ADMIN_ONLY_PREFIXES = [
  '/admin/users',
  '/admin/promo',
  '/admin/watch-promotions',
  '/admin/home-carousel',
  '/admin/home-featured',
  '/admin/home-collection',
]

/** Routes d'écriture (création/édition), interdites au rôle visiteur. */
const WRITE_ROUTE_RE = /\/(new|generate|compose)$|\/edit$/

/**
 * @param {string} path
 * @returns {boolean}
 */
export function isAdminOnlyPath(path) {
  return ADMIN_ONLY_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  )
}

/**
 * Le rôle peut-il accéder à ce chemin du panel ?
 * @param {string|null} role
 * @param {string} path
 * @returns {boolean}
 */
export function canAccessPath(role, path) {
  if (role === 'admin') return true
  if (!ADMIN_ROLES.includes(role)) return false
  if (isAdminOnlyPath(path)) return false
  if (role === 'visitor' && WRITE_ROUTE_RE.test(path)) return false
  return true
}

/**
 * Le rôle peut-il modifier le contenu métier (montres, commandes, …) ?
 * @param {string|null} role
 * @returns {boolean}
 */
export function canWrite(role) {
  return role === 'admin' || role === 'moderator'
}

/**
 * @param {string|null} role
 * @returns {boolean}
 */
export function canManageUsers(role) {
  return role === 'admin'
}

/**
 * Message affiché au survol d'une entrée de menu inaccessible.
 * @param {string|null} role
 * @param {string} path
 * @returns {string}
 */
export function deniedTooltip(role, path) {
  if (isAdminOnlyPath(path)) return 'Accès réservé à l’administrateur'
  if (role === 'visitor') return 'Compte en lecture seule'
  return 'Accès non autorisé'
}

import { getCurrentAdminRole } from './adminAuthService'

/**
 * Tables porteuses de données personnelles doublées d'une vue masquée
 * (migration 20260829120000_support_readonly_access.sql).
 */
const MASKED_SOURCES = new Set(['orders', 'lead_submissions'])

/**
 * Source de lecture à utiliser pour le rôle courant.
 *
 * La RLS interdit au rôle `visitor` de lire ces tables en clair ; il passe par
 * une vue qui expose les mêmes colonnes avec les champs nominatifs caviardés.
 * Le masquage est fait en base, pas après réception : la charge réseau ne
 * contient jamais la donnée en clair.
 *
 * À n'utiliser que pour les lectures — les écritures visent toujours la table,
 * et sont de toute façon refusées au visiteur par les policies RESTRICTIVE.
 *
 * @param {string} table
 * @returns {Promise<string>}
 */
export async function supportTable(table) {
  if (!MASKED_SOURCES.has(table)) return table
  const role = await getCurrentAdminRole()
  // Échec fermé : seul un rôle en écriture confirmé lit la table de base. Un
  // rôle indéterminé (session absente, lecture du rôle en erreur) passe par la
  // vue masquée — viser la table de base dans ce cas donnerait un résultat vide
  // sans erreur, et un incident mal diagnostiqué.
  return role === 'admin' || role === 'moderator' ? table : `${table}_support`
}

/**
 * Le compte courant lit-il des données masquées ? Pilote les mentions d'UI
 * (bandeau « données masquées », recherche par email désactivée).
 * @returns {Promise<boolean>}
 */
export async function isMaskedSession() {
  return (await getCurrentAdminRole()) === 'visitor'
}

import { supabase } from '../supabase'
import { getBackendApiUrl, readApiResponseBody } from '../backendApiUrl.js'
import { getAdminSiteId } from './adminSiteContext.js'

/**
 * Liste des utilisateurs du panel (email + rôle).
 * @returns {Promise<{email: string, role: string}[]>}
 */
export async function getAdminUsersList() {
  // Jeux de colonnes du plus récent au plus ancien : chaque tenant n'a que les
  // migrations qui lui ont été appliquées.
  const columnSets = ['email, role, is_active, access_expires_at', 'email, role', 'email']
  let data = null
  let error = null

  for (const columns of columnSets) {
    ;({ data, error } = await supabase.from('admin_users').select(columns).order('email'))
    if (!error) break
    if (!/does not exist|role|is_active|access_expires_at/i.test(error.message || '')) break
  }

  if (error) throw new Error(error.message)
  return (data || []).map((row) => ({
    email: row.email,
    role: row.role || 'admin',
    isActive: row.is_active !== false,
    accessExpiresAt: row.access_expires_at ?? null,
  }))
}

/**
 * Appel authentifié vers le backend (gestion des utilisateurs — service role).
 * @param {'POST'|'PATCH'|'DELETE'} method
 * @param {string} path
 * @param {object} [body]
 */
async function callBackend(method, path, body) {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const token = session?.access_token
  if (!token) throw new Error('Session admin requise')

  const response = await fetch(`${getBackendApiUrl()}/api/admin/users${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'X-Site-Id': getAdminSiteId(),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  const data = await readApiResponseBody(response)
  if (!response.ok || data.success === false) {
    throw new Error(data.error || data.message || "Échec de l'opération")
  }
  return data
}

/**
 * Invite un nouvel utilisateur : email Supabase avec lien de définition du mot
 * de passe + ajout à la whitelist avec son rôle.
 * @param {string} email
 * @param {string} role - 'admin' | 'moderator' | 'visitor'
 * @returns {Promise<{invited: boolean}>} invited=false si le compte existait déjà
 */
export function inviteAdminUser(email, role) {
  return callBackend('POST', '/invite', { email, role })
}

/**
 * Change le rôle d'un utilisateur.
 * @param {string} email
 * @param {string} role
 */
export function updateAdminUserRole(email, role) {
  return callBackend('PATCH', `/${encodeURIComponent(email)}`, { role })
}

/**
 * Ouvre ou referme la fenêtre d'accès d'un compte (break-glass).
 *
 * L'ouverture est bornée dans le temps : l'expiration est ensuite appliquée par
 * la RLS et par le backend, sans intervention.
 *
 * @param {string} email
 * @param {{ open: boolean, hours?: number }} options
 */
export function updateAdminUserAccess(email, { open, hours } = { open: true }) {
  return callBackend('PATCH', `/${encodeURIComponent(email)}/access`, { open, hours })
}

/**
 * Retire l'accès d'un utilisateur (whitelist + compte auth).
 * @param {string} email
 */
export function deleteAdminUser(email) {
  return callBackend('DELETE', `/${encodeURIComponent(email)}`)
}

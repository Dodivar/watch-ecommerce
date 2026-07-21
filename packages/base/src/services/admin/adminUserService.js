import { supabase } from '../supabase'
import { getBackendApiUrl, readApiResponseBody } from '../backendApiUrl.js'
import { getAdminSiteId } from './adminSiteContext.js'

/**
 * Liste des utilisateurs du panel (email + rôle).
 * @returns {Promise<{email: string, role: string}[]>}
 */
export async function getAdminUsersList() {
  let { data, error } = await supabase.from('admin_users').select('email, role').order('email')

  // Tenant pré-migration rôles : colonne absente, retomber sur email seul.
  if (error && /role/.test(error.message || '')) {
    ;({ data, error } = await supabase.from('admin_users').select('email').order('email'))
  }

  if (error) throw new Error(error.message)
  return (data || []).map((row) => ({ email: row.email, role: row.role || 'admin' }))
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
 * Retire l'accès d'un utilisateur (whitelist + compte auth).
 * @param {string} email
 */
export function deleteAdminUser(email) {
  return callBackend('DELETE', `/${encodeURIComponent(email)}`)
}

import { supabase } from '../supabase'
import { getBackendApiUrl, readApiResponseBody } from '../backendApiUrl.js'
import { getAdminSiteId } from './adminSiteContext.js'

/**
 * @param {object} row
 */
function mapAccessLogRow(row) {
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    action: row.action,
    path: row.path,
    ip: row.ip,
    occurredAt: row.occurred_at,
  }
}

/**
 * Journal des accès au panel, le plus récent d'abord.
 *
 * Consultable par le client : c'est ce qui rend vérifiable l'engagement de
 * lecture seule pris dans le contrat, au lieu d'une simple promesse.
 *
 * @param {{ email?: string, limit?: number, offset?: number }} [filters]
 */
export async function getAccessLogForAdmin(filters = {}) {
  const siteId = getAdminSiteId()
  let query = supabase
    .from('admin_access_log')
    .select('*', { count: 'exact' })
    .eq('site_id', siteId)
    .order('occurred_at', { ascending: false })

  if (filters.email?.trim()) {
    query = query.eq('email', filters.email.trim().toLowerCase())
  }

  const limit = filters.limit ?? 100
  const offset = filters.offset ?? 0
  query = query.range(offset, offset + limit - 1)

  const { data, error, count } = await query

  // Tenant sans la migration accès support : pas de journal, pas d'erreur d'UI.
  if (error) {
    if (/does not exist|schema cache/i.test(error.message || '')) {
      return { entries: [], total: 0, available: false }
    }
    throw new Error(error.message)
  }

  return {
    entries: (data || []).map(mapAccessLogRow),
    total: count ?? 0,
    available: true,
  }
}

/**
 * Trace une consultation du panel. Les lectures se font en direct contre
 * Supabase : sans cet appel, le journal ne verrait presque rien.
 *
 * Silencieux en cas d'échec — journaliser ne doit jamais bloquer une
 * navigation, encore moins pendant un incident.
 *
 * @param {{ action: string, path?: string }} entry
 */
export async function recordAccessLogEntry(entry) {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const token = session?.access_token
    if (!token) return

    const response = await fetch(`${getBackendApiUrl()}/api/admin/access-log`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'X-Site-Id': getAdminSiteId(),
      },
      body: JSON.stringify(entry),
    })

    if (!response.ok) {
      await readApiResponseBody(response).catch(() => null)
    }
  } catch {
    // Ignoré volontairement.
  }
}

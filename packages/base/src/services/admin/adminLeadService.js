import { supabase } from '../supabase'
import { getAdminSiteId } from './adminSiteContext.js'

const LEAD_TYPES = ['contact', 'appointment', 'estimation', 'search']
const LEAD_STATUSES = ['new', 'read', 'archived']

/**
 * @param {object} row
 */
function mapLeadRow(row) {
  return {
    id: row.id,
    siteId: row.site_id,
    type: row.type,
    status: row.status,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    watchId: row.watch_id,
    payload: row.payload || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/**
 * @param {{ type?: string, status?: string, search?: string, limit?: number, offset?: number }} [filters]
 */
export async function getLeadsForAdmin(filters = {}) {
  const siteId = getAdminSiteId()
  let query = supabase
    .from('lead_submissions')
    .select('*', { count: 'exact' })
    .eq('site_id', siteId)
    .order('created_at', { ascending: false })

  if (filters.type) query = query.eq('type', filters.type)
  if (filters.status) query = query.eq('status', filters.status)
  if (filters.search?.trim()) {
    // Retirer les caractères réservés de la grammaire or() PostgREST (',', '(', ')')
    // qui feraient échouer la requête entière.
    const term = `%${filters.search.trim().replace(/[,()]/g, ' ')}%`
    query = query.or(
      `customer_email.ilike.${term},customer_name.ilike.${term}`,
    )
  }

  const limit = filters.limit ?? 50
  const offset = filters.offset ?? 0
  query = query.range(offset, offset + limit - 1)

  const { data, error, count } = await query
  if (error) throw new Error(error.message)

  return {
    leads: (data || []).map(mapLeadRow),
    total: count ?? 0,
  }
}

/**
 * @param {string} leadId
 */
export async function getLeadByIdForAdmin(leadId) {
  const siteId = getAdminSiteId()
  const { data, error } = await supabase
    .from('lead_submissions')
    .select('*')
    .eq('id', leadId)
    .eq('site_id', siteId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data ? mapLeadRow(data) : null
}

/**
 * @param {string} leadId
 * @param {'read' | 'archived'} status
 */
export async function updateLeadStatus(leadId, status) {
  if (!LEAD_STATUSES.includes(status)) {
    throw new Error('Statut invalide')
  }

  const siteId = getAdminSiteId()
  const { error } = await supabase
    .from('lead_submissions')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', leadId)
    .eq('site_id', siteId)

  if (error) throw new Error(error.message)
  return { success: true }
}

/**
 * Compte des leads non lus par type (badges accordéon admin).
 * @returns {Promise<Record<string, number>>}
 */
export async function getUnreadLeadsCountByType() {
  const siteId = getAdminSiteId()
  const { data, error } = await supabase
    .from('lead_submissions')
    .select('type')
    .eq('site_id', siteId)
    .eq('status', 'new')

  if (error) throw new Error(error.message)

  const counts = Object.fromEntries(LEAD_TYPES.map((t) => [t, 0]))
  for (const row of data || []) {
    if (counts[row.type] != null) counts[row.type]++
  }
  return counts
}

/**
 * Compte des leads non lus pour badge nav.
 */
export async function getUnreadLeadsCount() {
  const siteId = getAdminSiteId()
  const { count, error } = await supabase
    .from('lead_submissions')
    .select('*', { count: 'exact', head: true })
    .eq('site_id', siteId)
    .eq('status', 'new')

  if (error) throw new Error(error.message)
  return count ?? 0
}

/**
 * RDV groupés par date (vue light).
 */
export async function getAppointmentsByDate() {
  const siteId = getAdminSiteId()
  const { data, error } = await supabase
    .from('lead_submissions')
    .select('*')
    .eq('site_id', siteId)
    .eq('type', 'appointment')
    .neq('status', 'archived')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)

  /** @type {Record<string, ReturnType<typeof mapLeadRow>[]>} */
  const byDate = {}
  for (const row of data || []) {
    const lead = mapLeadRow(row)
    const dateKey = lead.payload?.date || lead.createdAt.slice(0, 10)
    if (!byDate[dateKey]) byDate[dateKey] = []
    byDate[dateKey].push(lead)
  }
  return byDate
}

export { LEAD_TYPES, LEAD_STATUSES }

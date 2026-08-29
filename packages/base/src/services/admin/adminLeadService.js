import { supabase } from '../supabase'
import { getAdminSiteId } from './adminSiteContext.js'
import { supportTable } from './supportTables.js'

const LEAD_TYPES = ['contact', 'appointment', 'estimation', 'search', 'repair']
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
    .from(await supportTable('lead_submissions'))
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
    .from(await supportTable('lead_submissions'))
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
    .from(await supportTable('lead_submissions'))
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
    .from(await supportTable('lead_submissions'))
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
    .from(await supportTable('lead_submissions'))
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

/**
 * Demandes clients groupées par jour et par type, pour la page statistiques.
 *
 * Les types sont renvoyés tels quels : c'est la page qui décide lesquels
 * afficher selon les features du site — un site qui vient de couper
 * l'estimation a encore un historique d'estimations à montrer.
 *
 * @param {{ days?: number }} [options] - Fenêtre temporelle en jours (omis = tout l'historique).
 * @returns {Promise<{ daily: Array<{ date: string, total: number, byType: Record<string, number> }>,
 *   byType: Record<string, number>, total: number }>}
 */
export async function getLeadStatsByDay({ days } = {}) {
  const siteId = getAdminSiteId()

  let query = supabase
    .from(await supportTable('lead_submissions'))
    .select('type, created_at')
    .eq('site_id', siteId)
    .order('created_at', { ascending: true })

  if (typeof days === 'number' && days > 0) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
    query = query.gte('created_at', since)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)

  const rows = data || []
  const byType = Object.fromEntries(LEAD_TYPES.map((type) => [type, 0]))
  /** @type {Map<string, { date: string, total: number, byType: Record<string, number> }>} */
  const byDate = new Map()

  for (const row of rows) {
    if (!row.created_at) continue
    const type = LEAD_TYPES.includes(row.type) ? row.type : null
    if (!type) continue

    byType[type] += 1

    const dateKey = new Date(row.created_at).toISOString().split('T')[0]
    if (!byDate.has(dateKey)) {
      byDate.set(dateKey, {
        date: dateKey,
        total: 0,
        byType: Object.fromEntries(LEAD_TYPES.map((t) => [t, 0])),
      })
    }
    const dayStats = byDate.get(dateKey)
    dayStats.byType[type] += 1
    dayStats.total += 1
  }

  const daily = Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date))

  return {
    daily,
    byType,
    total: daily.reduce((sum, day) => sum + day.total, 0),
  }
}

export { LEAD_TYPES, LEAD_STATUSES }

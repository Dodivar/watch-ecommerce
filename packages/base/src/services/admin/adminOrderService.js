import { supabase } from '../supabase'
import { getAdminSiteId } from './adminSiteContext.js'

const FULFILLMENT_STATUSES = ['pending', 'preparing', 'shipped', 'ready_for_pickup', 'completed']

/**
 * @param {object} row
 */
function mapOrderRow(row) {
  return {
    id: row.id,
    siteId: row.site_id,
    status: row.status,
    fulfillmentStatus: row.fulfillment_status || 'pending',
    currency: row.currency,
    customerEmail: row.customer_email,
    customerPhone: row.customer_phone,
    shippingAddress: row.shipping_address,
    subtotalCents: row.subtotal_cents,
    shippingCents: row.shipping_cents,
    discountCents: row.discount_cents,
    totalCents: row.total_cents,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    paidAt: row.paid_at,
  }
}

/**
 * @param {{ status?: string, fulfillmentStatus?: string, search?: string, limit?: number, offset?: number }} [filters]
 */
export async function getOrdersForAdmin(filters = {}) {
  const siteId = getAdminSiteId()
  let query = supabase
    .from('orders')
    .select('*', { count: 'exact' })
    .eq('site_id', siteId)
    .order('created_at', { ascending: false })

  if (filters.status) {
    query = query.eq('status', filters.status)
  }
  if (filters.fulfillmentStatus) {
    query = query.eq('fulfillment_status', filters.fulfillmentStatus)
  }
  if (filters.search?.trim()) {
    const term = `%${filters.search.trim()}%`
    query = query.or(`customer_email.ilike.${term},customer_phone.ilike.${term}`)
  }

  const limit = filters.limit ?? 50
  const offset = filters.offset ?? 0
  query = query.range(offset, offset + limit - 1)

  const { data, error, count } = await query
  if (error) throw new Error(error.message)

  return {
    orders: (data || []).map(mapOrderRow),
    total: count ?? 0,
  }
}

/**
 * @param {string} orderId
 */
export async function getOrderByIdForAdmin(orderId) {
  const siteId = getAdminSiteId()

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .eq('site_id', siteId)
    .maybeSingle()

  if (orderError) throw new Error(orderError.message)
  if (!order) return null

  const [{ data: lines }, { data: shipping }, { data: discount }] = await Promise.all([
    supabase.from('order_lines').select('*').eq('order_id', orderId).order('created_at'),
    supabase.from('order_shipping').select('*').eq('order_id', orderId).maybeSingle(),
    supabase.from('order_discounts').select('*').eq('order_id', orderId).maybeSingle(),
  ])

  return {
    order: mapOrderRow(order),
    lines: (lines || []).map((l) => ({
      id: l.id,
      watchId: l.watch_id,
      name: l.name,
      reference: l.reference,
      quantity: l.quantity,
      unitPriceCents: l.unit_price_cents,
      imageUrl: l.image_url,
    })),
    shipping: shipping
      ? {
          methodId: shipping.method_id,
          methodType: shipping.method_type,
          methodLabel: shipping.method_label,
          feeCents: shipping.fee_cents,
          metadata: shipping.metadata,
        }
      : null,
    discount: discount
      ? {
          code: discount.metadata?.promo_code,
          discountCents: discount.discount_cents,
        }
      : null,
  }
}

/**
 * @param {string} orderId
 * @param {string} fulfillmentStatus
 */
export async function updateOrderFulfillmentStatus(orderId, fulfillmentStatus) {
  if (!FULFILLMENT_STATUSES.includes(fulfillmentStatus)) {
    throw new Error('Statut de fulfillment invalide')
  }

  const siteId = getAdminSiteId()
  const { error } = await supabase
    .from('orders')
    .update({
      fulfillment_status: fulfillmentStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)
    .eq('site_id', siteId)

  if (error) throw new Error(error.message)
  return { success: true }
}

/**
 * KPI commandes pour le dashboard admin.
 */
export async function getOrderKpisForAdmin() {
  const siteId = getAdminSiteId()
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const { data: todayOrders, error: todayError } = await supabase
    .from('orders')
    .select('total_cents, status')
    .eq('site_id', siteId)
    .eq('status', 'paid')
    .gte('paid_at', startOfDay)

  if (todayError) throw new Error(todayError.message)

  const { data: weekOrders, error: weekError } = await supabase
    .from('orders')
    .select('total_cents, status')
    .eq('site_id', siteId)
    .eq('status', 'paid')
    .gte('paid_at', weekAgo)

  if (weekError) throw new Error(weekError.message)

  const todayCount = todayOrders?.length ?? 0
  const todayRevenueCents = (todayOrders || []).reduce((s, o) => s + (o.total_cents || 0), 0)
  const weekRevenueCents = (weekOrders || []).reduce((s, o) => s + (o.total_cents || 0), 0)

  return {
    todayCount,
    todayRevenueCents,
    weekRevenueCents,
  }
}

/**
 * Statistiques de ventes (commandes payées) groupées par jour.
 * @param {{ days?: number }} [options] - Fenêtre temporelle en jours (omis = tout l'historique).
 * @returns {Promise<{ daily: Array<{ date: string, revenueCents: number, orderCount: number }>, totalRevenueCents: number, orderCount: number, avgOrderValueCents: number }>}
 */
export async function getSalesStatsByDay({ days } = {}) {
  const siteId = getAdminSiteId()

  let query = supabase
    .from('orders')
    .select('total_cents, paid_at')
    .eq('site_id', siteId)
    .eq('status', 'paid')
    .not('paid_at', 'is', null)
    .order('paid_at', { ascending: true })

  if (typeof days === 'number' && days > 0) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
    query = query.gte('paid_at', since)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)

  const orders = data || []
  const statsMap = new Map()

  for (const order of orders) {
    if (!order.paid_at) continue
    const dateKey = new Date(order.paid_at).toISOString().split('T')[0]
    if (!statsMap.has(dateKey)) {
      statsMap.set(dateKey, { date: dateKey, revenueCents: 0, orderCount: 0 })
    }
    const dayStats = statsMap.get(dateKey)
    dayStats.revenueCents += order.total_cents || 0
    dayStats.orderCount += 1
  }

  const daily = Array.from(statsMap.values()).sort((a, b) => a.date.localeCompare(b.date))
  const totalRevenueCents = orders.reduce((sum, o) => sum + (o.total_cents || 0), 0)
  const orderCount = orders.length
  const avgOrderValueCents = orderCount > 0 ? Math.round(totalRevenueCents / orderCount) : 0

  return {
    daily,
    totalRevenueCents,
    orderCount,
    avgOrderValueCents,
  }
}

/**
 * @param {string} watchId
 */
export async function getOrdersForWatchAdmin(watchId) {
  const siteId = getAdminSiteId()

  const { data: lineRows, error: lineError } = await supabase
    .from('order_lines')
    .select('order_id')
    .eq('watch_id', watchId)

  if (lineError) throw new Error(lineError.message)
  const orderIds = [...new Set((lineRows || []).map((r) => r.order_id))]
  if (orderIds.length === 0) return []

  const { data: orders, error } = await supabase
    .from('orders')
    .select('*')
    .eq('site_id', siteId)
    .in('id', orderIds)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (orders || []).map(mapOrderRow)
}

export { FULFILLMENT_STATUSES }

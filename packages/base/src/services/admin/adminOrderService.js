import { supabase } from '../supabase'
import { getBackendApiUrl, readApiResponseBody } from '../backendApiUrl.js'
import { getAdminSiteId } from './adminSiteContext.js'
import { RETURN_STATUSES, summarizeReturnStats, validateReturnUpdate } from './orderReturns.js'
import { supportTable } from './supportTables.js'

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
    receiptStoragePath: row.receipt_storage_path || null,
    stripePaymentIntentId: row.stripe_payment_intent_id || null,
    deliveredAt: row.delivered_at || null,
    returnStatus: row.return_status || 'none',
    returnRequestedAt: row.return_requested_at || null,
    returnNotes: row.return_notes || '',
    refundAmountCents: row.refund_amount_cents ?? null,
    refundedAt: row.refunded_at || null,
    stripeRefundId: row.stripe_refund_id || null,
  }
}

/**
 * @param {{ status?: string, fulfillmentStatus?: string, returnStatus?: string, search?: string, limit?: number, offset?: number }} [filters]
 */
export async function getOrdersForAdmin(filters = {}) {
  const siteId = getAdminSiteId()
  let query = supabase
    .from(await supportTable('orders'))
    .select('*', { count: 'exact' })
    .eq('site_id', siteId)
    .order('created_at', { ascending: false })

  if (filters.status) {
    query = query.eq('status', filters.status)
  }
  if (filters.fulfillmentStatus) {
    query = query.eq('fulfillment_status', filters.fulfillmentStatus)
  }
  // `open` = dossiers de rétractation encore à traiter (colis attendu ou reçu,
  // remboursement pas encore fait).
  if (filters.returnStatus === 'open') {
    query = query.in('return_status', ['requested', 'received'])
  } else if (filters.returnStatus) {
    query = query.eq('return_status', filters.returnStatus)
  }
  if (filters.search?.trim()) {
    // Retirer les caractères réservés de la grammaire or() PostgREST (',', '(', ')')
    // qui feraient échouer la requête entière.
    const term = `%${filters.search.trim().replace(/[,()]/g, ' ')}%`
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
    .from(await supportTable('orders'))
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

  const mappedLines = (lines || []).map((l) => ({
    id: l.id,
    watchId: l.watch_id,
    name: l.name,
    reference: l.reference,
    quantity: l.quantity,
    unitPriceCents: l.unit_price_cents,
    imageUrl: l.image_url,
  }))

  const missingWatchIds = [
    ...new Set(mappedLines.filter((l) => !l.imageUrl && l.watchId).map((l) => l.watchId)),
  ]

  const imageByWatch = new Map()
  if (missingWatchIds.length > 0) {
    const { data: allImages } = await supabase
      .from('watch_images')
      .select('watch_id, image_url, image_path, image_order')
      .in('watch_id', missingWatchIds)
      .order('image_order', { ascending: true })

    for (const row of allImages || []) {
      const watchKey = String(row.watch_id)
      if (imageByWatch.has(watchKey)) continue
      let url = null
      if (row.image_url) url = row.image_url
      else if (row.image_path) {
        const { data } = supabase.storage.from('watch-images').getPublicUrl(row.image_path)
        url = data.publicUrl
      }
      if (url) imageByWatch.set(watchKey, url)
    }
  }

  return {
    order: mapOrderRow(order),
    lines: mappedLines.map((l) => ({
      ...l,
      imageUrl: l.imageUrl || imageByWatch.get(String(l.watchId)) || null,
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
          code: discount.promo_code,
          discountType: discount.discount_type,
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
 * Enregistre l'avancement d'un dossier retour / remboursement.
 *
 * Le remboursement n'est pas déclenché ici : il est effectué à la main dans le
 * dashboard Stripe, cette fonction ne fait qu'en garder la trace côté commande.
 *
 * @param {string} orderId
 * @param {{ returnStatus: string, deliveredAt?: string|null, returnRequestedAt?: string|null,
 *   refundAmountCents?: number|null, refundedAt?: string|null, stripeRefundId?: string|null,
 *   returnNotes?: string|null }} update
 * @param {{ totalCents?: number|null }} [order] - Commande de référence, pour borner le montant.
 */
export async function updateOrderReturn(orderId, update, order = {}) {
  const validation = validateReturnUpdate(update, order)
  if (!validation.ok) {
    throw new Error(validation.error)
  }

  const siteId = getAdminSiteId()
  const refundId = update.stripeRefundId?.trim() || null
  const notes = update.returnNotes?.trim() || null

  const { error } = await supabase
    .from('orders')
    .update({
      return_status: update.returnStatus,
      delivered_at: update.deliveredAt || null,
      return_requested_at: update.returnRequestedAt || null,
      refund_amount_cents: update.refundAmountCents ?? null,
      refunded_at: update.refundedAt || null,
      stripe_refund_id: refundId,
      return_notes: notes,
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
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString()
  const ordersSource = await supportTable('orders')

  const { data: todayOrders, error: todayError } = await supabase
    .from(ordersSource)
    .select('total_cents, status')
    .eq('site_id', siteId)
    .eq('status', 'paid')
    .gte('paid_at', startOfDay)

  if (todayError) throw new Error(todayError.message)

  const { data: weekOrders, error: weekError } = await supabase
    .from(ordersSource)
    .select('total_cents, status')
    .eq('site_id', siteId)
    .eq('status', 'paid')
    .gte('paid_at', weekAgo)

  if (weekError) throw new Error(weekError.message)

  const { data: prevWeekOrders, error: prevWeekError } = await supabase
    .from(ordersSource)
    .select('total_cents, status')
    .eq('site_id', siteId)
    .eq('status', 'paid')
    .gte('paid_at', twoWeeksAgo)
    .lt('paid_at', weekAgo)

  if (prevWeekError) throw new Error(prevWeekError.message)

  const todayCount = todayOrders?.length ?? 0
  const todayRevenueCents = (todayOrders || []).reduce((s, o) => s + (o.total_cents || 0), 0)
  const weekRevenueCents = (weekOrders || []).reduce((s, o) => s + (o.total_cents || 0), 0)
  const previousWeekRevenueCents = (prevWeekOrders || []).reduce((s, o) => s + (o.total_cents || 0), 0)

  return {
    todayCount,
    todayRevenueCents,
    weekRevenueCents,
    previousWeekRevenueCents,
  }
}

/**
 * Compteurs d'actions commandes pour le dashboard admin.
 * @returns {Promise<{ pendingFulfillmentCount: number, pendingPaymentCount: number, openReturnCount: number }>}
 */
export async function getOrderActionCountsForAdmin() {
  const siteId = getAdminSiteId()
  const ordersSource = await supportTable('orders')

  const [fulfillmentResult, paymentResult, returnResult] = await Promise.all([
    supabase
      .from(ordersSource)
      .select('*', { count: 'exact', head: true })
      .eq('site_id', siteId)
      .eq('status', 'paid')
      .in('fulfillment_status', ['pending', 'preparing']),
    supabase
      .from(ordersSource)
      .select('*', { count: 'exact', head: true })
      .eq('site_id', siteId)
      .eq('status', 'pending_payment'),
    supabase
      .from(ordersSource)
      .select('*', { count: 'exact', head: true })
      .eq('site_id', siteId)
      .in('return_status', ['requested', 'received']),
  ])

  if (fulfillmentResult.error) throw new Error(fulfillmentResult.error.message)
  if (paymentResult.error) throw new Error(paymentResult.error.message)
  if (returnResult.error) throw new Error(returnResult.error.message)

  return {
    pendingFulfillmentCount: fulfillmentResult.count ?? 0,
    pendingPaymentCount: paymentResult.count ?? 0,
    openReturnCount: returnResult.count ?? 0,
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
    .from(await supportTable('orders'))
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
 * Statistiques retours / remboursements des commandes payées de la période.
 *
 * Même fenêtre que `getSalesStatsByDay` (bornée sur `paid_at`) pour que le taux
 * de retour se lise en face du chiffre d'affaires de la même période.
 *
 * @param {{ days?: number }} [options] - Fenêtre temporelle en jours (omis = tout l'historique).
 * @returns {Promise<ReturnType<typeof summarizeReturnStats>>}
 */
export async function getReturnStatsForAdmin({ days } = {}) {
  const siteId = getAdminSiteId()

  let query = supabase
    .from(await supportTable('orders'))
    .select('total_cents, return_status, return_requested_at, refund_amount_cents, refunded_at')
    .eq('site_id', siteId)
    .eq('status', 'paid')
    .not('paid_at', 'is', null)

  if (typeof days === 'number' && days > 0) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
    query = query.gte('paid_at', since)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)

  return summarizeReturnStats(
    (data || []).map((row) => ({
      totalCents: row.total_cents,
      returnStatus: row.return_status,
      returnRequestedAt: row.return_requested_at,
      refundAmountCents: row.refund_amount_cents,
      refundedAt: row.refunded_at,
    })),
  )
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
    .from(await supportTable('orders'))
    .select('*')
    .eq('site_id', siteId)
    .in('id', orderIds)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (orders || []).map(mapOrderRow)
}

export { FULFILLMENT_STATUSES, RETURN_STATUSES }

/**
 * Télécharge le reçu PDF d'une commande payée (admin).
 * @param {string} orderId
 */
export async function downloadOrderReceiptForAdmin(orderId) {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const token = session?.access_token
  if (!token) {
    throw new Error('Session admin requise')
  }

  const siteId = getAdminSiteId()
  const response = await fetch(`${getBackendApiUrl()}/api/admin/orders/${orderId}/receipt`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'X-Site-Id': siteId,
    },
  })

  if (!response.ok) {
    const data = await readApiResponseBody(response)
    throw new Error(data.error || data.message || 'Impossible de télécharger le reçu')
  }

  const blob = await response.blob()
  const filename =
    response.headers.get('Content-Disposition')?.match(/filename="([^"]+)"/)?.[1] ||
    `receipt-${orderId}.pdf`
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

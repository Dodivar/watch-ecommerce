/**
 * Règles retours / remboursements du panel admin.
 *
 * Deux délais légaux de 14 jours, à ne pas confondre :
 * - rétractation (art. L221-18) : le client a 14 jours après réception du colis
 *   pour se rétracter ;
 * - remboursement (art. L221-24) : le vendeur a 14 jours après avoir été informé
 *   de la rétractation pour rembourser.
 *
 * Le remboursement est déclenché depuis le panel (`POST /api/admin/orders/:id/refund`),
 * exécuté par Stripe et enregistré par le webhook dans `order_refunds`. Ce module
 * ne porte donc plus aucune saisie de montant : il calcule les échéances légales,
 * le reste à rembourser, et valide le suivi du dossier. Il est pur (aucun accès
 * Supabase) pour rester testable.
 */

/** Durée du droit de rétractation, en jours. */
export const WITHDRAWAL_PERIOD_DAYS = 14

/** Délai légal de remboursement après notification de la rétractation, en jours. */
export const REFUND_PERIOD_DAYS = 14

export const RETURN_STATUSES = ['none', 'requested', 'received', 'refunded', 'rejected']

export const RETURN_STATUS_LABELS = {
  none: 'Aucun retour',
  requested: 'Rétractation demandée',
  received: 'Colis reçu',
  refunded: 'Remboursée',
  rejected: 'Retour refusé',
}

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * @param {string|Date|null|undefined} value
 * @returns {Date|null}
 */
function toDate(value) {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

/**
 * @param {Date} date
 * @param {number} days
 * @returns {Date}
 */
function addDays(date, days) {
  return new Date(date.getTime() + days * DAY_MS)
}

/**
 * Jours restants avant une échéance (négatif une fois dépassée). Une journée
 * entamée compte pour une journée : J-1 tant que l'échéance n'est pas passée.
 * @param {Date} deadline
 * @param {Date} now
 * @returns {number}
 */
function daysUntil(deadline, now) {
  return Math.ceil((deadline.getTime() - now.getTime()) / DAY_MS)
}

/**
 * Fenêtre de rétractation d'une commande.
 *
 * Le délai court à compter de la réception du colis. Tant que `deliveredAt`
 * n'est pas renseigné, on retombe sur la date de paiement et la fenêtre est
 * marquée `isProvisional` : c'est une estimation basse (la réception est
 * forcément postérieure), à confirmer par l'admin.
 *
 * @param {{ deliveredAt?: string|Date|null, paidAt?: string|Date|null }} order
 * @param {Date} [now]
 * @returns {{ startedAt: Date, deadline: Date, daysLeft: number, isOpen: boolean, isProvisional: boolean }|null}
 */
export function computeWithdrawalWindow(order, now = new Date()) {
  const deliveredAt = toDate(order?.deliveredAt)
  const startedAt = deliveredAt || toDate(order?.paidAt)
  if (!startedAt) return null

  const deadline = addDays(startedAt, WITHDRAWAL_PERIOD_DAYS)
  const daysLeft = daysUntil(deadline, now)

  return {
    startedAt,
    deadline,
    daysLeft,
    isOpen: daysLeft > 0,
    isProvisional: !deliveredAt,
  }
}

/**
 * Échéance de remboursement après une demande de rétractation.
 * @param {string|Date|null|undefined} returnRequestedAt
 * @param {Date} [now]
 * @returns {{ deadline: Date, daysLeft: number, isOverdue: boolean }|null}
 */
export function computeRefundDeadline(returnRequestedAt, now = new Date()) {
  const requestedAt = toDate(returnRequestedAt)
  if (!requestedAt) return null

  const deadline = addDays(requestedAt, REFUND_PERIOD_DAYS)
  const daysLeft = daysUntil(deadline, now)

  return { deadline, daysLeft, isOverdue: daysLeft <= 0 }
}

/**
 * Lien direct vers le paiement dans le dashboard Stripe.
 *
 * Plus aucune opération courante n'en a besoin : il ne reste affiché que comme
 * porte de sortie quand l'application ne peut pas rembourser elle-même (aucun
 * PaymentIntent rattaché, refus de l'API) et pour instruire un litige, que
 * Stripe est seul à savoir traiter.
 * @param {string|null|undefined} paymentIntentId
 * @param {{ testMode?: boolean }} [options]
 * @returns {string|null} null si aucun paiement Stripe rattaché.
 */
export function stripePaymentDashboardUrl(paymentIntentId, { testMode = false } = {}) {
  if (!paymentIntentId || !/^pi_[A-Za-z0-9_]+$/.test(paymentIntentId)) return null
  const segment = testMode ? '/test' : ''
  return `https://dashboard.stripe.com${segment}/payments/${paymentIntentId}`
}

/**
 * Contrôle la cohérence d'une mise à jour de dossier retour avant écriture.
 *
 * Le panel n'écrit plus que le suivi du dossier : statut, dates logistiques et
 * notes. Les montants viennent de `order_refunds`, alimentée par le webhook —
 * la base refuse d'ailleurs l'écriture des colonnes de remboursement depuis le
 * navigateur (migration `20260911120000_order_refunds.sql`).
 *
 * D'où la seule règle un peu subtile ici : « Remboursée » n'est pas un statut
 * qu'on déclare, c'est un état qu'on constate. Il n'est accepté que sur une
 * commande qui porte réellement un remboursement — sinon la liste des commandes
 * afficherait « remboursée » sans qu'un centime soit sorti.
 *
 * @param {{ returnStatus?: string, returnNotes?: string|null }} update
 * @param {{ totalCents?: number|null, refundAmountCents?: number|null,
 *   returnStatus?: string|null }} [order]
 * @returns {{ ok: boolean, error?: string }}
 */
export function validateReturnUpdate(update, order = {}) {
  const status = update?.returnStatus
  if (!RETURN_STATUSES.includes(status)) {
    return { ok: false, error: 'Statut de retour invalide' }
  }

  if (status === 'refunded') {
    const alreadyRefunded =
      (order?.refundAmountCents ?? 0) > 0 || order?.returnStatus === 'refunded'
    if (!alreadyRefunded) {
      return {
        ok: false,
        error: 'Le statut « Remboursée » est posé automatiquement : utilisez le bouton Rembourser.',
      }
    }
  }

  return { ok: true }
}

/** Statuts d'un remboursement Stripe (`order_refunds.status`). */
export const REFUND_STATUS_LABELS = {
  pending: 'En cours',
  requires_action: 'Action requise',
  succeeded: 'Effectué',
  failed: 'Échoué',
  canceled: 'Annulé',
}

/** Origine d'un remboursement (`order_refunds.source`). */
export const REFUND_SOURCE_LABELS = {
  admin_panel: 'Administration',
  stripe_dashboard: 'Dashboard Stripe',
  dispute: 'Litige',
  unknown: 'Origine inconnue',
}

/** Statuts qui immobilisent une partie du total sans l'avoir encore rendue. */
const PENDING_REFUND_STATUSES = ['pending', 'requires_action']

/**
 * Totaux d'un lot de remboursements d'une commande.
 *
 * `pendingCents` est de l'argent déjà engagé auprès de Stripe : le confondre
 * avec du disponible autoriserait un second remboursement du même montant
 * pendant que le premier est en vol.
 *
 * @param {Array<{ amountCents?: number|null, status?: string|null }>} refunds
 * @returns {{ refundedCents: number, pendingCents: number, engagedCents: number, count: number }}
 */
export function summarizeRefunds(refunds) {
  let refundedCents = 0
  let pendingCents = 0
  let count = 0

  for (const refund of refunds || []) {
    const amount = Number(refund?.amountCents) || 0
    if (refund?.status === 'succeeded') {
      refundedCents += amount
      count += 1
    } else if (PENDING_REFUND_STATUSES.includes(refund?.status)) {
      pendingCents += amount
    }
  }

  return { refundedCents, pendingCents, engagedCents: refundedCents + pendingCents, count }
}

/**
 * Reste à rembourser sur une commande.
 * @param {{ totalCents?: number|null }} order
 * @param {Array<object>} refunds
 * @returns {number}
 */
export function refundableCents(order, refunds) {
  const total = Number(order?.totalCents) || 0
  return Math.max(0, total - summarizeRefunds(refunds).engagedCents)
}

/**
 * La commande peut-elle être remboursée depuis le panel ?
 * @param {{ status?: string, stripePaymentIntentId?: string|null, totalCents?: number|null }} order
 * @param {Array<object>} refunds
 * @returns {{ ok: boolean, reason?: string, availableCents: number }}
 */
export function canRefundOrder(order, refunds) {
  const availableCents = refundableCents(order, refunds)

  if (order?.status !== 'paid') {
    return { ok: false, reason: 'Seule une commande payée peut être remboursée', availableCents }
  }
  if (!order?.stripePaymentIntentId) {
    return {
      ok: false,
      reason:
        'Aucun paiement Stripe rattaché : le remboursement doit être fait depuis le dashboard, puis il sera enregistré ici automatiquement.',
      availableCents,
    }
  }
  if (availableCents <= 0) {
    return { ok: false, reason: 'Commande intégralement remboursée', availableCents }
  }

  return { ok: true, availableCents }
}

/** Dossiers encore à traiter : colis attendu ou reçu, remboursement pas encore fait. */
export const OPEN_RETURN_STATUSES = ['requested', 'received']

/**
 * Agrège les dossiers retour d'un lot de commandes payées.
 *
 * Le dénominateur est le lot reçu (les commandes payées de la période) : un
 * taux de retour ne veut rien dire rapporté aux seules commandes retournées.
 * `avgRefundDelayDays` mesure le délai réel demande → remboursement, à comparer
 * aux 14 jours de `REFUND_PERIOD_DAYS` ; il vaut `null` tant qu'aucun dossier
 * remboursé ne porte les deux dates (les dossiers d'avant le suivi retour).
 *
 * @param {Array<{ totalCents?: number|null, returnStatus?: string|null,
 *   returnRequestedAt?: string|Date|null, refundAmountCents?: number|null,
 *   refundedAt?: string|Date|null }>} orders
 * @param {Date} [now]
 */
export function summarizeReturnStats(orders, now = new Date()) {
  const rows = orders || []
  /** @type {Record<string, number>} */
  const byStatus = Object.fromEntries(RETURN_STATUSES.map((status) => [status, 0]))
  const refundDelays = []
  let paidRevenueCents = 0
  let refundedAmountCents = 0
  let overdueCount = 0

  for (const order of rows) {
    const status = RETURN_STATUSES.includes(order?.returnStatus) ? order.returnStatus : 'none'
    byStatus[status] += 1
    paidRevenueCents += order?.totalCents || 0

    if (status === 'refunded') {
      refundedAmountCents += order?.refundAmountCents || 0
      const requestedAt = toDate(order?.returnRequestedAt)
      const refundedAt = toDate(order?.refundedAt)
      if (requestedAt && refundedAt) {
        refundDelays.push((refundedAt.getTime() - requestedAt.getTime()) / DAY_MS)
      }
    } else if (OPEN_RETURN_STATUSES.includes(status)) {
      // Hors délai légal : la rétractation est notifiée depuis plus de 14 jours
      // et le remboursement n'est toujours pas enregistré.
      if (computeRefundDeadline(order?.returnRequestedAt, now)?.isOverdue) {
        overdueCount += 1
      }
    }
  }

  const paidOrderCount = rows.length
  const openCount = OPEN_RETURN_STATUSES.reduce((sum, status) => sum + byStatus[status], 0)
  const refundedCount = byStatus.refunded

  return {
    paidOrderCount,
    paidRevenueCents,
    byStatus,
    openCount,
    refundedCount,
    refundedAmountCents,
    overdueCount,
    /** Part des commandes payées effectivement remboursées, en %. */
    refundRate: paidOrderCount > 0 ? (refundedCount / paidOrderCount) * 100 : 0,
    /** Part du chiffre d'affaires encaissé rendue au client, en %. */
    refundedRevenueShare:
      paidRevenueCents > 0 ? (refundedAmountCents / paidRevenueCents) * 100 : 0,
    /** Délai moyen demande → remboursement, en jours. */
    avgRefundDelayDays:
      refundDelays.length > 0
        ? refundDelays.reduce((sum, days) => sum + days, 0) / refundDelays.length
        : null,
  }
}

/**
 * Garde de réservation au moment de payer.
 *
 * La réservation posée à l'ouverture du checkout (`create_draft_order` →
 * `reserve_watches_for_order`) dure `reserveMinutes` et n'est balayée par
 * personne : passé ce délai elle cesse simplement de bloquer les autres
 * acheteurs. Or `POST /:orderId/pay` ne regardait que le `status` de la
 * commande — ni `is_sold`, ni la réservation. Un client immobile sur le
 * checkout pouvait donc payer une montre vendue entre-temps à quelqu'un
 * d'autre : `fulfill_order_payment` passait sa commande en `paid` et son
 * `UPDATE watches … AND is_sold = false` ne touchait rien. Deux commandes
 * payées, une montre, un remboursement à faire.
 *
 * D'où ce module : avant de créer ou de réutiliser le PaymentIntent, on
 * revérifie que chaque montre de la commande est toujours vendable, et on
 * reprend la réservation si elle a expiré. Le checkout rappelle `/pay` juste
 * avant `confirmPayment`, donc le contrôle a lieu à l'instant du débit.
 */

/**
 * Marge sous laquelle la réservation est reprise. Au-dessus, on la laisse
 * courir : le checkout appelle `/pay` au simple défilement jusqu'au bloc
 * paiement, et repousser l'échéance à chaque passage rendrait le verrou
 * indéfiniment glissant — le défaut même qu'on cherche à contenir.
 */
const RESERVATION_REFRESH_THRESHOLD_MS = 5 * 60 * 1000

/**
 * Motif qui empêche de payer cette montre, ou `null` si elle est prenable.
 *
 * Reproduit exactement la garde de `reserve_watches_for_order` — y compris son
 * silence sur `stock_quantity`, que le SQL ne regarde pas : refuser ici sur le
 * stock bloquerait des paniers que la réservation, elle, accepte.
 *
 * @param {{ is_sold?: boolean, is_available?: boolean, order_id?: string|null,
 *   checkout_reserved_until?: string|null } | undefined} row
 * @param {string} orderId
 * @param {number} nowMs
 * @returns {'missing' | 'sold' | 'withdrawn' | 'reserved' | null}
 */
function blockingReason(row, orderId, nowMs) {
  // Absente de la réponse : fiche supprimée du catalogue.
  if (!row) return 'missing'
  if (row.is_sold === true) return 'sold'
  if (row.is_available === false) return 'withdrawn'

  const until = row.checkout_reserved_until ? Date.parse(row.checkout_reserved_until) : NaN
  if (Number.isFinite(until) && until > nowMs && row.order_id !== orderId) {
    return 'reserved'
  }
  return null
}

/**
 * Vrai si la commande détient déjà cette montre pour un moment encore.
 * @param {object | undefined} row
 * @param {string} orderId
 * @param {number} nowMs
 * @returns {boolean}
 */
function holdsFreshReservation(row, orderId, nowMs) {
  if (!row || row.order_id !== orderId) return false
  const until = row.checkout_reserved_until ? Date.parse(row.checkout_reserved_until) : NaN
  return Number.isFinite(until) && until - nowMs > RESERVATION_REFRESH_THRESHOLD_MS
}

/**
 * Rédige le refus destiné au client, en nommant les montres fautives — le 409
 * de `create_draft_order` reste anonyme, faute de pouvoir l'interroger ligne à
 * ligne, mais ici on a les fiches sous la main.
 *
 * @param {{ name: string|null, reason: string }[]} blocked
 * @returns {string}
 */
function describeBlockedWatches(blocked) {
  if (!blocked.length) {
    return 'Une ou plusieurs montres de votre commande ne sont plus disponibles.'
  }

  const quote = (entry) => (entry.name ? `« ${entry.name} »` : 'une montre de votre panier')
  const names = blocked.map(quote).join(', ')
  const plural = blocked.length > 1

  // Un seul motif pour tout le lot : on peut être précis.
  const reasons = new Set(blocked.map((entry) => entry.reason))
  if (reasons.size === 1) {
    const [reason] = [...reasons]
    if (reason === 'reserved') {
      return plural
        ? `${names} sont en cours d'achat par d'autres clients. Réessayez dans quelques minutes, ou retirez-les de votre panier.`
        : `${names} est en cours d'achat par un autre client. Réessayez dans quelques minutes, ou retirez-la de votre panier.`
    }
    if (reason === 'sold') {
      return plural
        ? `${names} viennent d'être vendues. Retirez-les de votre panier pour continuer.`
        : `${names} vient d'être vendue. Retirez-la de votre panier pour continuer.`
    }
    return plural
      ? `${names} ne sont plus en vente. Retirez-les de votre panier pour continuer.`
      : `${names} n'est plus en vente. Retirez-la de votre panier pour continuer.`
  }

  return plural
    ? `${names} ne sont plus disponibles à l'achat. Retirez-les de votre panier pour continuer.`
    : `${names} n'est plus disponible à l'achat. Retirez-la de votre panier pour continuer.`
}

/**
 * Lit les lignes de la commande et l'état courant des montres correspondantes.
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} orderId
 * @returns {Promise<{ lines: {watch_id: string, quantity: number}[], watchIds: string[], byId: Map<string, object> }>}
 */
async function loadOrderWatchStates(supabase, orderId) {
  const { data: lines, error: linesError } = await supabase
    .from('order_lines')
    .select('watch_id, quantity')
    .eq('order_id', orderId)

  if (linesError) throw linesError

  const rows = Array.isArray(lines) ? lines : []
  const watchIds = [...new Set(rows.map((line) => line.watch_id).filter(Boolean))]
  if (watchIds.length === 0) {
    return { lines: rows, watchIds, byId: new Map() }
  }

  const { data: watches, error: watchesError } = await supabase
    .from('watches')
    .select('id, name, is_available, is_sold, order_id, checkout_reserved_until')
    .in('id', watchIds)

  if (watchesError) throw watchesError

  return {
    lines: rows,
    watchIds,
    byId: new Map((watches ?? []).map((watch) => [watch.id, watch])),
  }
}

/**
 * @param {Map<string, object>} byId
 * @param {string[]} watchIds
 * @param {string} orderId
 * @param {number} nowMs
 * @returns {{ watchId: string, name: string|null, reason: string }[]}
 */
function collectBlocked(byId, watchIds, orderId, nowMs) {
  const blocked = []
  for (const watchId of watchIds) {
    const row = byId.get(watchId)
    const reason = blockingReason(row, orderId, nowMs)
    if (reason) {
      blocked.push({ watchId, name: row?.name ?? null, reason })
    }
  }
  return blocked
}

/**
 * Revérifie qu'une commande est payable, et reprend sa réservation si besoin.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {{ orderId: string, reserveMinutes: number }} params
 * @returns {Promise<{ ok: true, refreshed: boolean } | { ok: false, blocked: {watchId: string|null, name: string|null, reason: string}[], error: string }>}
 */
async function reacquireOrderReservation(supabase, { orderId, reserveMinutes }) {
  const nowMs = Date.now()
  const { lines, watchIds, byId } = await loadOrderWatchStates(supabase, orderId)

  if (watchIds.length === 0) {
    return {
      ok: false,
      blocked: [],
      error: 'Commande vide : aucune montre à payer.',
    }
  }

  const blocked = collectBlocked(byId, watchIds, orderId, nowMs)
  if (blocked.length > 0) {
    // Constat suffisant : on ne touche pas à `reserve_watches_for_order`, dont
    // la boucle réserverait les premières lignes avant d'échouer sur la
    // fautive — et laisserait la commande tenir des montres qu'elle ne pourra
    // pas payer.
    return { ok: false, blocked, error: describeBlockedWatches(blocked) }
  }

  if (watchIds.every((watchId) => holdsFreshReservation(byId.get(watchId), orderId, nowMs))) {
    return { ok: true, refreshed: false }
  }

  const { data: reserved, error: reserveError } = await supabase.rpc(
    'reserve_watches_for_order',
    {
      p_order_id: orderId,
      p_lines: lines.map((line) => ({ watch_id: line.watch_id, quantity: line.quantity })),
      p_reserve_minutes: reserveMinutes,
    },
  )

  if (reserveError) throw reserveError

  if (reserved !== true) {
    // Course perdue entre le constat et la prise. Les lignes déjà réservées par
    // la boucle SQL restent attachées à cette commande : elles étaient libres,
    // le client les garde le temps de retirer la ligne fautive, et elles
    // expireront d'elles-mêmes s'il abandonne.
    const raced = await loadOrderWatchStates(supabase, orderId)
    const racedBlocked = collectBlocked(raced.byId, raced.watchIds, orderId, Date.now())

    if (racedBlocked.length === 0) {
      // Plus rien ne bloque : la réservation adverse a lapsé entre l'échec et
      // la relecture. Refuser ici afficherait « montre indisponible » sur un
      // panier redevenu prenable, à l'instant où le client clique « Payer » —
      // une seconde tentative coûte moins cher que ce faux refus.
      const { data: retried, error: retryError } = await supabase.rpc(
        'reserve_watches_for_order',
        {
          p_order_id: orderId,
          p_lines: lines.map((line) => ({ watch_id: line.watch_id, quantity: line.quantity })),
          p_reserve_minutes: reserveMinutes,
        },
      )
      if (retryError) throw retryError
      if (retried === true) {
        return { ok: true, refreshed: true }
      }
    }

    return {
      ok: false,
      blocked: racedBlocked,
      error: describeBlockedWatches(racedBlocked),
    }
  }

  return { ok: true, refreshed: true }
}

module.exports = {
  RESERVATION_REFRESH_THRESHOLD_MS,
  blockingReason,
  holdsFreshReservation,
  describeBlockedWatches,
  reacquireOrderReservation,
}

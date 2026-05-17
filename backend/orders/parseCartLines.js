/** Nombre max de références différentes par commande panier. */
const MAX_CART_CHECKOUT_LINES = 10
/** Nombre max d'unités (somme des quantités) par commande panier. */
const MAX_CART_CHECKOUT_UNITS = 10

/**
 * Normalise le corps de requête panier : `lines` [{ watchId, quantity }] ou legacy `watchIds`.
 * @param {unknown} body
 * @returns {{ watchId: string, quantity: number }[]}
 */
function parseCartCheckoutLines(body) {
  const linesRaw = body?.lines
  if (Array.isArray(linesRaw) && linesRaw.length > 0) {
    const acc = new Map()
    for (const row of linesRaw) {
      const wid = String(row?.watchId ?? row?.watch_id ?? '').trim()
      if (!wid) continue
      const q = Math.min(99, Math.max(1, parseInt(String(row?.quantity), 10) || 1))
      acc.set(wid, (acc.get(wid) || 0) + q)
    }
    return [...acc.entries()].map(([watchId, quantity]) => ({ watchId, quantity }))
  }
  const rawIds = body?.watchIds
  if (!Array.isArray(rawIds)) {
    return []
  }
  const acc = new Map()
  for (const x of rawIds) {
    const wid = String(x).trim()
    if (!wid) continue
    acc.set(wid, (acc.get(wid) || 0) + 1)
  }
  return [...acc.entries()].map(([watchId, quantity]) => ({ watchId, quantity }))
}

/**
 * @param {{ watchId: string, quantity: number }[]} lines
 * @returns {{ ok: true, lines: typeof lines } | { ok: false, error: string, status: number }}
 */
function validateCartLines(lines) {
  if (!lines.length) {
    return { ok: false, error: 'Panier vide', status: 400 }
  }
  const watchIds = [...new Set(lines.map((l) => l.watchId))]
  const totalUnits = lines.reduce((s, l) => s + l.quantity, 0)
  if (watchIds.length > MAX_CART_CHECKOUT_LINES) {
    return {
      ok: false,
      error: `Maximum ${MAX_CART_CHECKOUT_LINES} références différentes par commande`,
      status: 400,
    }
  }
  if (totalUnits > MAX_CART_CHECKOUT_UNITS) {
    return {
      ok: false,
      error: `Maximum ${MAX_CART_CHECKOUT_UNITS} articles par commande`,
      status: 400,
    }
  }
  return { ok: true, lines }
}

/**
 * @param {{ watchId: string, quantity: number }[]} lines
 * @returns {{ watch_id: string, quantity: number }[]}
 */
function linesToRpcPayload(lines) {
  return lines.map((l) => ({ watch_id: l.watchId, quantity: l.quantity }))
}

module.exports = {
  parseCartCheckoutLines,
  validateCartLines,
  linesToRpcPayload,
  MAX_CART_CHECKOUT_LINES,
  MAX_CART_CHECKOUT_UNITS,
}

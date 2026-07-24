/**
 * Interception réseau pour des tests de tunnel d'achat hermétiques.
 *
 * - Contourne la page de maintenance et amorce le panier via localStorage.
 * - Neutralise tous les appels Supabase (REST / auth / storage) → réponses vides.
 * - Simule le « backend commandes » Express (POST /api/orders, etc.) avec un
 *   état en mémoire, pour rejouer le cycle de vie d'une commande draft sans
 *   dépendre d'un serveur ni de Stripe.
 */

import {
  cartStorageKey,
  maintenanceKey,
  cartLineFromWatch,
  catalogFromWatches,
  SAMPLE_WATCH,
  watchDbRow,
  watchDetailsDbRow,
  watchImagesDbRows,
} from './fixtures.js'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'authorization,content-type,x-site-id',
}

function json(body, status = 200) {
  return {
    status,
    contentType: 'application/json',
    headers: CORS_HEADERS,
    body: JSON.stringify(body),
  }
}

/** Amorce l'état navigateur (maintenance + panier) avant tout chargement de page. */
export async function seedBrowser(page, { cartLines, siteId } = {}) {
  const lines = cartLines || [cartLineFromWatch(SAMPLE_WATCH)]
  await page.addInitScript(
    ({ maintKey, cartKey, cart }) => {
      try {
        localStorage.setItem(maintKey, 'true')
        localStorage.setItem(cartKey, JSON.stringify(cart))
      } catch {
        /* localStorage indisponible : ignoré */
      }
    },
    { maintKey: maintenanceKey(siteId), cartKey: cartStorageKey(siteId), cart: lines },
  )
}

/** Coupe tout le trafic Supabase : listings vides, pas d'auth. */
export async function stubSupabase(page) {
  await page.route('**/stub.supabase.test/**', (route) => {
    const url = route.request().url()
    // Auth / token : renvoyer une absence de session.
    if (url.includes('/auth/v1/')) {
      return route.fulfill(json({}, 200))
    }
    // REST / RPC : collections vides (le storefront dégrade proprement).
    return route.fulfill(json([], 200))
  })
}

/** Erreur PostgREST « 0 ligne » pour un `.single()` sans résultat. */
const PGRST_NO_ROWS = {
  code: 'PGRST116',
  message: 'JSON object requested, multiple (or no) rows returned',
  details: 'Results contain 0 rows',
}

/**
 * Stub Supabase « catalogue » : sert des montres factices sur les tables
 * `watches` / `watch_details` / `watch_images`, pour rendre les pages
 * collection et fiche produit sans base réelle.
 *
 * @param {import('@playwright/test').Page} page
 * @param {{ watches?: Array }} [opts]
 */
export async function stubSupabaseCatalog(page, { watches = [SAMPLE_WATCH] } = {}) {
  const rows = {
    watches: watches.map((w) => watchDbRow(w)),
    watch_details: watches.map((w) => watchDetailsDbRow(w)),
    watch_images: watches.flatMap((w) => watchImagesDbRows(w)),
  }

  await page.route('**/stub.supabase.test/**', (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const isSingle = (request.headers()['accept'] || '').includes('vnd.pgrst.object')

    // Auth : pas de session.
    if (url.pathname.includes('/auth/v1/')) {
      return route.fulfill(json({}, 200))
    }

    // REST : /rest/v1/<table>
    const match = url.pathname.match(/\/rest\/v1\/([^/?]+)/)
    const table = match ? match[1] : null
    const data = table && rows[table] ? rows[table] : []

    if (isSingle) {
      if (!data.length) {
        return route.fulfill(json(PGRST_NO_ROWS, 406))
      }
      return route.fulfill(json(data[0]))
    }
    return route.fulfill(json(data))
  })
}

/**
 * Backend commandes simulé, avec état.
 * @param {import('@playwright/test').Page} page
 * @param {{ watches?: Array }} [opts]
 * @returns {{ calls: string[], state: object }}
 */
export async function mockOrderBackend(page, { watches = [SAMPLE_WATCH], verify } = {}) {
  const catalog = catalogFromWatches(watches)
  const calls = []
  const state = { order: null, accessToken: 'e2e-access-token' }

  /** Réponse de GET /verify (lien de retour paiement) — indépendante de l'état. */
  function buildVerifyPayload() {
    if (verify) return verify
    const linesArr = Object.values(catalog).map((c) => ({
      id: `line-${c.watchId}`,
      watch_id: c.watchId,
      name: c.name,
      reference: c.reference,
      quantity: 1,
      unit_price_cents: c.unitPriceCents,
      image_url: c.imageUrl,
    }))
    const subtotalCents = linesArr.reduce((s, l) => s + l.unit_price_cents * l.quantity, 0)
    return {
      valid: true,
      order: {
        totalCents: subtotalCents,
        subtotalCents,
        shippingCents: 0,
        discountCents: 0,
        customerEmail: 'acheteur@example.com',
        shippingMethodType: 'shipping',
        shippingMethodLabel: 'Livraison à domicile',
      },
      lines: linesArr,
    }
  }

  function computeQuote(order) {
    const subtotalCents = order.lines.reduce(
      (sum, l) => sum + l.unitPriceCents * l.quantity,
      0,
    )
    const shippingCents = order.shippingMethodId ? 0 : 0
    const discountCents = order.discountCents || 0
    return {
      subtotalCents,
      shippingCents,
      discountCents,
      totalCents: subtotalCents + shippingCents - discountCents,
    }
  }

  function snapshot(withToken = false) {
    const order = state.order
    return {
      success: true,
      order: {
        id: order.id,
        status: order.status,
        currency: 'EUR',
        customerEmail: order.customerEmail || null,
        customerPhone: order.customerPhone || null,
        billingAddress: order.billingAddress || null,
        shippingAddress: order.shippingAddress || null,
        expiresAt: order.expiresAt,
        paidAt: null,
        lines: order.lines.map((l) => ({
          watchId: l.watchId,
          name: l.name,
          reference: l.reference,
          unitPriceCents: l.unitPriceCents,
          quantity: l.quantity,
          imageUrl: l.imageUrl,
        })),
        quote: computeQuote(order),
      },
      ...(withToken ? { accessToken: state.accessToken, orderId: order.id } : {}),
    }
  }

  function createFromLines(reqLines) {
    const lines = reqLines
      .filter((l) => catalog[l.watchId])
      .map((l) => ({
        ...catalog[l.watchId],
        quantity: Math.max(1, Number(l.quantity) || 1),
      }))
    state.order = {
      id: 'e2e-order-001',
      status: 'draft',
      lines,
      expiresAt: new Date(Date.now() + 30 * 60_000).toISOString(),
      discountCents: 0,
      shippingMethodId: null,
    }
  }

  await page.route('**/api/orders**', async (route) => {
    const request = route.request()
    const method = request.method()
    const url = new URL(request.url())
    const path = url.pathname
    calls.push(`${method} ${path}`)

    if (method === 'OPTIONS') {
      return route.fulfill({ status: 204, headers: CORS_HEADERS, body: '' })
    }

    // POST /api/orders — création de la commande draft.
    if (method === 'POST' && /\/api\/orders$/.test(path)) {
      const payload = request.postDataJSON?.() || {}
      createFromLines(payload.lines || [])
      return route.fulfill(json(snapshot(true)))
    }

    // GET /api/orders/:id/verify — retour paiement (accès direct par lien).
    if (method === 'GET' && /\/verify$/.test(path)) {
      return route.fulfill(json(buildVerifyPayload()))
    }

    // POST /api/orders/:id/cancel — accessible même sans commande en mémoire
    // (le lien d'annulation porte order + token).
    if (method === 'POST' && /\/cancel$/.test(path)) {
      if (state.order) state.order.status = 'cancelled'
      return route.fulfill(json({ success: true }))
    }

    if (!state.order) {
      return route.fulfill(json({ success: false, error: 'Commande introuvable' }, 404))
    }

    // POST /api/orders/:id/pay — secret client Stripe factice.
    if (method === 'POST' && /\/pay$/.test(path)) {
      return route.fulfill(json({ success: true, clientSecret: 'pi_e2e_secret_123' }))
    }

    // POST /api/orders/:id/promo — applique / retire un code.
    if (method === 'POST' && /\/promo$/.test(path)) {
      const body = request.postDataJSON?.() || {}
      if (body.remove) {
        state.order.discountCents = 0
      } else if (String(body.code || '').toUpperCase() === 'E2E10') {
        const subtotal = state.order.lines.reduce(
          (s, l) => s + l.unitPriceCents * l.quantity,
          0,
        )
        state.order.discountCents = Math.round(subtotal * 0.1)
      } else {
        return route.fulfill(json({ success: false, error: 'Code promo invalide' }, 400))
      }
      return route.fulfill(json(snapshot()))
    }

    // PATCH /api/orders/:id/customer
    if (method === 'PATCH' && /\/customer$/.test(path)) {
      const body = request.postDataJSON?.() || {}
      state.order.customerEmail = body.email || null
      state.order.customerPhone = body.phone || null
      state.order.billingAddress = body.billingAddress || null
      return route.fulfill(json(snapshot()))
    }

    // PATCH /api/orders/:id/shipping
    if (method === 'PATCH' && /\/shipping$/.test(path)) {
      const body = request.postDataJSON?.() || {}
      state.order.shippingMethodId = body.methodId || null
      state.order.shippingAddress = body.shippingAddress || null
      return route.fulfill(json(snapshot()))
    }

    // GET /api/orders/:id
    if (method === 'GET') {
      return route.fulfill(json(snapshot()))
    }

    return route.fulfill(json({ success: false, error: 'Non géré' }, 405))
  })

  return { calls, state }
}

/** Installe l'ensemble panier + Supabase + backend commandes. */
export async function installCheckoutMocks(page, opts = {}) {
  const watches = opts.watches || [SAMPLE_WATCH]
  await seedBrowser(page, { cartLines: (opts.watches || [SAMPLE_WATCH]).map(cartLineFromWatch) })
  await stubSupabase(page)
  return mockOrderBackend(page, { watches })
}

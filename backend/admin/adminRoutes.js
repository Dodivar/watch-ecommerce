const { getSupabaseClient, MissingSecretsError } = require('../utils/siteClients')
const { resolveReceiptConfig } = require('../orders/receiptBranding')
const { resolveOrderReceiptPdfBuffer } = require('../orders/receiptStorage')
const { receiptPdfFilename } = require('../orders/receiptPdf')

/**
 * Persiste un lead formulaire en base après envoi email réussi.
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} siteId
 * @param {string} type
 * @param {Record<string, string>} formData
 * @param {{ originalname: string }[]} [files]
 */
async function persistLeadSubmission(supabase, siteId, type, formData, files = []) {
  const allowed = ['contact', 'appointment', 'estimation', 'search']
  if (!allowed.includes(type)) return

  const customerName = formData.name?.trim() || null
  const customerEmail = formData.email?.trim() || null

  /** @type {Record<string, unknown>} */
  const payload = { ...formData }
  if (files.length > 0) {
    payload.attachments = files.map((f) => ({ name: f.originalname }))
  }

  let watchId = formData.watch_id?.trim() || null
  if (!watchId && formData.watch_name?.trim()) {
    const { data: watchRow } = await supabase
      .from('watches')
      .select('id')
      .ilike('name', formData.watch_name.trim())
      .limit(1)
      .maybeSingle()
    watchId = watchRow?.id ?? null
  }

  const { error } = await supabase.from('lead_submissions').insert({
    site_id: siteId,
    type,
    status: 'new',
    customer_name: customerName,
    customer_email: customerEmail,
    watch_id: watchId,
    payload,
  })

  if (error) {
    console.error(`[${siteId}] persistLeadSubmission:`, error.message)
  }
}

/**
 * Vérifie le JWT Supabase et la whitelist admin_users.
 * @param {object} site
 * @param {string} bearerToken
 */
async function verifyAdminBearerToken(site, bearerToken) {
  if (!bearerToken) {
    return { ok: false, status: 401, error: 'Token manquant' }
  }

  let supabase
  try {
    supabase = getSupabaseClient(site)
  } catch (e) {
    if (e instanceof MissingSecretsError) {
      return { ok: false, status: 503, error: e.message }
    }
    throw e
  }

  const { data: userData, error: userError } = await supabase.auth.getUser(bearerToken)
  if (userError || !userData?.user?.email) {
    return { ok: false, status: 401, error: 'Session invalide' }
  }

  const email = userData.user.email
  let { data: adminRow, error: adminError } = await supabase
    .from('admin_users')
    .select('email, role')
    .eq('email', email)
    .maybeSingle()

  // Tenant pré-migration rôles : la colonne role n'existe pas encore.
  if (adminError && /role/.test(adminError.message || '')) {
    ;({ data: adminRow, error: adminError } = await supabase
      .from('admin_users')
      .select('email')
      .eq('email', email)
      .maybeSingle())
  }

  if (adminError || !adminRow) {
    return { ok: false, status: 403, error: 'Accès admin refusé' }
  }

  return { ok: true, email, role: adminRow.role || 'admin', supabase }
}

/**
 * Middleware Express — restreint une route aux rôles admin donnés.
 * À utiliser après requireAdminAuth.
 * @param {...string} roles
 */
function requireAdminRole(...roles) {
  return (req, res, next) => {
    if (roles.includes(req.adminUser?.role)) return next()
    return res.status(403).json({ success: false, error: 'Accès réservé à l’administrateur' })
  }
}

/**
 * Middleware Express — auth admin via Authorization: Bearer.
 * @param {*} registry
 */
function requireAdminAuth(registry) {
  return async (req, res, next) => {
    const site = req.site
    if (!site) {
      return res.status(400).json({ success: false, error: 'Site introuvable' })
    }

    const auth = req.headers.authorization || ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : ''
    const result = await verifyAdminBearerToken(site, token)
    if (!result.ok) {
      return res.status(result.status).json({ success: false, error: result.error })
    }

    req.adminUser = { email: result.email, role: result.role }
    req.adminSupabase = result.supabase
    return next()
  }
}

/**
 * @param {*} registry
 */
function buildAdminRouter(registry) {
  const express = require('express')
  const { registerAdminUsersRoutes } = require('./adminUsersRoutes')
  const router = express.Router()

  // Gestion des utilisateurs du panel — réservée au rôle admin.
  const usersRouter = express.Router()
  usersRouter.use(requireAdminAuth(registry), requireAdminRole('admin'))
  registerAdminUsersRoutes(usersRouter)
  router.use('/users', usersRouter)

  router.get('/orders/:orderId/receipt', requireAdminAuth(registry), async (req, res) => {
    const site = req.site
    const orderId = req.params.orderId

    if (!resolveReceiptConfig(site).enabled) {
      return res.status(404).json({ success: false, error: 'Reçu indisponible' })
    }

    try {
      const supabase = getSupabaseClient(site)
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .eq('site_id', site.id)
        .maybeSingle()

      if (orderError) throw orderError
      if (!order) {
        return res.status(404).json({ success: false, error: 'Commande introuvable' })
      }
      if (order.status !== 'paid') {
        return res.status(400).json({
          success: false,
          error: 'Reçu disponible après paiement uniquement',
        })
      }

      const { data: lines, error: linesError } = await supabase
        .from('order_lines')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at')

      if (linesError) throw linesError

      const { data: shippingRow } = await supabase
        .from('order_shipping')
        .select('*')
        .eq('order_id', orderId)
        .maybeSingle()

      const { data: discountRow } = await supabase
        .from('order_discounts')
        .select('*')
        .eq('order_id', orderId)
        .maybeSingle()

      const pdfBuffer = await resolveOrderReceiptPdfBuffer(supabase, site, order, lines || [], {
        shipping: shippingRow || null,
        discount: discountRow || null,
      })

      if (!pdfBuffer) {
        return res.status(500).json({ success: false, error: 'Impossible de générer le reçu' })
      }

      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', `attachment; filename="${receiptPdfFilename(orderId)}"`)
      res.send(pdfBuffer)
    } catch (e) {
      if (e instanceof MissingSecretsError) {
        return res.status(503).json({ success: false, error: e.message })
      }
      console.error(`[${site.id}] GET admin receipt:`, e)
      res.status(500).json({ success: false, error: 'Erreur serveur' })
    }
  })

  return router
}

module.exports = {
  persistLeadSubmission,
  verifyAdminBearerToken,
  requireAdminAuth,
  requireAdminRole,
  buildAdminRouter,
}

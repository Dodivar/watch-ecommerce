const { getSupabaseClient, MissingSecretsError } = require('../utils/siteClients')

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
  const { data: adminRow, error: adminError } = await supabase
    .from('admin_users')
    .select('email')
    .eq('email', email)
    .maybeSingle()

  if (adminError || !adminRow) {
    return { ok: false, status: 403, error: 'Accès admin refusé' }
  }

  return { ok: true, email, supabase }
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

    req.adminUser = { email: result.email }
    req.adminSupabase = result.supabase
    return next()
  }
}

/**
 * @param {*} registry
 */
function buildAdminRouter(registry) {
  const express = require('express')
  const router = express.Router()
  return router
}

module.exports = {
  persistLeadSubmission,
  verifyAdminBearerToken,
  requireAdminAuth,
  buildAdminRouter,
}

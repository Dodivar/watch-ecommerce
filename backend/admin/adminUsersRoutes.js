const { getSupabaseClient, MissingSecretsError } = require('../utils/siteClients')
const { getBaseUrl } = require('../utils/getBaseUrl')

const VALID_ROLES = ['admin', 'moderator', 'visitor']
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Liste complète des utilisateurs admin (table petite : comparaison
 * insensible à la casse faite en JS).
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 */
async function fetchAdminUsers(supabase) {
  const { data, error } = await supabase.from('admin_users').select('email, role')
  if (error) throw new Error(error.message)
  return data || []
}

/**
 * @param {{ email: string, role?: string }[]} users
 * @param {string} email
 */
function findUserByEmail(users, email) {
  const needle = email.toLowerCase()
  return users.find((u) => (u.email || '').toLowerCase() === needle) || null
}

/**
 * @param {{ role?: string }[]} users
 */
function countAdmins(users) {
  return users.filter((u) => (u.role || 'admin') === 'admin').length
}

/**
 * Recherche l'utilisateur Supabase Auth correspondant à un email (pagination).
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} email
 */
async function findAuthUserByEmail(supabase, email) {
  const needle = email.toLowerCase()
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 100 })
    if (error || !data?.users?.length) return null
    const match = data.users.find((u) => (u.email || '').toLowerCase() === needle)
    if (match) return match
    if (data.users.length < 100) return null
  }
  return null
}

/**
 * Monte les routes de gestion des utilisateurs admin (rôle admin requis,
 * appliqué en amont par le routeur parent).
 * @param {import('express').Router} router
 */
function registerAdminUsersRoutes(router) {
  // Invitation : envoi de l'email Supabase + ajout à la whitelist avec rôle.
  router.post('/invite', async (req, res) => {
    const site = req.site
    const email = String(req.body?.email || '').trim().toLowerCase()
    const role = String(req.body?.role || '').trim()

    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ success: false, error: 'Adresse email invalide' })
    }
    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({ success: false, error: 'Rôle invalide' })
    }

    try {
      const supabase = getSupabaseClient(site)
      const users = await fetchAdminUsers(supabase)
      if (findUserByEmail(users, email)) {
        return res
          .status(409)
          .json({ success: false, error: 'Cet email a déjà accès au panel d’administration' })
      }

      const redirectTo = `${getBaseUrl(site)}/admin/set-password`
      const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
        email,
        { redirectTo },
      )

      // Compte auth déjà existant : on ajoute simplement l'accès, sans email.
      const alreadyRegistered =
        inviteError &&
        (inviteError.status === 422 || /already.*(regist|exist)/i.test(inviteError.message || ''))
      if (inviteError && !alreadyRegistered) {
        console.error(`[${site.id}] invite admin user:`, inviteError.message)
        return res
          .status(502)
          .json({ success: false, error: 'L’envoi de l’email d’invitation a échoué' })
      }

      const { error: insertError } = await supabase.from('admin_users').insert({ email, role })
      if (insertError) {
        // Ne pas laisser un compte auth orphelin si l'invitation vient d'être créée.
        if (!alreadyRegistered && inviteData?.user?.id) {
          await supabase.auth.admin.deleteUser(inviteData.user.id).catch(() => {})
        }
        console.error(`[${site.id}] insert admin user:`, insertError.message)
        return res.status(500).json({ success: false, error: 'Impossible d’ajouter l’utilisateur' })
      }

      return res.json({ success: true, invited: !alreadyRegistered, email, role })
    } catch (e) {
      if (e instanceof MissingSecretsError) {
        return res.status(503).json({ success: false, error: e.message })
      }
      console.error(`[${site.id}] POST admin users invite:`, e)
      return res.status(500).json({ success: false, error: 'Erreur serveur' })
    }
  })

  // Changement de rôle.
  router.patch('/:email', async (req, res) => {
    const site = req.site
    const email = decodeURIComponent(req.params.email || '').trim().toLowerCase()
    const role = String(req.body?.role || '').trim()

    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({ success: false, error: 'Rôle invalide' })
    }
    if (email === (req.adminUser?.email || '').toLowerCase()) {
      return res
        .status(403)
        .json({ success: false, error: 'Vous ne pouvez pas modifier votre propre rôle' })
    }

    try {
      const supabase = getSupabaseClient(site)
      const users = await fetchAdminUsers(supabase)
      const target = findUserByEmail(users, email)
      if (!target) {
        return res.status(404).json({ success: false, error: 'Utilisateur introuvable' })
      }
      if ((target.role || 'admin') === 'admin' && role !== 'admin' && countAdmins(users) <= 1) {
        return res
          .status(400)
          .json({ success: false, error: 'Impossible de rétrograder le dernier administrateur' })
      }

      const { error } = await supabase
        .from('admin_users')
        .update({ role })
        .eq('email', target.email)
      if (error) throw new Error(error.message)

      return res.json({ success: true, email: target.email, role })
    } catch (e) {
      if (e instanceof MissingSecretsError) {
        return res.status(503).json({ success: false, error: e.message })
      }
      console.error(`[${site.id}] PATCH admin user:`, e)
      return res.status(500).json({ success: false, error: 'Erreur serveur' })
    }
  })

  // Suppression (whitelist + compte auth, pour permettre une ré-invitation propre).
  router.delete('/:email', async (req, res) => {
    const site = req.site
    const email = decodeURIComponent(req.params.email || '').trim().toLowerCase()

    if (email === (req.adminUser?.email || '').toLowerCase()) {
      return res
        .status(403)
        .json({ success: false, error: 'Vous ne pouvez pas supprimer votre propre compte' })
    }

    try {
      const supabase = getSupabaseClient(site)
      const users = await fetchAdminUsers(supabase)
      const target = findUserByEmail(users, email)
      if (!target) {
        return res.status(404).json({ success: false, error: 'Utilisateur introuvable' })
      }
      if ((target.role || 'admin') === 'admin' && countAdmins(users) <= 1) {
        return res
          .status(400)
          .json({ success: false, error: 'Impossible de supprimer le dernier administrateur' })
      }

      const { error } = await supabase.from('admin_users').delete().eq('email', target.email)
      if (error) throw new Error(error.message)

      const authUser = await findAuthUserByEmail(supabase, email).catch(() => null)
      if (authUser) {
        await supabase.auth.admin.deleteUser(authUser.id).catch((e2) => {
          console.warn(`[${site.id}] delete auth user ${email}:`, e2?.message || e2)
        })
      }

      return res.json({ success: true, email: target.email })
    } catch (e) {
      if (e instanceof MissingSecretsError) {
        return res.status(503).json({ success: false, error: e.message })
      }
      console.error(`[${site.id}] DELETE admin user:`, e)
      return res.status(500).json({ success: false, error: 'Erreur serveur' })
    }
  })
}

module.exports = { registerAdminUsersRoutes }

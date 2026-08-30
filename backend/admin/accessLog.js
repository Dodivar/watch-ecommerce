/**
 * Journal d'accès au panel d'administration.
 *
 * Sans trace, impossible de démontrer au client qu'un accès de support est
 * resté en lecture. Le journal est alimenté en service role : la table est en
 * lecture seule pour tout compte du panel, administrateur compris.
 */

/**
 * Volontairement silencieux en cas d'échec — un journal indisponible ne doit
 * pas empêcher un support de déboguer un incident en cours.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} siteId
 * @param {{ email: string, role: string, action: string, path?: string|null,
 *   ip?: string|null, userAgent?: string|null }} entry
 */
async function logAdminAccess(supabase, siteId, entry) {
  try {
    const { error } = await supabase.from('admin_access_log').insert({
      site_id: siteId,
      email: entry.email,
      role: entry.role,
      action: entry.action,
      path: entry.path ? String(entry.path).slice(0, 500) : null,
      ip: entry.ip ? String(entry.ip).slice(0, 100) : null,
      user_agent: entry.userAgent ? String(entry.userAgent).slice(0, 300) : null,
    })
    // Tenant sans la migration accès support : ne pas polluer les logs.
    if (error && !/does not exist/i.test(error.message || '')) {
      console.warn(`[${siteId}] admin_access_log:`, error.message)
    }
  } catch (e) {
    console.warn(`[${siteId}] admin_access_log:`, e?.message || e)
  }
}

module.exports = { logAdminAccess }

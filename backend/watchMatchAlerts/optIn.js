/**
 * Enregistrement d'une alerte « coup de foudre » avec consentement explicite horodaté.
 *
 * Même forme que `newsletter/optIn.js`, deux différences assumées :
 *
 * - le consentement est **exigé** (`consent`), là où la newsletter accepte un opt-in implicite
 *   depuis un formulaire de contact : ici l'e-mail est la seule raison d'être de la collecte ;
 * - une seconde inscription **remplace les préférences** mais **garde le premier consentement**.
 *   Un visiteur qui refait le parcours affine ses critères, il ne redonne pas son accord ; c'est
 *   la date du premier oui qui fait foi en cas de contestation.
 */

const { loadMatchCore } = require('./core')

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * @param {unknown} value
 * @returns {boolean}
 */
function isValidEmail(value) {
  return typeof value === 'string' && EMAIL_RE.test(value.trim())
}

/**
 * Ajoute (ou réactive) une alerte. Contrairement à `recordNewsletterOptIn`, remonte l'échec :
 * l'appelant est une route dédiée, pas un formulaire dont l'envoi doit aboutir malgré tout.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase Client service role
 * @param {string} siteId
 * @param {{ email?: string, criteria?: unknown, locale?: unknown }} input
 * @returns {Promise<{ ok: boolean, error?: string, reactivated?: boolean }>}
 */
async function recordMatchAlertOptIn(supabase, siteId, { email, criteria, locale } = {}) {
  const clean = String(email || '')
    .trim()
    .toLowerCase()
  if (!isValidEmail(clean)) return { ok: false, error: 'Adresse email invalide' }

  const { sanitizePreferences, normalizeAlertLocale } = await loadMatchCore()

  // Frontière de validation : ce que le client envoie ne franchit cette ligne que sous la forme
  // que `sanitizePreferences` connaît. C'est ici que l'historique de swipe (`seen`, `liked`,
  // `passed`) est écarté — par construction, et non par une liste de champs interdits.
  const safeCriteria = sanitizePreferences(criteria)
  const safeLocale = normalizeAlertLocale(locale)
  const nowIso = new Date().toISOString()

  const { data: existing, error: selectError } = await supabase
    .from('watch_match_alerts')
    .select('id, consent_at')
    .eq('site_id', siteId)
    .eq('email', clean)
    .maybeSingle()

  if (selectError) throw selectError

  if (existing) {
    const { error } = await supabase
      .from('watch_match_alerts')
      .update({
        criteria: safeCriteria,
        locale: safeLocale,
        status: 'active',
        unsubscribed_at: null,
        consent_at: existing.consent_at || nowIso,
        updated_at: nowIso,
      })
      .eq('id', existing.id)
    if (error) throw error
    return { ok: true, reactivated: true }
  }

  const { error } = await supabase.from('watch_match_alerts').insert({
    site_id: siteId,
    email: clean,
    criteria: safeCriteria,
    locale: safeLocale,
    status: 'active',
    source: 'matchmaking',
    consent_at: nowIso,
  })
  if (error) throw error
  return { ok: true, reactivated: false }
}

module.exports = { recordMatchAlertOptIn, isValidEmail }

/**
 * Enregistrement d'un consentement newsletter partagé entre points de collecte
 * (formulaire d'inscription vitrine, formulaires de contact/RDV/estimation/recherche,
 * tunnel de commande). Une seule source de vérité : `newsletter_subscribers`.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Interprète une valeur de case à cocher (form multipart → chaîne, JSON → booléen).
 * @param {unknown} value
 * @returns {boolean}
 */
function isOptInTruthy(value) {
  return value === true || value === 'true' || value === 'on' || value === '1' || value === 1
}

/**
 * Ajoute (ou réactive) un abonné avec consentement explicite horodaté.
 * Ne lève jamais : un échec ne doit pas casser la soumission du formulaire ou de la commande.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase Client service role
 * @param {string} siteId
 * @param {{ email?: string, name?: string }} input
 * @returns {Promise<{ ok: boolean }>}
 */
async function recordNewsletterOptIn(supabase, siteId, { email, name } = {}) {
  const clean = String(email || '').trim().toLowerCase()
  if (!EMAIL_RE.test(clean)) return { ok: false }

  try {
    const nowIso = new Date().toISOString()
    const { data: existing } = await supabase
      .from('newsletter_subscribers')
      .select('id, consent_at')
      .eq('site_id', siteId)
      .eq('email', clean)
      .maybeSingle()

    if (existing) {
      await supabase
        .from('newsletter_subscribers')
        .update({
          status: 'subscribed',
          unsubscribed_at: null,
          consent_at: existing.consent_at || nowIso,
          name: name || undefined,
          updated_at: nowIso,
        })
        .eq('id', existing.id)
    } else {
      await supabase.from('newsletter_subscribers').insert({
        site_id: siteId,
        email: clean,
        name: name || null,
        status: 'subscribed',
        source: 'optin',
        consent_at: nowIso,
      })
    }
    return { ok: true }
  } catch (e) {
    console.error(`[${siteId}] recordNewsletterOptIn:`, e.message)
    return { ok: false }
  }
}

module.exports = { recordNewsletterOptIn, isOptInTruthy }

/**
 * Photos de montres : la seule façon, côté backend, de passer d'une ligne `watch_images` à une
 * URL affichable.
 *
 * La table porte deux formes selon l'âge de la fiche : `image_url` pour les photos importées
 * avec une URL absolue, `image_path` pour celles déposées dans le bucket Storage `watch-images`.
 * Les appelants ne devraient pas avoir à connaître cette distinction — l'alerte « coup de
 * foudre » la portait seule, en interne ; elle est maintenant partagée avec les e-mails de
 * rendez-vous.
 */

/** Bucket Storage des photos de montres. */
const WATCH_IMAGES_BUCKET = 'watch-images'

/**
 * URL publique d'une ligne `watch_images` (colonne directe, sinon chemin dans le bucket).
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {{ image_url?: string | null, image_path?: string | null } | null | undefined} record
 * @returns {string | null}
 */
function publicWatchImageUrl(supabase, record) {
  if (!record) return null
  if (record.image_url) return record.image_url
  if (record.image_path) {
    const { data } = supabase.storage.from(WATCH_IMAGES_BUCKET).getPublicUrl(record.image_path)
    return data?.publicUrl || null
  }
  return null
}

/**
 * Photo principale d'une montre : la première dans l'ordre d'affichage de la fiche.
 *
 * Ne lève jamais : une photo introuvable ou une base injoignable rend `null`, et l'e-mail
 * appelant part sans image plutôt que de ne pas partir du tout.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} watchId
 * @returns {Promise<string | null>}
 */
async function fetchWatchImageUrl(supabase, watchId) {
  const id = String(watchId || '').trim()
  if (!supabase || !id) return null

  try {
    const { data, error } = await supabase
      .from('watch_images')
      .select('image_url, image_path, image_order')
      .eq('watch_id', id)
      .order('image_order', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error(`watch_images (${id}):`, error.message)
      return null
    }
    return publicWatchImageUrl(supabase, data)
  } catch (e) {
    console.error(`watch_images (${id}):`, e.message)
    return null
  }
}

module.exports = {
  WATCH_IMAGES_BUCKET,
  publicWatchImageUrl,
  fetchWatchImageUrl,
}

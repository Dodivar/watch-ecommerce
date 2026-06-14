import { supabase } from '../supabase'
import { getAdminSiteId } from './adminSiteContext.js'

/**
 * @param {'nouvelles' | 'selection'} context
 * @param {string} [selectionKey]
 */
export async function getFeaturedWatchesForAdmin(context, selectionKey = null) {
  const siteId = getAdminSiteId()
  let query = supabase
    .from('home_featured_watches')
    .select('*, watches(id, name, brand, price, is_available)')
    .eq('site_id', siteId)
    .eq('context', context)
    .order('display_order', { ascending: false })

  if (selectionKey) {
    query = query.eq('selection_key', selectionKey)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data || []
}

/**
 * @param {'nouvelles' | 'selection'} context
 * @param {string} watchId
 * @param {string} [selectionKey]
 */
export async function addFeaturedWatch(context, watchId, selectionKey = null) {
  const siteId = getAdminSiteId()

  const { data: maxRow } = await supabase
    .from('home_featured_watches')
    .select('display_order')
    .eq('site_id', siteId)
    .eq('context', context)
    .order('display_order', { ascending: false })
    .limit(1)
    .maybeSingle()

  const displayOrder = (maxRow?.display_order ?? 0) + 1

  const { error } = await supabase.from('home_featured_watches').insert({
    site_id: siteId,
    watch_id: watchId,
    context,
    selection_key: selectionKey,
    display_order: displayOrder,
  })

  if (error) throw new Error(error.message)
  return { success: true }
}

/**
 * Remplace l'ensemble des montres mises en avant pour un contexte donné.
 * Supprime les lignes existantes puis réinsère la sélection ordonnée.
 * Le premier `watchId` est affiché en tête (tri public par display_order décroissant).
 * @param {'nouvelles' | 'selection'} context
 * @param {string[]} orderedWatchIds
 * @param {string} [selectionKey]
 */
export async function setFeaturedWatchesForAdmin(context, orderedWatchIds, selectionKey = null) {
  const siteId = getAdminSiteId()

  let deleteQuery = supabase
    .from('home_featured_watches')
    .delete()
    .eq('site_id', siteId)
    .eq('context', context)

  if (selectionKey) {
    deleteQuery = deleteQuery.eq('selection_key', selectionKey)
  }

  const { error: deleteError } = await deleteQuery
  if (deleteError) throw new Error(deleteError.message)

  const ids = (orderedWatchIds || []).filter(Boolean)
  if (ids.length === 0) {
    return { success: true }
  }

  const rows = ids.map((watchId, index) => ({
    site_id: siteId,
    watch_id: watchId,
    context,
    selection_key: selectionKey,
    display_order: ids.length - index,
  }))

  const { error: insertError } = await supabase.from('home_featured_watches').insert(rows)
  if (insertError) throw new Error(insertError.message)

  return { success: true }
}

/**
 * @param {string} featuredId
 */
export async function removeFeaturedWatch(featuredId) {
  const siteId = getAdminSiteId()
  const { error } = await supabase
    .from('home_featured_watches')
    .delete()
    .eq('id', featuredId)
    .eq('site_id', siteId)
  if (error) throw new Error(error.message)
  return { success: true }
}

/**
 * Montres mises en avant pour le front (nouveautés).
 * @param {'nouvelles' | 'selection'} context
 * @param {number} [fallbackLimit]
 */
export async function getFeaturedWatchesPublic(context, fallbackLimit = 7) {
  const siteId = getAdminSiteId()
  const { data, error } = await supabase
    .from('home_featured_watches')
    .select('display_order, watches(*)')
    .eq('site_id', siteId)
    .eq('context', context)
    .order('display_order', { ascending: false })

  if (error) {
    console.warn('getFeaturedWatchesPublic:', error.message)
    return null
  }

  const watches = (data || [])
    .map((row) => row.watches)
    .filter((w) => w && w.is_available !== false)

  if (watches.length > 0) return watches
  return null
}

export { getFeaturedWatchesPublic as getHomeFeaturedWatches }

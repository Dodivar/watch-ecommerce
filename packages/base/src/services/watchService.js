import { supabase } from './supabase'
import { getWatchArticles } from './watchArticleService'
import { normalizeCaseSizeValue } from '@/utils/caseSize'
import { normalizeBraceletColors } from '@/constants/watchBraceletColors'
import { normalizeBraceletMaterials } from '@/constants/watchBraceletMaterials'
import {
  getDisplayDiscountPercent,
  getEffectiveWatchPrice,
  isWatchOnPromotion,
} from '@/utils/watchPricing.js'
import { WATCH_CARD_MAX_IMAGES } from '@/constants/watchCardDefaults.js'
import {
  getStaticWatchAudienceAdminOptions,
  getStaticWatchAudienceFilterOptions,
} from '@/constants/watchAudiences'
import { getSiteConfig } from '@/site/getSiteConfig.js'
import { buildWatchSlug } from '@/utils/watchSlug.js'

/** Images par montre en listing collection / recherche (navigation jusqu'à WATCH_CARD_MAX_IMAGES). */
const LISTING_IMAGES_PER_WATCH = WATCH_CARD_MAX_IMAGES

/**
 * Slugs affichés comme filtres sur la page collection (table watch_audiences).
 * Repli sur les constantes si la table est absente ou erreur réseau.
 * @returns {Promise<Array<{ id: string, label: string }>>}
 */
export async function getWatchAudiencesForCollectionFilter() {
  try {
    const { data, error } = await supabase
      .from('watch_audiences')
      .select('slug, label_fr, sort_order')
      .eq('show_in_collection_filter', true)
      .order('sort_order', { ascending: true })

    if (error || !data?.length) {
      return getStaticWatchAudienceFilterOptions()
    }
    return data.map((r) => ({ id: r.slug, label: r.label_fr }))
  } catch {
    return getStaticWatchAudienceFilterOptions()
  }
}

/**
 * Toutes les valeurs possibles pour le champ « Public » (admin).
 * @returns {Promise<Array<{ value: string, label: string }>>}
 */
export async function getWatchAudiencesForAdminForm() {
  try {
    const { data, error } = await supabase
      .from('watch_audiences')
      .select('slug, label_fr, sort_order')
      .order('sort_order', { ascending: true })

    if (error || !data?.length) {
      return getStaticWatchAudienceAdminOptions()
    }
    return data.map((r) => ({ value: r.slug, label: r.label_fr }))
  } catch {
    return getStaticWatchAudienceAdminOptions()
  }
}

/**
 * Transforme les données de la base de données en format attendu par les composants
 */
function transformWatchData(watchData, details, accessories, images, articles = []) {
  const slug = watchData.slug || buildWatchSlug(watchData)
  const baseWatch = {
    price: watchData.price,
    promotionPrice: watchData.promotion_price,
    discountPercent: watchData.discount_percent,
  }
  return {
    id: watchData.id,
    slug,
    adCode: watchData.ad_code,
    name: watchData.name,
    brand: watchData.brand,
    model: watchData.model,
    reference: watchData.reference,
    price: watchData.price,
    promotionPrice: watchData.promotion_price ?? null,
    discountPercent: watchData.discount_percent ?? null,
    effectivePrice: getEffectiveWatchPrice(baseWatch),
    isOnPromotion: isWatchOnPromotion(baseWatch),
    displayDiscountPercent: getDisplayDiscountPercent(baseWatch),
    year: watchData.year,
    condition: watchData.condition,
    description: watchData.description || '',
    isAvailable: watchData.is_available !== undefined ? watchData.is_available : true,
    isSold: watchData.is_sold !== undefined ? watchData.is_sold : false,
    stockQuantity: watchData.stock_quantity ?? null,
    saleDate: watchData.sale_date || null,
    displayOrder: watchData.display_order || 0,
    createdAt: watchData.created_at || null,
    audience: watchData.audience || 'unisexe',
    contenu: details?.content || '', // Pour compatibilité avec WatchCard
    images: images.map((img) => img.image_url).filter(Boolean),
    articles: articles || [],
    details: {
      content: details?.content || '',
      movement: details?.movement || '',
      caseMaterial: details?.case_material || '',
      braceletMaterials: normalizeBraceletMaterials(
        details?.bracelet_materials?.length
          ? details.bracelet_materials
          : details?.bracelet_material
      ),
      braceletColors: normalizeBraceletColors(details?.bracelet_colors),
      caseSize: normalizeCaseSizeValue(details?.case_size || ''),
      thickness: details?.thickness || '',
      dialColor: details?.dial_color || '',
      crystal: details?.crystal || '',
      waterResistance: details?.water_resistance || '',
      functions: details?.functions || '',
      powerReserve: details?.power_reserve || '',
      frequency: details?.frequency || '',
      caseCondition: details?.case_condition || '',
      dialCondition: details?.dial_condition || '',
      braceletCondition: details?.bracelet_condition || '',
      guarantee: details?.guarantee || '',
      accessories: accessories.map((acc) => ({
        name: acc.name,
        included: acc.included,
      })),
    },
  }
}

/**
 * Résout l’URL publique d’un enregistrement watch_images.
 * @param {{ image_url?: string | null, image_path?: string | null }} record
 * @returns {string | null}
 */
function resolveImageRecordUrl(record) {
  if (record.image_url) return record.image_url
  if (record.image_path) {
    const { data } = supabase.storage.from('watch-images').getPublicUrl(record.image_path)
    return data.publicUrl
  }
  return null
}

/**
 * @param {string[]} watchIds
 * @param {number | null} [maxPerWatch]
 * @returns {Promise<Map<string, Array<{ image_url: string }>>>}
 */
async function getImagesGroupedByWatchId(watchIds, maxPerWatch = null) {
  const map = new Map()
  if (!watchIds.length) return map

  const { data, error } = await supabase
    .from('watch_images')
    .select('watch_id, image_url, image_path, image_order')
    .in('watch_id', watchIds)
    .order('image_order', { ascending: true })

  if (error || !data) {
    console.error('Erreur lors de la récupération des images:', error)
    return map
  }

  for (const record of data) {
    const url = resolveImageRecordUrl(record)
    if (!url) continue

    const list = map.get(record.watch_id) ?? []
    if (maxPerWatch != null && list.length >= maxPerWatch) continue

    list.push({ image_url: url })
    map.set(record.watch_id, list)
  }

  return map
}

/**
 * @param {string[]} watchIds
 * @returns {Promise<Map<string, object | null>>}
 */
async function getWatchDetailsByWatchIds(watchIds) {
  const map = new Map()
  if (!watchIds.length) return map

  const { data, error } = await supabase
    .from('watch_details')
    .select('*')
    .in('watch_id', watchIds)

  if (error) {
    console.error('Erreur lors de la récupération des détails:', error)
    return map
  }

  for (const row of data ?? []) {
    map.set(row.watch_id, row)
  }

  return map
}

/**
 * @param {string[]} watchIds
 * @returns {Promise<Map<string, Array<object>>>}
 */
async function getWatchAccessoriesByWatchIds(watchIds) {
  const map = new Map()
  if (!watchIds.length) return map

  const { data, error } = await supabase
    .from('watch_accessories')
    .select('*')
    .in('watch_id', watchIds)
    .order('name', { ascending: true })

  if (error) {
    console.error('Erreur lors de la récupération des accessoires:', error)
    return map
  }

  for (const row of data ?? []) {
    const list = map.get(row.watch_id) ?? []
    list.push(row)
    map.set(row.watch_id, list)
  }

  return map
}

/**
 * Assemble des montres avec détails, accessoires et images (requêtes groupées).
 *
 * @param {Array<object>} watches
 * @param {number | null} imagesPerWatch
 */
async function assembleWatchesWithRelations(watches, imagesPerWatch = LISTING_IMAGES_PER_WATCH) {
  const watchIds = watches.map((w) => w.id)

  const [detailsById, accessoriesById, imagesById] = await Promise.all([
    getWatchDetailsByWatchIds(watchIds),
    getWatchAccessoriesByWatchIds(watchIds),
    getImagesGroupedByWatchId(watchIds, imagesPerWatch),
  ])

  return watches.map((watch) =>
    transformWatchData(
      watch,
      detailsById.get(watch.id) ?? null,
      accessoriesById.get(watch.id) ?? [],
      imagesById.get(watch.id) ?? [],
    ),
  )
}

/**
 * Marques distinctes des montres disponibles (requête légère : colonne `brand` uniquement).
 * @param {Array<{ brand?: string | null }>} rows
 * @returns {string[]}
 */
function dedupeCatalogBrands(rows) {
  const brands = new Set()
  for (const row of rows ?? []) {
    const brand = typeof row?.brand === 'string' ? row.brand.trim() : ''
    if (brand) brands.add(brand)
  }
  return [...brands].sort((a, b) => a.localeCompare(b, 'fr'))
}

/** @type {string[] | null} */
let catalogBrandsCache = null
/** @type {Promise<string[]> | null} */
let catalogBrandsPromise = null

const CATALOG_BRANDS_CACHE_TTL_MS = 15 * 60 * 1000

function getCatalogBrandsStorageKey() {
  const siteId = getSiteConfig().siteId || 'default'
  return `watch-ecommerce:catalog-brands:${siteId}`
}

/**
 * @returns {string[] | null}
 */
function readCatalogBrandsSessionCache() {
  if (typeof sessionStorage === 'undefined') return null

  try {
    const raw = sessionStorage.getItem(getCatalogBrandsStorageKey())
    if (!raw) return null

    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed?.brands) || typeof parsed.cachedAt !== 'number') {
      sessionStorage.removeItem(getCatalogBrandsStorageKey())
      return null
    }

    if (Date.now() - parsed.cachedAt > CATALOG_BRANDS_CACHE_TTL_MS) {
      sessionStorage.removeItem(getCatalogBrandsStorageKey())
      return null
    }

    return parsed.brands.filter((brand) => typeof brand === 'string' && brand.trim())
  } catch {
    return null
  }
}

/**
 * @param {string[]} brands
 */
function writeCatalogBrandsSessionCache(brands) {
  if (typeof sessionStorage === 'undefined') return

  try {
    sessionStorage.setItem(
      getCatalogBrandsStorageKey(),
      JSON.stringify({
        brands,
        cachedAt: Date.now(),
      }),
    )
  } catch {
    // Quota dépassé ou navigation privée restrictive — ignorer silencieusement.
  }
}

/**
 * Retourne les marques déjà en cache (mémoire ou sessionStorage), sans requête réseau.
 * @returns {string[] | null}
 */
export function peekAvailableCatalogBrands() {
  if (catalogBrandsCache) return catalogBrandsCache
  const sessionCached = readCatalogBrandsSessionCache()
  if (sessionCached) {
    catalogBrandsCache = sessionCached
    return catalogBrandsCache
  }
  return null
}

/**
 * Liste triée des marques présentes sur des montres disponibles.
 * Une seule requête Supabase (`select brand`) — pas de chargement images / détails.
 * Cache mémoire + sessionStorage (TTL 15 min) par site.
 *
 * @returns {Promise<string[]>}
 */
export async function getAvailableCatalogBrands() {
  const cached = peekAvailableCatalogBrands()
  if (cached) return cached
  if (catalogBrandsPromise) return catalogBrandsPromise

  catalogBrandsPromise = (async () => {
    const { data, error } = await supabase
      .from('watches')
      .select('brand')
      .eq('is_available', true)
      .not('brand', 'is', null)

    if (error) {
      catalogBrandsPromise = null
      throw new Error(`Erreur lors de la récupération des marques: ${error.message}`)
    }

    catalogBrandsCache = dedupeCatalogBrands(data)
    writeCatalogBrandsSessionCache(catalogBrandsCache)
    catalogBrandsPromise = null
    return catalogBrandsCache
  })()

  return catalogBrandsPromise
}

/**
 * Invalide le cache des marques catalogue (mémoire + sessionStorage).
 */
export function invalidateCatalogBrandsCache() {
  catalogBrandsCache = null
  catalogBrandsPromise = null
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.removeItem(getCatalogBrandsStorageKey())
  }
}

/**
 * Récupère toutes les montres disponibles pour le listing (collection, filtres, recherche).
 * Une seule image par montre ; requêtes groupées (pas de N+1).
 *
 * @returns {Promise<Array>}
 */
export async function getAllWatchesForListing() {
  try {
    const { data: watches, error: watchesError } = await supabase
      .from('watches')
      .select('*')
      .eq('is_available', true)
      .order('display_order', { ascending: false })

    if (watchesError) {
      throw new Error(`Erreur lors de la récupération des montres: ${watchesError.message}`)
    }

    if (!watches?.length) return []

    return assembleWatchesWithRelations(watches, LISTING_IMAGES_PER_WATCH)
  } catch (error) {
    console.error('Erreur dans getAllWatchesForListing:', error)
    throw error
  }
}

/**
 * @deprecated Préférer `getAllWatchesForListing`. Alias conservé pour compatibilité.
 * @returns {Promise<Array>}
 */
export async function getAllWatches() {
  return getAllWatchesForListing()
}

/**
 * Récupère une montre par son ID avec tous ses détails
 * @param {string} id - ID de la montre
 * @param {boolean} allowUnavailable - Si true, permet de récupérer les montres hors-stock (pour les admins)
 * @returns {Promise<Object>} Données de la montre
 */
/**
 * Résout l’ID interne d’une montre à partir de son slug URL canonique.
 * @param {string} slug
 * @param {boolean} allowUnavailable
 * @returns {Promise<string|null>}
 */
export async function resolveWatchIdBySlug(slug, allowUnavailable = false) {
  if (!slug) return null

  let query = supabase.from('watches').select('id, slug, brand, name, reference, is_available')

  if (!allowUnavailable) {
    query = query.eq('is_available', true).eq('is_sold', false)
  }

  const { data, error } = await query

  if (error) {
    console.error('Erreur lors de la résolution du slug montre:', error)
    return null
  }

  const normalized = String(slug).toLowerCase().trim()
  const match = (data ?? []).find((row) => {
    const rowSlug = row.slug || buildWatchSlug(row)
    return rowSlug === normalized
  })

  return match?.id ?? null
}

/**
 * Récupère une montre par son slug URL canonique (/montre/:slug).
 * @param {string} slug
 * @param {boolean} allowUnavailable
 */
export async function getWatchBySlug(slug, allowUnavailable = false) {
  const id = await resolveWatchIdBySlug(slug, allowUnavailable)
  if (!id) {
    throw new Error('Montre non trouvée')
  }
  return getWatchById(id, allowUnavailable)
}

export async function getWatchById(id, allowUnavailable = false) {
  try {
    // Récupérer la montre
    const { data: watch, error: watchError } = await supabase
      .from('watches')
      .select('*')
      .eq('id', id)
      .single()

    if (watchError) {
      if (watchError.code === 'PGRST116') {
        throw new Error('Montre non trouvée')
      }
      throw new Error(`La montre demandée n'existe pas`)
    }

    if (!watch) {
      throw new Error('Montre non trouvée')
    }

    // Vérifier si la montre est disponible (sauf si allowUnavailable est true)
    if (!allowUnavailable && watch.is_available === false) {
      throw new Error('UNAVAILABLE')
    }

    // Récupérer les détails, accessoires, images et articles liés
    const [details, accessories, images, articles] = await Promise.all([
      getWatchDetails(id),
      getWatchAccessories(id),
      getWatchImages(id),
      getWatchArticles(id).catch(() => []), // En cas d'erreur, retourner un tableau vide
    ])

    return transformWatchData(watch, details, accessories, images, articles)
  } catch (error) {
    console.error('Erreur dans getWatchById:', error)
    throw error
  }
}

/**
 * Récupère les détails techniques d'une montre
 * @param {string} watchId - ID de la montre
 * @returns {Promise<Object|null>} Détails de la montre
 */
async function getWatchDetails(watchId) {
  const { data, error } = await supabase
    .from('watch_details')
    .select('*')
    .eq('watch_id', watchId)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Erreur lors de la récupération des détails:', error)
  }

  return data || null
}

/**
 * Récupère les accessoires d'une montre
 * @param {string} watchId - ID de la montre
 * @returns {Promise<Array>} Liste des accessoires
 */
async function getWatchAccessories(watchId) {
  const { data, error } = await supabase
    .from('watch_accessories')
    .select('*')
    .eq('watch_id', watchId)
    .order('name', { ascending: true })

  if (error) {
    console.error('Erreur lors de la récupération des accessoires:', error)
    return []
  }

  return data || []
}

/**
 * Récupère les 7 dernières montres vendues avec leur première image
 * @returns {Promise<Array>} Liste des montres vendues (max 7)
 */
export async function getSoldWatches(limit = 7) {
  try {
    // Récupérer les montres vendues, triées par date de mise à jour (plus récentes en premier)
    const { data: watches, error: watchesError } = await supabase
      .from('watches')
      .select('id, name, ad_code, updated_at')
      .eq('is_sold', true)
      .order('updated_at', { ascending: false })
      .limit(limit)

    if (watchesError) {
      throw new Error(`Erreur lors de la récupération des montres vendues: ${watchesError.message}`)
    }

    if (!watches || watches.length === 0) {
      return []
    }

    const imagesById = await getImagesGroupedByWatchId(
      watches.map((w) => w.id),
      1,
    )

    return watches.map((watch) => {
      const first = imagesById.get(watch.id)?.[0]
      return {
        id: watch.id,
        name: watch.name,
        imageUrl: first?.image_url ?? null,
      }
    })
  } catch (error) {
    console.error('Erreur dans getSoldWatches:', error)
    return []
  }
}

/**
 * Récupère les dernières montres disponibles (non vendues) avec leurs détails complets.
 * Inclut 2 images par montre pour l’aperçu au survol (desktop).
 * @param {number} limit - Nombre maximum de montres à récupérer (défaut: 7)
 * @returns {Promise<Array>} Liste des montres disponibles triées par date de création
 */
export async function getLatestAvailableWatches(limit = 7) {
  try {
    // Récupérer les montres disponibles (non vendues), triées par display_order (plus grand = premier)
    const { data: watches, error: watchesError } = await supabase
      .from('watches')
      .select('*')
      .eq('is_available', true)
      .eq('is_sold', false)
      .order('display_order', { ascending: false })
      .limit(limit)

    if (watchesError) {
      throw new Error(`Erreur lors de la récupération des montres: ${watchesError.message}`)
    }

    if (!watches || watches.length === 0) {
      return []
    }

    return assembleWatchesWithRelations(watches, LISTING_IMAGES_PER_WATCH)
  } catch (error) {
    console.error('Erreur dans getLatestAvailableWatches:', error)
    throw error
  }
}

/**
 * Récupère les images d'une montre depuis Supabase Storage
 * @param {string} watchId - ID de la montre
 * @param {number|null} limit - Nombre maximum d'images à récupérer (null pour toutes les images)
 * @returns {Promise<Array>} Liste des images avec leurs URLs
 */
export async function getWatchImages(watchId, limit = null) {
  try {
    // Construire la requête avec ou sans limite
    let query = supabase
      .from('watch_images')
      .select('*')
      .eq('watch_id', watchId)
      .order('image_order', { ascending: true })

    // Appliquer la limite si spécifiée
    if (limit !== null && limit > 0) {
      query = query.limit(limit)
    }

    // Récupérer les métadonnées des images depuis la table watch_images
    const { data: imageRecords, error: imageRecordsError } = await query

    if (imageRecordsError) {
      console.error('Erreur lors de la récupération des métadonnées d\'images:', imageRecordsError)
      return []
    }

    if (!imageRecords || imageRecords.length === 0) {
      return []
    }

    return imageRecords
      .map((record) => {
        const image_url = resolveImageRecordUrl(record)
        return image_url ? { ...record, image_url } : null
      })
      .filter(Boolean)
  } catch (error) {
    console.error('Erreur dans getWatchImages:', error)
    return []
  }
}


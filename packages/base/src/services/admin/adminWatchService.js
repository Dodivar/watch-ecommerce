import { supabase } from '../supabase'
import { getWatchArticlesForAdmin } from '../watchArticleService'
import { normalizeCaseSizeValue } from '@/utils/caseSize'
import { normalizeBraceletColors } from '@/constants/watchBraceletColors'
import { normalizeBraceletMaterials } from '@/constants/watchBraceletMaterials'
import { getSiteConfig } from '@/site/getSiteConfig.js'

function isRetailCatalog() {
  return getSiteConfig().watchCatalog?.mode !== 'resale'
}

/**
 * Transforme les données du formulaire en format base de données
 */
function transformWatchToDB(watchData) {
  const retail = isRetailCatalog()
  const stockQty = retail
    ? Math.max(0, parseInt(String(watchData.stockQuantity ?? 1), 10) || 0)
    : 1
  const isOnPromotion = watchData.isOnPromotion === true
  const promotionPrice =
    isOnPromotion && watchData.promotionPrice != null && watchData.promotionPrice !== ''
      ? parseFloat(watchData.promotionPrice)
      : null
  const discountPercent =
    isOnPromotion && watchData.discountPercent != null && watchData.discountPercent !== ''
      ? parseInt(String(watchData.discountPercent), 10)
      : null

  const row = {
    ad_code: watchData.adCode,
    name: watchData.name,
    brand: watchData.brand,
    model: watchData.model,
    reference: watchData.reference,
    price: parseFloat(watchData.price),
    promotion_price: promotionPrice,
    discount_percent: discountPercent,
    year: watchData.year ? parseInt(watchData.year) : null,
    condition: watchData.condition || null,
    description: watchData.description || null,
    is_available: watchData.isAvailable !== undefined ? watchData.isAvailable : true,
    is_sold: watchData.isSold !== undefined ? watchData.isSold : false,
    sale_date: watchData.saleDate || null,
    audience: watchData.audience || 'unisexe',
    stock_quantity: stockQty,
  }

  if (retail) {
    // Catalogue retail : decoupler publication et stock.
    // `is_available` = montre publiee (toggle admin "En vente / Disponible").
    // La rupture de stock (`stock_quantity === 0`) n'enleve plus la montre du
    // catalogue : elle reste visible avec un badge "Hors stock".
    row.is_sold = false
    row.is_available = watchData.isAvailable !== undefined ? watchData.isAvailable : true
  }

  return row
}

/**
 * Transforme les détails du formulaire en format base de données
 */
function transformDetailsToDB(watchId, details) {
  return {
    watch_id: watchId,
    content: details.content || null,
    movement: details.movement || null,
    case_material: details.caseMaterial || null,
    bracelet_materials: normalizeBraceletMaterials(details.braceletMaterials),
    bracelet_colors: normalizeBraceletColors(details.braceletColors),
    case_size: details.caseSize ? normalizeCaseSizeValue(details.caseSize) : null,
    thickness: details.thickness || null,
    dial_color: details.dialColor || null,
    crystal: details.crystal || null,
    water_resistance: details.waterResistance || null,
    functions: details.functions || null,
    power_reserve: details.powerReserve || null,
    frequency: details.frequency || null,
    case_condition: details.caseCondition || null,
    dial_condition: details.dialCondition || null,
    bracelet_condition: details.braceletCondition || null,
    guarantee: details.guarantee || null,
  }
}

/**
 * Crée une nouvelle montre avec tous ses détails
 * @param {Object} watchData - Données de la montre
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export async function createWatch(watchData) {
  try {
    // 1. Récupérer le display_order maximum et ajouter 1 pour positionner la nouvelle montre en dernière
    const { data: maxOrderData } = await supabase
      .from('watches')
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1)
      .single()

    const maxDisplayOrder = maxOrderData?.display_order || 0
    const newDisplayOrder = maxDisplayOrder + 1

    // 2. Créer la montre principale avec display_order
    const watchDB = transformWatchToDB(watchData)
    watchDB.display_order = newDisplayOrder

    const { data: watch, error: watchError } = await supabase
      .from('watches')
      .insert(watchDB)
      .select()
      .single()

    if (watchError) {
      throw new Error(`Erreur lors de la création de la montre: ${watchError.message}`)
    }

    const watchId = watch.id

    // 3. Créer les détails techniques
    if (watchData.details) {
      const detailsDB = transformDetailsToDB(watchId, watchData.details)
      const { error: detailsError } = await supabase.from('watch_details').insert(detailsDB)

      if (detailsError) {
        console.error('Erreur lors de la création des détails:', detailsError)
        // Ne pas échouer complètement si les détails échouent
      }
    }

    // 4. Créer les accessoires
    if (watchData.details?.accessories && watchData.details.accessories.length > 0) {
      const accessoriesDB = watchData.details.accessories.map((acc) => ({
        watch_id: watchId,
        name: acc.name,
        included: acc.included || false,
      }))

      const { error: accessoriesError } = await supabase
        .from('watch_accessories')
        .insert(accessoriesDB)

      if (accessoriesError) {
        console.error('Erreur lors de la création des accessoires:', accessoriesError)
      }
    }

    // 5. Les images seront uploadées séparément via uploadWatchImage

    return {
      success: true,
      data: { id: watchId },
    }
  } catch (error) {
    console.error('Erreur dans createWatch:', error)
    return {
      success: false,
      error: error.message || 'Erreur lors de la création de la montre',
    }
  }
}

/**
 * Met à jour une montre existante
 * @param {string} watchId - ID de la montre
 * @param {Object} watchData - Nouvelles données de la montre
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function updateWatch(watchId, watchData) {
  try {
    // Vérifier le statut actuel de la montre avant la mise à jour
    const { data: currentWatch, error: fetchError } = await supabase
      .from('watches')
      .select('is_sold, is_available, sale_date')
      .eq('id', watchId)
      .single()

    if (fetchError) {
      throw new Error(`Erreur lors de la récupération de la montre: ${fetchError.message}`)
    }

    // 1. Mettre à jour la montre principale
    const watchDB = transformWatchToDB(watchData)
    watchDB.updated_at = new Date().toISOString()

    // Si on remet en vente une montre vendue (is_sold passe de true à false)
    if (currentWatch && currentWatch.is_sold === true && watchData.isSold === false) {
      // Récupérer le display_order maximum pour positionner la montre remise en vente en dernière
      const { data: maxOrderData } = await supabase
        .from('watches')
        .select('display_order')
        .not('display_order', 'is', null)
        .order('display_order', { ascending: false })
        .limit(1)
        .single()

      const maxDisplayOrder = maxOrderData?.display_order || 0
      const newDisplayOrder = maxDisplayOrder + 1

      // Remettre en vente : is_sold = false, is_available = true
      watchDB.is_sold = false
      watchDB.display_order = newDisplayOrder // Réassigner un ordre d'affichage (en dernière position)
      // Conserver la sale_date pour l'historique (ne pas la supprimer)
    }

    // Si is_sold passe de false à true, définir sale_date à la date actuelle (seulement si elle n'existe pas déjà)
    // et s'assurer que is_available est false
    if (currentWatch && currentWatch.is_sold === false && watchData.isSold === true) {
      // Ne définir la date que si elle n'existe pas déjà
      if (!currentWatch.sale_date) {
        watchDB.sale_date = new Date().toISOString()
      }
      // Une montre vendue ne peut pas être disponible
      watchDB.is_available = false
    }

    const { error: watchError } = await supabase
      .from('watches')
      .update(watchDB)
      .eq('id', watchId)

    if (watchError) {
      throw new Error(`Erreur lors de la mise à jour de la montre: ${watchError.message}`)
    }

    // 2. Mettre à jour ou créer les détails techniques
    if (watchData.details) {
      const detailsDB = transformDetailsToDB(watchId, watchData.details)
      detailsDB.updated_at = new Date().toISOString()

      // Vérifier si les détails existent déjà
      const { data: existingDetails } = await supabase
        .from('watch_details')
        .select('id')
        .eq('watch_id', watchId)
        .single()

      if (existingDetails) {
        // Mettre à jour
        const { error: detailsError } = await supabase
          .from('watch_details')
          .update(detailsDB)
          .eq('watch_id', watchId)

        if (detailsError) {
          console.error('Erreur lors de la mise à jour des détails:', detailsError)
        }
      } else {
        // Créer
        const { error: detailsError } = await supabase.from('watch_details').insert(detailsDB)

        if (detailsError) {
          console.error('Erreur lors de la création des détails:', detailsError)
        }
      }
    }

    // 3. Supprimer tous les accessoires existants et les recréer
    if (watchData.details?.accessories !== undefined) {
      const { error: deleteError } = await supabase
        .from('watch_accessories')
        .delete()
        .eq('watch_id', watchId)

      if (deleteError) {
        console.error('Erreur lors de la suppression des accessoires:', deleteError)
      }

      // Recréer les accessoires
      if (watchData.details.accessories.length > 0) {
        const accessoriesDB = watchData.details.accessories.map((acc) => ({
          watch_id: watchId,
          name: acc.name,
          included: acc.included || false,
        }))

        const { error: accessoriesError } = await supabase
          .from('watch_accessories')
          .insert(accessoriesDB)

        if (accessoriesError) {
          console.error('Erreur lors de la création des accessoires:', accessoriesError)
        }
      }
    }

    return {
      success: true,
    }
  } catch (error) {
    console.error('Erreur dans updateWatch:', error)
    return {
      success: false,
      error: error.message || 'Erreur lors de la mise à jour de la montre',
    }
  }
}

/**
 * Supprime une montre et toutes ses données associées (cascade)
 * @param {string} watchId - ID de la montre
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function deleteWatch(watchId) {
  try {
    // Récupérer les images pour les supprimer du Storage
    const { data: images } = await supabase
      .from('watch_images')
      .select('image_path')
      .eq('watch_id', watchId)

    // Supprimer les images du Storage
    if (images && images.length > 0) {
      const imagePaths = images
        .map((img) => img.image_path)
        .filter((path) => path !== null && path !== undefined)

      if (imagePaths.length > 0) {
        const { error: storageError } = await supabase.storage
          .from('watch-images')
          .remove(imagePaths)

        if (storageError) {
          console.error('Erreur lors de la suppression des images du Storage:', storageError)
        }
      }
    }

    // Supprimer la montre (cascade supprimera automatiquement détails, accessoires, images)
    const { error } = await supabase.from('watches').delete().eq('id', watchId)

    if (error) {
      throw new Error(`Erreur lors de la suppression de la montre: ${error.message}`)
    }

    return {
      success: true,
    }
  } catch (error) {
    console.error('Erreur dans deleteWatch:', error)
    return {
      success: false,
      error: error.message || 'Erreur lors de la suppression de la montre',
    }
  }
}

/**
 * Upload une image pour une montre
 * @param {string} watchId - ID de la montre
 * @param {File} imageFile - Fichier image à uploader
 * @param {number} order - Ordre de l'image (optionnel)
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export async function uploadWatchImage(watchId, imageFile, order = null) {
  try {
    // Générer un nom de fichier unique
    const fileExt = imageFile.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `watches/${watchId}/${fileName}`

    // Upload vers Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('watch-images')
      .upload(filePath, imageFile, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      throw new Error(`Erreur lors de l'upload de l'image: ${uploadError.message}`)
    }

    // Obtenir l'URL publique
    const {
      data: { publicUrl },
    } = supabase.storage.from('watch-images').getPublicUrl(filePath)

    // Déterminer l'ordre (si non fourni, prendre le max + 1)
    let imageOrder = order
    if (imageOrder === null || imageOrder === undefined) {
      const { data: existingImages } = await supabase
        .from('watch_images')
        .select('image_order')
        .eq('watch_id', watchId)
        .order('image_order', { ascending: false })
        .limit(1)

      imageOrder = existingImages && existingImages.length > 0 ? existingImages[0].image_order + 1 : 1
    }

    // Créer l'enregistrement dans la table watch_images
    const { data: imageRecord, error: recordError } = await supabase
      .from('watch_images')
      .insert({
        watch_id: watchId,
        image_path: filePath,
        image_url: publicUrl,
        image_order: imageOrder,
      })
      .select()
      .single()

    if (recordError) {
      // Si l'insertion échoue, supprimer le fichier uploadé
      await supabase.storage.from('watch-images').remove([filePath])
      throw new Error(`Erreur lors de l'enregistrement de l'image: ${recordError.message}`)
    }

    return {
      success: true,
      data: {
        ...imageRecord,
        image_url: publicUrl,
      },
    }
  } catch (error) {
    console.error('Erreur dans uploadWatchImage:', error)
    return {
      success: false,
      error: error.message || "Erreur lors de l'upload de l'image",
    }
  }
}

/**
 * Supprime une image d'une montre
 * @param {string} imageId - ID de l'image dans la table watch_images
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function deleteWatchImage(imageId) {
  try {
    // Récupérer les informations de l'image
    const { data: image, error: fetchError } = await supabase
      .from('watch_images')
      .select('image_path')
      .eq('id', imageId)
      .single()

    if (fetchError) {
      throw new Error(`Image non trouvée: ${fetchError.message}`)
    }

    // Supprimer le fichier du Storage si image_path existe
    if (image.image_path) {
      const { error: storageError } = await supabase.storage
        .from('watch-images')
        .remove([image.image_path])

      if (storageError) {
        console.error('Erreur lors de la suppression du fichier Storage:', storageError)
        // Continuer quand même pour supprimer l'enregistrement
      }
    }

    // Supprimer l'enregistrement de la table
    const { error: deleteError } = await supabase.from('watch_images').delete().eq('id', imageId)

    if (deleteError) {
      throw new Error(`Erreur lors de la suppression de l'enregistrement: ${deleteError.message}`)
    }

    return {
      success: true,
    }
  } catch (error) {
    console.error('Erreur dans deleteWatchImage:', error)
    return {
      success: false,
      error: error.message || "Erreur lors de la suppression de l'image",
    }
  }
}

/**
 * Réorganise l'ordre des images d'une montre
 * @param {Array<{id: string, order: number}>} imageOrders - Tableau d'objets avec id et order
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function reorderWatchImages(imageOrders) {
  try {
    // Mettre à jour chaque image
    const updatePromises = imageOrders.map(({ id, order }) =>
      supabase
        .from('watch_images')
        .update({ image_order: order })
        .eq('id', id),
    )

    const results = await Promise.all(updatePromises)

    // Vérifier s'il y a des erreurs
    const errors = results.filter((result) => result.error)
    if (errors.length > 0) {
      throw new Error(`Erreurs lors de la réorganisation: ${errors.map((e) => e.error.message).join(', ')}`)
    }

    return {
      success: true,
    }
  } catch (error) {
    console.error('Erreur dans reorderWatchImages:', error)
    return {
      success: false,
      error: error.message || 'Erreur lors de la réorganisation des images',
    }
  }
}

/**
 * Bascule le statut de disponibilité d'une montre
 * @param {string} watchId - ID de la montre
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export async function toggleWatchAvailability(watchId) {
  try {
    // Récupérer le statut actuel (is_available et is_sold)
    const { data: watch, error: fetchError } = await supabase
      .from('watches')
      .select('is_available, is_sold')
      .eq('id', watchId)
      .single()

    if (fetchError) {
      throw new Error(`Erreur lors de la récupération de la montre: ${fetchError.message}`)
    }

    // Empêcher de modifier le statut d'une montre vendue
    if (watch.is_sold === true) {
      throw new Error('Une montre vendue ne peut pas être remise en stock')
    }

    // Bascule le statut
    const newStatus = !watch.is_available

    const { data: updatedWatch, error: updateError } = await supabase
      .from('watches')
      .update({ is_available: newStatus })
      .eq('id', watchId)
      .select()
      .single()

    if (updateError) {
      throw new Error(`Erreur lors de la mise à jour du statut: ${updateError.message}`)
    }

    return {
      success: true,
      data: updatedWatch,
    }
  } catch (error) {
    console.error('Erreur dans toggleWatchAvailability:', error)
    return {
      success: false,
      error: error.message || 'Erreur lors du changement de statut',
    }
  }
}

/**
 * Remet en vente une montre vendue
 * @param {string} watchId - ID de la montre
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export async function restockSoldWatch(watchId) {
  try {
    // Récupérer le display_order maximum pour positionner la montre remise en vente en dernière
    const { data: maxOrderData } = await supabase
      .from('watches')
      .select('display_order')
      .not('display_order', 'is', null)
      .order('display_order', { ascending: false })
      .limit(1)
      .single()

    const maxDisplayOrder = maxOrderData?.display_order || 0
    const newDisplayOrder = maxDisplayOrder + 1

    const { data: updatedWatch, error: updateError } = await supabase
      .from('watches')
      .update({ 
        is_sold: false, 
        is_available: true,
        display_order: newDisplayOrder // Réassigner un ordre d'affichage (en dernière position)
      })
      .eq('id', watchId)
      .select()
      .single()

    if (updateError) {
      throw new Error(`Erreur lors de la remise en vente: ${updateError.message}`)
    }

    return {
      success: true,
      data: updatedWatch,
    }
  } catch (error) {
    console.error('Erreur dans restockSoldWatch:', error)
    return {
      success: false,
      error: error.message || 'Erreur lors de la remise en vente',
    }
  }
}

/**
 * Marque une montre comme vendue
 * @param {string} watchId - ID de la montre
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export async function markWatchAsSold(watchId) {
  try {
    // Récupérer le statut actuel pour vérifier si sale_date existe déjà
    const { data: currentWatch, error: fetchError } = await supabase
      .from('watches')
      .select('sale_date')
      .eq('id', watchId)
      .single()

    if (fetchError) {
      throw new Error(`Erreur lors de la récupération de la montre: ${fetchError.message}`)
    }

    // Préparer les données à mettre à jour
    // Une montre vendue ne peut pas rester disponible (même règle que updateWatch),
    // sinon elle reste visible dans le catalogue public filtré sur is_available.
    const updateData = {
      is_sold: true,
      is_available: false,
      display_order: null // Réinitialiser l'ordre d'affichage pour les montres vendues
    }
    
    // Ne définir sale_date que si elle n'existe pas déjà
    if (!currentWatch.sale_date) {
      updateData.sale_date = new Date().toISOString()
    }

    const { data: updatedWatch, error: updateError } = await supabase
      .from('watches')
      .update(updateData)
      .eq('id', watchId)
      .select()
      .single()

    if (updateError) {
      throw new Error(`Erreur lors de la mise à jour du statut: ${updateError.message}`)
    }

    return {
      success: true,
      data: updatedWatch,
    }
  } catch (error) {
    console.error('Erreur dans markWatchAsSold:', error)
    return {
      success: false,
      error: error.message || 'Erreur lors du marquage comme vendue',
    }
  }
}

/**
 * Récupère une montre par son ID pour l'admin (sans filtre de disponibilité)
 * @param {string} watchId - ID de la montre
 * @returns {Promise<Object>} Données complètes de la montre
 */
export async function getWatchByIdForAdmin(watchId) {
  try {
    // Récupérer la montre
    const { data: watch, error: watchError } = await supabase
      .from('watches')
      .select('*')
      .eq('id', watchId)
      .single()

    if (watchError) {
      throw new Error(`Erreur lors de la récupération de la montre: ${watchError.message}`)
    }

    if (!watch) {
      throw new Error('Montre non trouvée')
    }

    // Récupérer les détails techniques
    const { data: details } = await supabase
      .from('watch_details')
      .select('*')
      .eq('watch_id', watchId)
      .single()

    // Récupérer les accessoires
    const { data: accessories } = await supabase
      .from('watch_accessories')
      .select('*')
      .eq('watch_id', watchId)
      .order('name', { ascending: true })

    // Récupérer les images
    const { data: images } = await supabase
      .from('watch_images')
      .select('*')
      .eq('watch_id', watchId)
      .order('image_order', { ascending: true })

    // Récupérer les articles liés (pour l'admin, inclut même les masqués)
    const articles = await getWatchArticlesForAdmin(watchId).catch(() => [])

    // Transformer les images avec leurs URLs et IDs
    const imagesWithUrls = (images || []).map((img) => {
      let imageUrl = img.image_url
      if (!imageUrl && img.image_path) {
        const { data } = supabase.storage.from('watch-images').getPublicUrl(img.image_path)
        imageUrl = data.publicUrl
      }
      return {
        id: img.id,
        url: imageUrl,
        order: img.image_order,
      }
    })

    // Transformer en format formulaire
    return {
      adCode: watch.ad_code,
      name: watch.name,
      brand: watch.brand,
      model: watch.model,
      reference: watch.reference,
      price: watch.price?.toString() || '',
      isOnPromotion:
        watch.promotion_price != null &&
        parseFloat(watch.promotion_price) > 0 &&
        parseFloat(watch.promotion_price) < parseFloat(watch.price || 0),
      promotionPrice: watch.promotion_price?.toString() || '',
      discountPercent: watch.discount_percent?.toString() || '',
      year: watch.year?.toString() || '',
      condition: watch.condition || '',
      description: watch.description || '',
      isAvailable: watch.is_available !== undefined ? watch.is_available : true,
      isSold: watch.is_sold !== undefined ? watch.is_sold : false,
      saleDate: watch.sale_date || null,
      stockQuantity: watch.stock_quantity ?? 1,
      displayOrder: watch.display_order || 0,
      audience: watch.audience || 'unisexe',
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
        accessories: (accessories || []).map((acc) => ({
          name: acc.name,
          included: acc.included || false,
        })),
      },
      images: imagesWithUrls,
    }
  } catch (error) {
    console.error('Erreur dans getWatchByIdForAdmin:', error)
    throw error
  }
}

/**
 * Télécharge une image depuis une URL et la convertit en File
 * @param {string} imageUrl - URL de l'image
 * @param {string} fileName - Nom du fichier
 * @returns {Promise<File>} Fichier image
 */
async function downloadImageAsFile(imageUrl, fileName) {
  try {
    const response = await fetch(imageUrl)
    if (!response.ok) {
      throw new Error(`Erreur lors du téléchargement de l'image: ${response.statusText}`)
    }
    const blob = await response.blob()
    return new File([blob], fileName, { type: blob.type })
  } catch (error) {
    console.error('Erreur dans downloadImageAsFile:', error)
    throw error
  }
}

/**
 * Duplique une montre avec toutes ses données et images
 * @param {string} watchId - ID de la montre à dupliquer
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export async function duplicateWatch(watchId) {
  try {
    // 1. Récupérer toutes les données de la montre originale
    const originalWatch = await getWatchByIdForAdmin(watchId)

    // 2. Générer un nouveau code annonce (ajouter " - Copie" ou un suffixe)
    const newAdCode = `${originalWatch.adCode} - Copie`

    // 3. Créer la nouvelle montre avec toutes les données
    const newWatchData = {
      ...originalWatch,
      adCode: newAdCode,
      isAvailable: false, // La montre dupliquée est toujours hors stock par défaut
      isSold: false, // La montre dupliquée n'est jamais vendue
      saleDate: null, // Ne pas hériter de la date de vente de l'originale
    }

    const createResult = await createWatch(newWatchData)

    if (!createResult.success) {
      throw new Error(createResult.error || 'Erreur lors de la création de la montre dupliquée')
    }

    const newWatchId = createResult.data.id

    // 4. Dupliquer les images
    if (originalWatch.images && originalWatch.images.length > 0) {
      for (let i = 0; i < originalWatch.images.length; i++) {
        const image = originalWatch.images[i]
        if (image.url) {
          try {
            // Extraire le nom de fichier de l'URL ou générer un nouveau nom
            const urlParts = image.url.split('/')
            const originalFileName = urlParts[urlParts.length - 1].split('?')[0] // Enlever les query params
            const fileExt = originalFileName.split('.').pop() || 'jpg'
            const newFileName = `duplicate-${Date.now()}-${i}.${fileExt}`

            // Télécharger l'image depuis l'URL
            const imageFile = await downloadImageAsFile(image.url, newFileName)

            // Uploader l'image pour la nouvelle montre
            await uploadWatchImage(newWatchId, imageFile, image.order || i + 1)
          } catch (imageError) {
            console.error(`Erreur lors de la duplication de l'image ${i + 1}:`, imageError)
            // Continuer avec les autres images même si une échoue
          }
        }
      }
    }

    return {
      success: true,
      data: { id: newWatchId },
    }
  } catch (error) {
    console.error('Erreur dans duplicateWatch:', error)
    return {
      success: false,
      error: error.message || 'Erreur lors de la duplication de la montre',
    }
  }
}

/**
 * Attache la première image à chaque montre (requête batch, évite le N+1).
 * @param {Array<object>} watches
 * @returns {Promise<Array<object>>}
 */
async function attachFirstImagesToWatches(watches) {
  if (!watches || watches.length === 0) {
    return []
  }

  const watchIds = watches.map((watch) => watch.id)
  const { data: allImages, error: imagesError } = await supabase
    .from('watch_images')
    .select('watch_id, image_url, image_path, image_order')
    .in('watch_id', watchIds)
    .order('image_order', { ascending: true })

  if (imagesError) {
    console.error('Erreur lors du chargement des images des montres:', imagesError)
  }

  const firstImageByWatchId = new Map()
  for (const image of allImages || []) {
    if (!firstImageByWatchId.has(image.watch_id)) {
      firstImageByWatchId.set(image.watch_id, image)
    }
  }

  return watches.map((watch) => {
    const firstImage = firstImageByWatchId.get(watch.id)
    let imageUrl = null
    if (firstImage) {
      if (firstImage.image_url) {
        imageUrl = firstImage.image_url
      } else if (firstImage.image_path) {
        const { data } = supabase.storage.from('watch-images').getPublicUrl(firstImage.image_path)
        imageUrl = data.publicUrl
      }
    }

    return {
      ...watch,
      images: imageUrl ? [imageUrl] : [],
    }
  })
}

/**
 * Récupère toutes les montres (pour l'admin, avec toutes les données)
 * @returns {Promise<Array>} Liste des montres avec la première image
 */
export async function getAllWatchesForAdmin() {
  try {
    const { data: watches, error } = await supabase
      .from('watches')
      .select('*')
      .order('display_order', { ascending: false })

    if (error) {
      throw new Error(`Erreur lors de la récupération des montres: ${error.message}`)
    }

    return attachFirstImagesToWatches(watches || [])
  } catch (error) {
    console.error('Erreur dans getAllWatchesForAdmin:', error)
    throw error
  }
}

/**
 * Recherche paginée de montres disponibles (sélecteur admin).
 * @param {{ search?: string, page?: number, pageSize?: number, excludeIds?: string[] }} [options]
 * @returns {Promise<{ watches: Array<object>, total: number, page: number, pageSize: number }>}
 */
export async function searchWatchesForAdmin({
  search = '',
  page = 1,
  pageSize = 24,
  excludeIds = [],
} = {}) {
  const pageNum = Math.max(1, page)
  const size = Math.min(100, Math.max(1, pageSize))
  const offset = (pageNum - 1) * size

  let query = supabase
    .from('watches')
    .select('*', { count: 'exact' })
    .eq('is_available', true)
    .order('display_order', { ascending: false })

  const term = search.trim()
  if (term) {
    const pattern = `%${term.replace(/[%_]/g, '')}%`
    query = query.or(`brand.ilike.${pattern},name.ilike.${pattern}`)
  }

  const validExclude = (excludeIds || []).filter(Boolean)
  if (validExclude.length > 0) {
    query = query.not('id', 'in', `(${validExclude.map((id) => `"${id}"`).join(',')})`)
  }

  query = query.range(offset, offset + size - 1)

  const { data: watches, error, count } = await query
  if (error) {
    throw new Error(`Erreur lors de la recherche de montres: ${error.message}`)
  }

  const withImages = await attachFirstImagesToWatches(watches || [])

  return {
    watches: withImages,
    total: count ?? 0,
    page: pageNum,
    pageSize: size,
  }
}

/**
 * Récupère des montres par ID (ordre préservé), avec la première image.
 * @param {string[]} ids
 * @returns {Promise<Array<object>>}
 */
export async function getWatchesByIdsForAdmin(ids) {
  const validIds = (ids || []).filter(Boolean)
  if (validIds.length === 0) {
    return []
  }

  const { data: watches, error } = await supabase.from('watches').select('*').in('id', validIds)

  if (error) {
    throw new Error(`Erreur lors de la récupération des montres: ${error.message}`)
  }

  const withImages = await attachFirstImagesToWatches(watches || [])
  const byId = new Map(withImages.map((watch) => [watch.id, watch]))
  return validIds.map((id) => byId.get(id)).filter(Boolean)
}

/**
 * Met à jour le display_order d'une montre
 * @param {string} watchId - ID de la montre
 * @param {number} newOrder - Nouvel ordre d'affichage
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function updateWatchDisplayOrder(watchId, newOrder) {
  try {
    const { error } = await supabase
      .from('watches')
      .update({ display_order: newOrder })
      .eq('id', watchId)

    if (error) {
      throw new Error(`Erreur lors de la mise à jour de l'ordre: ${error.message}`)
    }

    return {
      success: true,
    }
  } catch (error) {
    console.error('Erreur dans updateWatchDisplayOrder:', error)
    return {
      success: false,
      error: error.message || 'Erreur lors de la mise à jour de l\'ordre',
    }
  }
}

/**
 * Réorganise plusieurs montres en une seule transaction
 * @param {Array<{id: string, display_order: number}>} watchOrders - Tableau d'objets avec id et display_order
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function reorderWatches(watchOrders) {
  try {
    // Mettre à jour toutes les montres en parallèle
    const updates = watchOrders.map(({ id, display_order }) =>
      supabase
        .from('watches')
        .update({ display_order })
        .eq('id', id)
    )

    const results = await Promise.all(updates)
    
    // Vérifier s'il y a des erreurs
    const errors = results.filter((result) => result.error)
    if (errors.length > 0) {
      throw new Error(`Erreur lors de la réorganisation: ${errors[0].error.message}`)
    }

    return {
      success: true,
    }
  } catch (error) {
    console.error('Erreur dans reorderWatches:', error)
    return {
      success: false,
      error: error.message || 'Erreur lors de la réorganisation des montres',
    }
  }
}

/**
 * Récupère les statistiques des montres groupées par jour (créées et vendues)
 * @returns {Promise<Array<{date: string, created: number, sold: number, totalValue: number}>>} Tableau des statistiques par jour, trié par date
 */
export async function getWatchStatsByDay() {
  try {
    // Récupérer toutes les montres
    const watches = await getAllWatchesForAdmin()

    if (!watches || watches.length === 0) {
      return []
    }

    // Grouper les montres par jour (créées et vendues)
    const statsMap = new Map()

    watches.forEach((watch) => {
      // Statistiques des montres créées
      if (watch.created_at) {
        const createdDate = new Date(watch.created_at)
        const createdDateKey = createdDate.toISOString().split('T')[0]

        if (!statsMap.has(createdDateKey)) {
          statsMap.set(createdDateKey, { created: 0, sold: 0, totalValue: 0 })
        }
        const stats = statsMap.get(createdDateKey)
        stats.created += 1
      }

      // Statistiques des montres vendues (utiliser sale_date si disponible, sinon vérifier is_sold)
      if (watch.is_sold === true && watch.sale_date) {
        const soldDate = new Date(watch.sale_date)
        const soldDateKey = soldDate.toISOString().split('T')[0]

        if (!statsMap.has(soldDateKey)) {
          statsMap.set(soldDateKey, { created: 0, sold: 0, totalValue: 0 })
        }
        const stats = statsMap.get(soldDateKey)
        stats.sold += 1
        // Ajouter la valeur de la montre vendue (prix)
        if (watch.price && typeof watch.price === 'number') {
          stats.totalValue += watch.price
        }
      }
    })

    // Convertir la Map en tableau d'objets et trier par date
    const stats = Array.from(statsMap.entries())
      .map(([date, counts]) => ({
        date,
        created: counts.created,
        sold: counts.sold,
        totalValue: counts.totalValue,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    return stats
  } catch (error) {
    console.error('Erreur dans getWatchStatsByDay:', error)
    throw error
  }
}

/**
 * Statistiques d'inventaire et de répartition des montres.
 * Requête légère (colonnes ciblées, sans images) pour éviter le coût de getAllWatchesForAdmin().
 * @returns {Promise<{
 *   stockCount: number, stockValue: number,
 *   outOfStockCount: number,
 *   soldCount: number, soldValue: number,
 *   totalCount: number,
 *   sellThroughRate: number,
 *   avgSellingPrice: number,
 *   avgTimeToSellDays: number|null,
 *   byBrand: Array<{ label: string, count: number, value: number }>,
 *   byPriceRange: Array<{ label: string, count: number }>,
 *   byAudience: Array<{ label: string, count: number }>,
 *   byStatus: Array<{ label: string, count: number }>,
 * }>}
 */
export async function getWatchInventoryStats() {
  try {
    const { data, error } = await supabase
      .from('watches')
      .select('price, brand, audience, condition, is_available, is_sold, sale_date, created_at, stock_quantity')

    if (error) {
      throw new Error(`Erreur lors de la récupération des statistiques d'inventaire: ${error.message}`)
    }

    const watches = data || []

    const retail = isRetailCatalog()

    // Une montre est "vendue" en mode resale, ou en rupture de stock en mode retail.
    const isOutOfStock = (w) =>
      retail ? Number(w.stock_quantity) <= 0 : w.is_sold === true
    const isSold = (w) => w.is_sold === true
    const isInStock = (w) =>
      retail
        ? w.is_available !== false && Number(w.stock_quantity) > 0
        : w.is_available !== false && w.is_sold !== true

    const priceOf = (w) => parseFloat(w.price) || 0

    const inStock = watches.filter(isInStock)
    const soldWatches = watches.filter(isSold)
    const outOfStock = watches.filter((w) => isOutOfStock(w) && !isSold(w))

    const stockCount = inStock.length
    const stockValue = inStock.reduce((sum, w) => sum + priceOf(w), 0)
    const soldCount = soldWatches.length
    const soldValue = soldWatches.reduce((sum, w) => sum + priceOf(w), 0)
    const outOfStockCount = outOfStock.length
    const totalCount = watches.length

    // Taux d'écoulement = vendues / (vendues + actives en stock)
    const sellThroughBase = soldCount + stockCount
    const sellThroughRate = sellThroughBase > 0 ? (soldCount / sellThroughBase) * 100 : 0

    const avgSellingPrice = soldCount > 0 ? soldValue / soldCount : 0

    // Délai moyen de vente (jours) sur les montres vendues avec date de création + de vente
    const sellDurations = soldWatches
      .filter((w) => w.created_at && w.sale_date)
      .map((w) => {
        const created = new Date(w.created_at).getTime()
        const sold = new Date(w.sale_date).getTime()
        return (sold - created) / (1000 * 60 * 60 * 24)
      })
      .filter((d) => Number.isFinite(d) && d >= 0)
    const avgTimeToSellDays =
      sellDurations.length > 0
        ? sellDurations.reduce((sum, d) => sum + d, 0) / sellDurations.length
        : null

    // Répartition par marque (top 8)
    const brandMap = new Map()
    for (const w of watches) {
      const label = (w.brand || 'Sans marque').trim() || 'Sans marque'
      if (!brandMap.has(label)) {
        brandMap.set(label, { label, count: 0, value: 0 })
      }
      const entry = brandMap.get(label)
      entry.count += 1
      entry.value += priceOf(w)
    }
    const byBrand = Array.from(brandMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)

    // Répartition par tranche de prix
    const priceBuckets = [
      { label: '< 1 000 €', min: 0, max: 1000, count: 0 },
      { label: '1 000 - 5 000 €', min: 1000, max: 5000, count: 0 },
      { label: '5 000 - 10 000 €', min: 5000, max: 10000, count: 0 },
      { label: '10 000 - 25 000 €', min: 10000, max: 25000, count: 0 },
      { label: '> 25 000 €', min: 25000, max: Infinity, count: 0 },
    ]
    for (const w of watches) {
      const price = priceOf(w)
      const bucket = priceBuckets.find((b) => price >= b.min && price < b.max)
      if (bucket) bucket.count += 1
    }
    const byPriceRange = priceBuckets.map(({ label, count }) => ({ label, count }))

    // Répartition par audience
    const audienceLabels = {
      homme: 'Homme',
      femme: 'Femme',
      unisexe: 'Unisexe',
    }
    const audienceMap = new Map()
    for (const w of watches) {
      const key = w.audience || 'unisexe'
      const label = audienceLabels[key] || key
      audienceMap.set(label, (audienceMap.get(label) || 0) + 1)
    }
    const byAudience = Array.from(audienceMap.entries()).map(([label, count]) => ({ label, count }))

    // Répartition par statut
    const byStatus = retail
      ? [
          { label: 'En stock', count: stockCount },
          { label: 'Hors stock', count: outOfStockCount },
        ]
      : [
          { label: 'En vente', count: stockCount },
          { label: 'Hors stock', count: outOfStockCount },
          { label: 'Vendues', count: soldCount },
        ]

    return {
      stockCount,
      stockValue,
      outOfStockCount,
      soldCount,
      soldValue,
      totalCount,
      sellThroughRate,
      avgSellingPrice,
      avgTimeToSellDays,
      byBrand,
      byPriceRange,
      byAudience,
      byStatus,
    }
  } catch (error) {
    console.error('Erreur dans getWatchInventoryStats:', error)
    throw error
  }
}

/**
 * Fonction récursive pour lister tous les fichiers dans un dossier et ses sous-dossiers
 * @param {string} folderPath - Chemin du dossier à lister
 * @returns {Promise<Array>} Liste de tous les fichiers
 */
async function listAllFilesRecursively(folderPath = '') {
  const allFiles = []
  const limit = 1000
  
  // Fonction récursive interne
  const listFolder = async (path) => {
    const { data: items, error } = await supabase.storage
      .from('watch-images')
      .list(path, {
        limit: limit,
      })
    
    if (error) {
      console.error(`Erreur lors de la liste de ${path}:`, error)
      return
    }
    
    if (!items || items.length === 0) {
      return
    }
    
    // Séparer les dossiers et les fichiers
    // Dans Supabase Storage, les dossiers n'ont pas de metadata.id
    const folders = items.filter(item => !item.id && item.name) // Les dossiers n'ont pas d'id
    const files = items.filter(item => item.id) // Les fichiers ont un id
    
    // Ajouter les fichiers à la liste
    allFiles.push(...files)
    
    // Parcourir récursivement les sous-dossiers
    for (const folder of folders) {
      const subPath = path ? `${path}/${folder.name}` : folder.name
      await listFolder(subPath)
    }
  }
  
  await listFolder(folderPath)
  return allFiles
}

/**
 * Récupère les statistiques d'utilisation du stockage Supabase
 * @returns {Promise<{totalSize: number, totalSizeMB: number, totalSizeGB: number, fileCount: number, limitGB: number, usagePercent: number}>}
 */
export async function getStorageStats() {
  try {
    // Lister récursivement tous les fichiers du bucket watch-images
    const allFiles = await listAllFilesRecursively('')
    
    console.log(`Nombre total de fichiers trouvés: ${allFiles.length}`)
    
    // Calculer la taille totale
    const totalSize = allFiles.reduce((sum, file) => {
      // La taille est dans metadata.size (en bytes)
      const fileSize = file.metadata?.size || 0
      return sum + fileSize
    }, 0)
    
    const totalSizeMB = totalSize / (1024 * 1024)
    const totalSizeGB = totalSizeMB / 1024
    
    // Limite selon le plan (à ajuster selon votre plan Supabase)
    // Free: 1GB, Pro: 100GB, Team: 200GB
    const limitGB = 1 // Plan Free (1GB)
    
    const usagePercent = (totalSizeGB / limitGB) * 100
    
    return {
      totalSize,
      totalSizeMB,
      totalSizeGB,
      fileCount: allFiles.length,
      limitGB,
      usagePercent: Math.min(usagePercent, 100) // Cap à 100%
    }
  } catch (error) {
    console.error('Erreur dans getStorageStats:', error)
    throw error
  }
}

/**
 * Récupère la taille de toutes les tables de la base de données en Mo
 * @returns {Promise<Array<{table_name: string, size_bytes: number, size_mb: number, row_count: number}>>}
 */
export async function getTableSizes() {
  try {
    // Appeler la fonction SQL RPC
    const { data, error } = await supabase.rpc('get_table_sizes')
    
    if (error) {
      throw new Error(`Erreur lors de la récupération des tailles des tables: ${error.message}`)
    }
    
    return data || []
  } catch (error) {
    console.error('Erreur dans getTableSizes:', error)
    throw error
  }
}


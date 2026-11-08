import { supabase } from './supabase'
import { isArticleUuid } from '@/utils/articleSlug.js'

/**
 * Récupère les articles paginés depuis Supabase
 * @param {number} page - Numéro de page (défaut: 1)
 * @param {number} limit - Nombre d'articles par page (défaut: 10)
 * @param {string} category - Catégorie pour filtrer (optionnel)
 * @param {boolean|null} isVisible - Filtrer par visibilité (true = visible, false = masqué, null = tous) (optionnel)
 * @returns {Promise<Object>} { articles, total, totalPages }
 */
export async function getAllArticles(page = 1, limit = 10, category = null, isVisible = true) {
  try {
    const offset = (page - 1) * limit

    // Construire la requête de base
    let query = supabase.from('articles').select('*', { count: 'exact' })

    // Appliquer le filtre de visibilité si fourni
    if (isVisible !== null) {
      query = query.eq('is_visible', isVisible)
    }

    // Appliquer le filtre de catégorie si fourni (categories est un array)
    if (category) {
      query = query.contains('categories', [category])
    }

    // Trier par date de création décroissante et paginer
    const { data: articles, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      throw new Error(`Erreur lors de la récupération des articles: ${error.message}`)
    }

    const total = count || 0
    const totalPages = Math.ceil(total / limit)

    return {
      articles: articles || [],
      total,
      totalPages,
    }
  } catch (error) {
    console.error('Erreur dans getAllArticles:', error)
    throw error
  }
}

/**
 * Récupère un article par son ID ou son slug (`/blog/<slug>`)
 * @param {string|number} id - ID ou slug de l'article
 * @returns {Promise<Object>} Données de l'article
 */
export async function getArticleById(id) {
  try {
    const key = String(id)
    const { data: article, error } = await supabase
      .from('articles')
      .select('*')
      .eq(isArticleUuid(key) ? 'id' : 'slug', isArticleUuid(key) ? key : key.toLowerCase())
      .eq('is_visible', true)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error('Article non trouvé')
      }
      throw new Error(`Erreur lors de la récupération de l'article: ${error.message}`)
    }

    if (!article) {
      throw new Error('Article non trouvé')
    }

    // Vérifier que l'article est visible (double vérification)
    if (!article.is_visible) {
      throw new Error('Article non trouvé')
    }

    return article
  } catch (error) {
    console.error('Erreur dans getArticleById:', error)
    throw error
  }
}

/**
 * Récupère toutes les catégories uniques depuis les articles visibles
 * @returns {Promise<Array<string>>} Liste des catégories
 */
export async function getAllCategories() {
  try {
    const { data: articles, error } = await supabase
      .from('articles')
      .select('categories')
      .eq('is_visible', true)

    if (error) {
      throw new Error(`Erreur lors de la récupération des catégories: ${error.message}`)
    }

    // Extraire toutes les catégories depuis les arrays et créer un Set unique
    const allCategories = []
    articles.forEach((article) => {
      if (article.categories && Array.isArray(article.categories)) {
        allCategories.push(...article.categories)
      }
    })

    // Filtrer les valeurs null/undefined/vides et créer un Set unique
    const uniqueCategories = [...new Set(allCategories.filter(Boolean))]

    return uniqueCategories.sort()
  } catch (error) {
    console.error('Erreur dans getAllCategories:', error)
    throw error
  }
}

/**
 * Incrémente le compteur de vues d'un article
 * @param {string|number} id - ID de l'article
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function incrementArticleViewCount(id) {
  try {
    // S'assurer que l'ID est une string (UUID)
    const articleId = String(id)
    
    // Essayer d'utiliser la fonction RPC (recommandée car elle contourne RLS avec SECURITY DEFINER)
    const { data: rowsAffected, error: rpcError } = await supabase.rpc('increment_article_view_count', {
      article_id: articleId,
    })

    // Si la RPC fonctionne, vérifier que des lignes ont été affectées
    if (!rpcError) {
      // La fonction peut retourner void (ancienne version) ou INTEGER (nouvelle version)
      if (rowsAffected === undefined || rowsAffected === null) {
        return { success: true }
      } else if (rowsAffected === 1) {
        return { success: true }
      } else if (rowsAffected === 0) {
        return {
          success: false,
          error: 'Article non trouvé ou déjà supprimé',
        }
      } else {
        return { success: true } // On considère quand même que c'est un succès
      }
    }
    
    console.error('[incrementArticleViewCount] Erreur RPC:', rpcError)

    // Si la fonction RPC n'existe pas, essayer un fallback
    if (rpcError.message?.includes('function') && rpcError.message?.includes('does not exist')) {
      console.warn(
        'La fonction RPC increment_article_view_count n\'existe pas. ' +
        'Veuillez exécuter le script SQL supabase_articles_visibility_migration.sql dans Supabase.'
      )

      // Fallback : récupérer l'article, incrémenter et mettre à jour
      // Note: Ce fallback ne fonctionnera pas pour les utilisateurs anonymes à cause de RLS
      // mais on essaie quand même pour les logs
      const { data: article, error: fetchError } = await supabase
        .from('articles')
        .select('view_count')
        .eq('id', id)
        .single()

      if (fetchError || !article) {
        return {
          success: false,
          error: `Article non trouvé: ${fetchError?.message || 'Article introuvable'}`,
        }
      }

      const { error: updateError } = await supabase
        .from('articles')
        .update({ view_count: (article.view_count || 0) + 1 })
        .eq('id', id)

      if (updateError) {
        // Probablement un problème de permissions RLS
        console.error('Erreur RLS lors de l\'incrémentation (fallback):', updateError.message)
        return {
          success: false,
          error: `Permissions insuffisantes. La fonction RPC doit être créée dans Supabase.`,
        }
      }

      return { success: true }
    }

    // Autre erreur de la RPC
    console.error('Erreur lors de l\'appel RPC increment_article_view_count:', rpcError)
    return {
      success: false,
      error: `Erreur RPC: ${rpcError.message}`,
    }
  } catch (error) {
    console.error('Erreur dans incrementArticleViewCount:', error)
    return {
      success: false,
      error: error.message || 'Une erreur est survenue lors de l\'incrémentation du compteur',
    }
  }
}


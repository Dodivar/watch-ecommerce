import { supabase } from './supabase'

/**
 * Récupère les articles liés à une montre (uniquement les articles visibles)
 * @param {string} watchId - ID de la montre
 * @returns {Promise<Array>} Liste des articles liés et visibles
 */
export async function getWatchArticles(watchId) {
  try {
    const { data, error } = await supabase
      .from('watch_articles')
      .select(`
        article_id,
        articles ( * )
      `)
      .eq('watch_id', watchId)
    // `*` plutôt qu'une liste : `articles.slug` n'existe que sur les projets migrés.

    if (error) {
      throw new Error(`Erreur lors de la récupération des articles liés: ${error.message}`)
    }

    if (!data || data.length === 0) {
      return []
    }

    // Filtrer uniquement les articles visibles et transformer les données
    const articles = data
      .map((item) => item.articles)
      .filter((article) => article && article.is_visible === true)
      .map((article) => ({
        id: article.id,
        slug: article.slug ?? null,
        title: article.title,
        text: article.text,
        categories: article.categories || [],
        created_at: article.created_at,
        updated_at: article.updated_at,
      }))

    return articles
  } catch (error) {
    console.error('Erreur dans getWatchArticles:', error)
    throw error
  }
}

/**
 * Récupère tous les articles liés à une montre (pour l'admin, y compris les masqués)
 * @param {string} watchId - ID de la montre
 * @returns {Promise<Array>} Liste de tous les articles liés
 */
export async function getWatchArticlesForAdmin(watchId) {
  try {
    const { data, error } = await supabase
      .from('watch_articles')
      .select(`
        article_id,
        articles (
          id,
          title,
          text,
          categories,
          created_at,
          updated_at,
          is_visible
        )
      `)
      .eq('watch_id', watchId)

    if (error) {
      throw new Error(`Erreur lors de la récupération des articles liés: ${error.message}`)
    }

    if (!data || data.length === 0) {
      return []
    }

    // Transformer les données (inclure tous les articles, même masqués)
    const articles = data
      .map((item) => item.articles)
      .filter((article) => article !== null)
      .map((article) => ({
        id: article.id,
        title: article.title,
        text: article.text,
        categories: article.categories || [],
        created_at: article.created_at,
        updated_at: article.updated_at,
        is_visible: article.is_visible,
      }))

    return articles
  } catch (error) {
    console.error('Erreur dans getWatchArticlesForAdmin:', error)
    throw error
  }
}

/**
 * Lie des articles à une montre
 * @param {string} watchId - ID de la montre
 * @param {Array<string>} articleIds - Tableau des IDs des articles à lier
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function linkWatchToArticles(watchId, articleIds) {
  try {
    if (!Array.isArray(articleIds) || articleIds.length === 0) {
      return {
        success: true,
      }
    }

    // Préparer les données pour l'insertion
    const links = articleIds.map((articleId) => ({
      watch_id: watchId,
      article_id: articleId,
    }))

    // Insérer les liens (ignore les doublons grâce à la contrainte UNIQUE)
    const { error } = await supabase
      .from('watch_articles')
      .upsert(links, {
        onConflict: 'watch_id,article_id',
        ignoreDuplicates: false,
      })

    if (error) {
      throw new Error(`Erreur lors de la liaison des articles: ${error.message}`)
    }

    return {
      success: true,
    }
  } catch (error) {
    console.error('Erreur dans linkWatchToArticles:', error)
    return {
      success: false,
      error: error.message || 'Erreur lors de la liaison des articles',
    }
  }
}

/**
 * Supprime des liens entre une montre et des articles
 * @param {string} watchId - ID de la montre
 * @param {Array<string>} articleIds - Tableau des IDs des articles à délier
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function unlinkWatchFromArticles(watchId, articleIds) {
  try {
    if (!Array.isArray(articleIds) || articleIds.length === 0) {
      return {
        success: true,
      }
    }

    const { error } = await supabase
      .from('watch_articles')
      .delete()
      .eq('watch_id', watchId)
      .in('article_id', articleIds)

    if (error) {
      throw new Error(`Erreur lors de la suppression des liens: ${error.message}`)
    }

    return {
      success: true,
    }
  } catch (error) {
    console.error('Erreur dans unlinkWatchFromArticles:', error)
    return {
      success: false,
      error: error.message || 'Erreur lors de la suppression des liens',
    }
  }
}

/**
 * Met à jour les liens entre une montre et des articles
 * Supprime tous les liens existants et crée les nouveaux
 * @param {string} watchId - ID de la montre
 * @param {Array<string>} articleIds - Tableau des IDs des articles à lier
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function updateWatchArticles(watchId, articleIds) {
  try {
    // 1. Supprimer tous les liens existants pour cette montre
    const { error: deleteError } = await supabase
      .from('watch_articles')
      .delete()
      .eq('watch_id', watchId)

    if (deleteError) {
      throw new Error(`Erreur lors de la suppression des liens existants: ${deleteError.message}`)
    }

    // 2. Si aucun article à lier, on a terminé
    if (!Array.isArray(articleIds) || articleIds.length === 0) {
      return {
        success: true,
      }
    }

    // 3. Créer les nouveaux liens
    const links = articleIds.map((articleId) => ({
      watch_id: watchId,
      article_id: articleId,
    }))

    const { error: insertError } = await supabase
      .from('watch_articles')
      .insert(links)

    if (insertError) {
      throw new Error(`Erreur lors de la création des nouveaux liens: ${insertError.message}`)
    }

    return {
      success: true,
    }
  } catch (error) {
    console.error('Erreur dans updateWatchArticles:', error)
    return {
      success: false,
      error: error.message || 'Erreur lors de la mise à jour des liens',
    }
  }
}

/**
 * Récupère tous les articles visibles (pour la sélection dans l'admin)
 * @param {number} page - Numéro de page (défaut: 1)
 * @param {number} limit - Nombre d'articles par page (défaut: 50)
 * @returns {Promise<Object>} { articles, total, totalPages }
 */
export async function getAllVisibleArticles(page = 1, limit = 50) {
  try {
    const offset = (page - 1) * limit

    const { data: articles, error, count } = await supabase
      .from('articles')
      .select('*', { count: 'exact' })
      .eq('is_visible', true)
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
    console.error('Erreur dans getAllVisibleArticles:', error)
    throw error
  }
}

























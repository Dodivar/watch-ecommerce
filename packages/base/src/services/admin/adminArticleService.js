import { supabase } from '../supabase'
import { isArticleUuid } from '@/utils/articleSlug.js'

/**
 * Récupère tous les articles pour l'administration (sans pagination)
 * @returns {Promise<Array>} Liste de tous les articles avec le nombre de montres liées
 */
export async function getAllArticlesForAdmin() {
  try {
    const { data: articles, error } = await supabase
      .from('articles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Erreur lors de la récupération des articles: ${error.message}`)
    }

    if (!articles || articles.length === 0) {
      return []
    }

    // Récupérer le nombre de montres liées pour chaque article
    const articleIds = articles.map((article) => article.id)
    
    // Récupérer tous les liens watch_articles pour ces articles
    const { data: watchArticlesLinks, error: linksError } = await supabase
      .from('watch_articles')
      .select('article_id')
      .in('article_id', articleIds)

    if (linksError) {
      console.warn('Erreur lors de la récupération des liens watch_articles:', linksError)
      // Si erreur, on continue quand même mais sans le count
      return articles.map((article) => ({
        ...article,
        watch_count: 0,
      }))
    }

    // Compter le nombre de montres par article
    const watchCountMap = new Map()
    if (watchArticlesLinks) {
      watchArticlesLinks.forEach((link) => {
        const count = watchCountMap.get(link.article_id) || 0
        watchCountMap.set(link.article_id, count + 1)
      })
    }

    // Ajouter le count à chaque article
    return articles.map((article) => ({
      ...article,
      watch_count: watchCountMap.get(article.id) || 0,
    }))
  } catch (error) {
    console.error('Erreur dans getAllArticlesForAdmin:', error)
    throw error
  }
}

/**
 * Récupère un article par son ID pour l'administration
 * @param {string|number} id - ID de l'article
 * @returns {Promise<Object>} Données de l'article
 */
export async function getArticleByIdForAdmin(id) {
  try {
    // ID (formulaire d'édition) ou slug (aperçu depuis `/blog/<slug>`).
    const key = String(id)
    const { data: article, error } = await supabase
      .from('articles')
      .select('*')
      .eq(isArticleUuid(key) ? 'id' : 'slug', isArticleUuid(key) ? key : key.toLowerCase())
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

    return article
  } catch (error) {
    console.error('Erreur dans getArticleByIdForAdmin:', error)
    throw error
  }
}

/**
 * Crée un nouvel article
 * @param {Object} articleData - Données de l'article { title, text, categories }
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export async function createArticle(articleData) {
  try {
    // Valider les données
    if (!articleData.title || !articleData.title.trim()) {
      return {
        success: false,
        error: 'Le titre est obligatoire',
      }
    }

    if (!articleData.text || !articleData.text.trim()) {
      return {
        success: false,
        error: 'Le contenu est obligatoire',
      }
    }

    // Préparer les données pour la base
    const articleDB = {
      title: articleData.title.trim(),
      text: articleData.text.trim(),
      categories: articleData.categories && Array.isArray(articleData.categories)
        ? articleData.categories.filter((cat) => cat && cat.trim())
        : [],
      is_visible: articleData.is_visible !== undefined ? articleData.is_visible : true,
    }

    const { data: article, error } = await supabase
      .from('articles')
      .insert(articleDB)
      .select()
      .single()

    if (error) {
      throw new Error(`Erreur lors de la création de l'article: ${error.message}`)
    }

    return {
      success: true,
      data: article,
    }
  } catch (error) {
    console.error('Erreur dans createArticle:', error)
    return {
      success: false,
      error: error.message || 'Une erreur est survenue lors de la création de l\'article',
    }
  }
}

/**
 * Met à jour un article existant
 * @param {string|number} id - ID de l'article
 * @param {Object} articleData - Données de l'article { title, text, categories }
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export async function updateArticle(id, articleData) {
  try {
    // Valider les données
    if (!articleData.title || !articleData.title.trim()) {
      return {
        success: false,
        error: 'Le titre est obligatoire',
      }
    }

    if (!articleData.text || !articleData.text.trim()) {
      return {
        success: false,
        error: 'Le contenu est obligatoire',
      }
    }

    // Préparer les données pour la base
    const articleDB = {
      title: articleData.title.trim(),
      text: articleData.text.trim(),
      categories: articleData.categories && Array.isArray(articleData.categories)
        ? articleData.categories.filter((cat) => cat && cat.trim())
        : [],
      updated_at: new Date().toISOString(),
    }

    // Inclure is_visible si fourni
    if (articleData.is_visible !== undefined) {
      articleDB.is_visible = articleData.is_visible
    }

    const { data: article, error } = await supabase
      .from('articles')
      .update(articleDB)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return {
          success: false,
          error: 'Article non trouvé',
        }
      }
      throw new Error(`Erreur lors de la mise à jour de l'article: ${error.message}`)
    }

    return {
      success: true,
      data: article,
    }
  } catch (error) {
    console.error('Erreur dans updateArticle:', error)
    return {
      success: false,
      error: error.message || 'Une erreur est survenue lors de la mise à jour de l\'article',
    }
  }
}

/**
 * Supprime un article
 * @param {string|number} id - ID de l'article
 * @returns {Promise<{success: boolean, error?: string}>}
 * 
 * Note: La suppression d'un article supprime automatiquement tous ses liens avec les montres
 * grâce à la contrainte ON DELETE CASCADE définie dans la table watch_articles.
 */
export async function deleteArticle(id) {
  try {
    const { error } = await supabase.from('articles').delete().eq('id', id)

    if (error) {
      if (error.code === 'PGRST116') {
        return {
          success: false,
          error: 'Article non trouvé',
        }
      }
      throw new Error(`Erreur lors de la suppression de l'article: ${error.message}`)
    }

    return {
      success: true,
    }
  } catch (error) {
    console.error('Erreur dans deleteArticle:', error)
    return {
      success: false,
      error: error.message || 'Une erreur est survenue lors de la suppression de l\'article',
    }
  }
}

/**
 * Bascule la visibilité d'un article (visible/non visible)
 * @param {string|number} id - ID de l'article
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export async function toggleArticleVisibility(id) {
  try {
    // Récupérer l'article actuel pour obtenir l'état de visibilité
    const { data: article, error: fetchError } = await supabase
      .from('articles')
      .select('is_visible')
      .eq('id', id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return {
          success: false,
          error: 'Article non trouvé',
        }
      }
      throw new Error(`Erreur lors de la récupération de l'article: ${fetchError.message}`)
    }

    if (!article) {
      return {
        success: false,
        error: 'Article non trouvé',
      }
    }

    // Bascule la visibilité
    const newVisibility = !article.is_visible

    const { data: updatedArticle, error: updateError } = await supabase
      .from('articles')
      .update({ is_visible: newVisibility })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      throw new Error(`Erreur lors de la mise à jour: ${updateError.message}`)
    }

    return {
      success: true,
      data: updatedArticle,
    }
  } catch (error) {
    console.error('Erreur dans toggleArticleVisibility:', error)
    return {
      success: false,
      error: error.message || 'Une erreur est survenue lors du changement de visibilité',
    }
  }
}

/**
 * Récupère les statistiques des articles groupées par jour (créés et vues)
 * @returns {Promise<Array<{date: string, created: number, views: number}>>} Tableau des statistiques par jour, trié par date
 */
export async function getArticleStatsByDay() {
  try {
    // Récupérer tous les articles
    const articles = await getAllArticlesForAdmin()

    if (!articles || articles.length === 0) {
      return []
    }

    // Grouper les articles par jour (créés et vues)
    const statsMap = new Map()

    articles.forEach((article) => {
      // Statistiques des articles créés
      if (article.created_at) {
        const createdDate = new Date(article.created_at)
        const createdDateKey = createdDate.toISOString().split('T')[0]

        if (!statsMap.has(createdDateKey)) {
          statsMap.set(createdDateKey, { created: 0, views: 0 })
        }
        const stats = statsMap.get(createdDateKey)
        stats.created += 1
        // Ajouter les vues de cet article (view_count cumulatif)
        stats.views += article.view_count || 0
      }
    })

    // Convertir la Map en tableau d'objets et trier par date
    const stats = Array.from(statsMap.entries())
      .map(([date, counts]) => ({
        date,
        created: counts.created,
        views: counts.views,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    return stats
  } catch (error) {
    console.error('Erreur dans getArticleStatsByDay:', error)
    throw error
  }
}


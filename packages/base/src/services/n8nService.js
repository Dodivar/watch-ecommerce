/**
 * Service pour appeler les workflows n8n via le backend proxy
 */

import { getBackendApiUrl } from './backendApiUrl.js'
import { supabase } from './supabase'

const SITE_ID = import.meta.env.VITE_SITE_ID || 'sauvage-watches'

/**
 * Génère un article depuis le nom d'une montre ou d'une marque via n8n
 * @param {string} watchName - Le nom de la montre ou de la marque
 * @returns {Promise<Object>} La réponse du workflow n8n
 * @throws {Error} Si l'appel échoue
 */
export async function generateArticleFromWatch(watchName) {
  if (!watchName || !watchName.trim()) {
    throw new Error('Le nom de la montre ou de la marque est obligatoire')
  }

  const {
    data: { session },
  } = await supabase.auth.getSession()
  const token = session?.access_token
  if (!token) {
    throw new Error('Session admin requise pour générer un article')
  }

  try {
    console.log(`Appel du workflow n8n pour générer un article: ${watchName}`)

    const response = await fetch(`${getBackendApiUrl()}/api/n8n/generate-article`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        'X-Site-Id': SITE_ID,
      },
      credentials: 'include',
      body: JSON.stringify({ watchName: watchName.trim() }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ 
        error: `Erreur HTTP ${response.status}` 
      }))
      throw new Error(errorData.error || `Erreur HTTP ${response.status}`)
    }

    const result = await response.json()

    if (!result.success) {
      throw new Error(result.error || 'Erreur lors de la génération de l\'article')
    }

    console.log('Workflow n8n exécuté avec succès:', result.data)
    return result.data || result
  } catch (error) {
    console.error('Erreur lors de l\'appel au workflow n8n:', error)
    
    if (error instanceof Error) {
      throw error
    }
    
    throw new Error(
      error.message || 
      'Une erreur est survenue lors de la génération de l\'article. Veuillez réessayer.'
    )
  }
}


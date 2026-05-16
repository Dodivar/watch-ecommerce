const BACKEND_URL = import.meta.env.PROD
  ? import.meta.env.VITE_BACKEND_URL
  : 'http://localhost:3000'

/**
 * Crée une session Stripe Checkout et redirige l'utilisateur vers la page de paiement
 * @param {string} watchId - ID de la montre à acheter
 * @returns {Promise<void>}
 */
export async function createCheckoutSession(watchId) {
  try {
    if (!watchId) {
      throw new Error('ID de montre manquant')
    }

    // Appeler l'API backend pour créer la session
    const response = await fetch(`${BACKEND_URL}/api/stripe/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ watchId }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Erreur lors de la création de la session de paiement')
    }

    if (!data.success || !data.url) {
      throw new Error('Réponse invalide du serveur')
    }

    // Rediriger vers Stripe Checkout
    window.location.href = data.url
  } catch (error) {
    console.error('Erreur lors de la création de la session Stripe:', error)
    throw error
  }
}

/**
 * Panier : crée une session Stripe Checkout multi-lignes puis redirige.
 * @param {string[] | { watchIds?: string[], lines?: { watchId: string, quantity: number }[] }} payload
 *   - Legacy : tableau d’ids (quantité 1 chacun).
 *   - Objet : `watchIds` et/ou `lines` (quantités agrégées par montre côté client).
 * @returns {Promise<void>}
 */
export async function createCheckoutSessionFromCart(payload) {
  try {
    const body = Array.isArray(payload)
      ? { watchIds: payload }
      : payload && typeof payload === 'object'
        ? payload
        : { watchIds: [] }

    const hasLines = Array.isArray(body.lines) && body.lines.length > 0
    const hasIds = Array.isArray(body.watchIds) && body.watchIds.length > 0
    if (!hasLines && !hasIds) {
      throw new Error('Panier vide')
    }

    const response = await fetch(`${BACKEND_URL}/api/stripe/create-checkout-session-cart`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Erreur lors de la création de la session de paiement')
    }

    if (!data.success || !data.url) {
      throw new Error('Réponse invalide du serveur')
    }

    window.location.href = data.url
  } catch (error) {
    console.error('Erreur lors de la création de la session Stripe (panier):', error)
    throw error
  }
}

/**
 * Vérifie la validité d'une session de paiement ou d'un token
 * @param {string|null} sessionId - ID de la session Stripe (pour PaymentSuccess)
 * @param {string|null} watchId - ID de la montre (optionnel si session panier ou token seul)
 * @param {string|null} token - Token temporaire (pour PaymentCancel)
 * @returns {Promise<{valid: boolean, reason?: string, watchIds?: string[], session?: object}>}
 */
export async function verifyPaymentSession(sessionId, watchId, token = null) {
  try {
    const params = new URLSearchParams()
    if (sessionId) {
      params.append('session_id', sessionId)
    }
    if (watchId) {
      params.append('watch_id', watchId)
    }
    if (token) {
      params.append('token', token)
    }

    if (params.toString().length === 0) {
      return { valid: false, reason: 'Paramètres manquants' }
    }

    // Appeler l'API backend pour vérifier
    const response = await fetch(`${BACKEND_URL}/api/stripe/verify-session?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        valid: false,
        reason: data.reason || 'Erreur lors de la vérification',
      }
    }

    return data
  } catch (error) {
    console.error('Erreur lors de la vérification de la session de paiement:', error)
    return {
      valid: false,
      reason: 'Erreur de connexion au serveur',
    }
  }
}



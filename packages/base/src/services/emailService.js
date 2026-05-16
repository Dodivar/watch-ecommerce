/**
 * Service pour gérer l'envoi d'emails depuis les formulaires
 */

// Configuration de l'API URL
const API_URL = import.meta.env.PROD
  ? import.meta.env.VITE_BACKEND_URL
  : 'http://localhost:3000'

// Fonction pour envoyer un email avec retry
export const sendEmailWithRetry = async (endpoint, formData, maxRetries = 3) => {
  let retries = 0
  const retryDelay = 2000 // 2 secondes

  while (retries < maxRetries) {
    try {
      console.log(`Tentative ${retries + 1} d'envoi à ${API_URL}${endpoint}`)

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
        headers: {
          Accept: 'application/json',
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Erreur lors de l'envoi de l'email")
      }

      return await response.json()
    } catch (error) {
      console.error(`Tentative ${retries + 1} échouée:`, error)
      retries++

      if (retries === maxRetries) {
        throw new Error("Une erreur s'est produite, veuillez réessayer dans quelques instants.")
      }

      // Attendre avant de réessayer
      await new Promise((resolve) => setTimeout(resolve, retryDelay))
    }
  }
}

/**
 * Envoie un email à partir des données du formulaire
 * @param {FormData} formData - Les données du formulaire
 * @returns {Promise<Object>} La réponse du serveur
 * @throws {Error} Si l'envoi échoue
 */
export async function sendEmail(formData) {
  try {
    console.log("Début de l'envoi de l'email...")
    const response = await sendEmailWithRetry('/api/send-email', formData)
    console.log('Email envoyé avec succès:', response)
    return response
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email:", error)
    throw new Error(error.message || "Une erreur est survenue lors de l'envoi de l'email")
  }
}

/**
 * Prépare les données du formulaire d'estimation
 * @param {HTMLFormElement} form - Le formulaire d'estimation
 * @returns {FormData} Les données du formulaire formatées
 */
export function prepareEstimationFormData(form) {
  const formData = new FormData(form)

  // Supprime les entrées contact_mode[] du FormData pour éviter les doublons
  formData.delete('contact_mode[]')

  // Ajoute le type de formulaire
  formData.append('type', 'estimation')

  // Ajoute le mode de contact (plusieurs choix possibles)
  const checked = Array.from(form.querySelectorAll('input[name="contact_mode[]"]:checked')).map(
    (cb) => cb.value,
  )
  formData.append('contact_mode', checked.join(', '))

  return formData
}

/**
 * Prépare les données du formulaire de recherche
 * @param {HTMLFormElement} form - Le formulaire de recherche
 * @returns {FormData} Les données du formulaire formatées
 */
export function prepareSearchFormData(form) {
  const formData = new FormData(form)

  // Supprime les entrées contact_mode[] du FormData pour éviter les doublons
  formData.delete('contact_mode[]')

  // Ajoute le type de formulaire
  formData.append('type', 'search')

  // Ajoute le mode de contact si présent
  const checked = Array.from(form.querySelectorAll('input[name="contact_mode[]"]:checked')).map(
    (cb) => cb.value,
  )
  formData.append('contact_mode', checked.join(', '))

  return formData
}

/**
 * Prépare les données du formulaire de contact
 * @param {HTMLFormElement} form - Le formulaire de contact
 * @returns {FormData} Les données du formulaire formatées
 */
export function prepareContactFormData(form) {
  const formData = new FormData(form)
  formData.append('type', 'contact')
  return formData
}

/**
 * Gère la soumission d'un formulaire
 * @param {HTMLFormElement} form - Le formulaire à soumettre
 * @param {Function} prepareFormData - Fonction pour préparer les données du formulaire
 * @param {Function} onSuccess - Callback en cas de succès
 * @param {Function} onError - Callback en cas d'erreur
 * @returns {Promise<void>}
 */
export async function handleFormSubmit(form, prepareFormData, onSuccess, onError) {
  try {
    const formData = prepareFormData(form)
    const response = await sendEmail(formData)
    onSuccess(response)
  } catch (error) {
    console.error('Erreur détaillée dans handleFormSubmit:', error)
    onError(error)
  }
}

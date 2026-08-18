/**
 * Service pour gérer l'envoi d'emails depuis les formulaires
 */

import { getBackendApiUrl, readApiResponseBody } from './backendApiUrl.js'
import { getActiveLocale, t } from '@/i18n'

/** Site actif (build Vite) — évite qu'en local le backend prenne le mauvais site via Origin :5173. */
const SITE_ID = import.meta.env.VITE_SITE_ID || 'sauvage-watches'

/**
 * Joint la langue du visiteur à un envoi de formulaire.
 *
 * Le backend répond aujourd'hui en français quel que soit l'expéditeur ; sans ce champ il n'a
 * aucun moyen de faire autrement. Le transmettre dès maintenant permet de localiser les mails
 * de confirmation sans retoucher les composants.
 *
 * @param {FormData} formData
 * @returns {FormData}
 */
function withLocale(formData) {
  formData.append('locale', getActiveLocale())
  return formData
}

// Fonction pour envoyer un email avec retry
export const sendEmailWithRetry = async (endpoint, formData, maxRetries = 3) => {
  let retries = 0
  const retryDelay = 2000 // 2 secondes

  while (retries < maxRetries) {
    try {
      const apiUrl = getBackendApiUrl()
      console.log(`Tentative ${retries + 1} d'envoi à ${apiUrl}${endpoint}`)

      const response = await fetch(`${apiUrl}${endpoint}`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
        headers: {
          Accept: 'application/json',
          'X-Site-Id': SITE_ID,
        },
      })

      if (!response.ok) {
        const error = await readApiResponseBody(response)
        const hint =
          response.status === 405
            ? " (l'URL du backend est peut-être incorrecte — vérifiez VITE_BACKEND_URL)"
            : ''
        throw new Error(
          (error.message || error.error || t('form.emailSendError')) + hint,
        )
      }

      return await readApiResponseBody(response)
    } catch (error) {
      console.error(`Tentative ${retries + 1} échouée:`, error)
      retries++

      if (retries === maxRetries) {
        throw new Error(t('form.sendFailedRetry'))
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
    throw new Error(error.message || t('form.emailSendError'))
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

  return withLocale(formData)
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

  return withLocale(formData)
}

/**
 * Prépare les données du formulaire de contact
 * @param {HTMLFormElement} form - Le formulaire de contact
 * @returns {FormData} Les données du formulaire formatées
 */
export function prepareContactFormData(form) {
  const formData = new FormData(form)
  formData.append('type', 'contact')
  return withLocale(formData)
}

/**
 * Prépare les données du formulaire de prise de rendez-vous (fiche montre retail).
 * @param {HTMLFormElement} form
 * @param {{ id: string|number, name: string, price?: number|string, url?: string }} watchContext
 * @returns {FormData}
 */
export function prepareAppointmentFormData(form, watchContext) {
  const formData = new FormData(form)
  formData.append('type', 'appointment')
  formData.append('watch_id', String(watchContext.id))
  formData.append('watch_name', watchContext.name)
  if (watchContext.price != null && watchContext.price !== '') {
    formData.append('watch_price', String(watchContext.price))
  }
  if (watchContext.url) {
    formData.append('watch_url', watchContext.url)
  }
  return withLocale(formData)
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

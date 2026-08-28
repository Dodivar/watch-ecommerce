/**
 * État partagé des avis Google pour la durée d'un chargement de page.
 *
 * La page d'accueil et la page Contact peuvent afficher le bloc en même temps : la promesse est
 * mémoïsée au niveau module pour qu'un seul aller-retour réseau soit émis, quel que soit le
 * nombre de composants montés.
 */

import { computed, ref } from 'vue'

import { getSiteConfig } from '@/site/getSiteConfig.js'
import { fetchGoogleReviews } from '@/services/googleReviewsService.js'

/** @type {import('vue').Ref<'idle' | 'loading' | 'ready' | 'empty'>} */
const status = ref('idle')
const rating = ref(null)
const userRatingCount = ref(0)
const googleMapsUri = ref('')
const reviews = ref([])

/** @type {Promise<void> | null} */
let pendingLoad = null

/** Remet l'état à zéro — réservé aux tests, l'état est un singleton de module. */
export function resetGoogleReviewsState() {
  status.value = 'idle'
  rating.value = null
  userRatingCount.value = 0
  googleMapsUri.value = ''
  reviews.value = []
  pendingLoad = null
}

/**
 * @returns {{
 *   status: import('vue').Ref<string>,
 *   rating: import('vue').Ref<number|null>,
 *   userRatingCount: import('vue').Ref<number>,
 *   reviews: import('vue').Ref<object[]>,
 *   profileUrl: import('vue').ComputedRef<string>,
 *   load: () => Promise<void>,
 * }}
 */
export function useGoogleReviews() {
  const site = getSiteConfig()
  const config = site.googleReviews || {}

  /** Lien vers la fiche : celui renvoyé par Google, sinon celui déclaré dans le manifest. */
  const profileUrl = computed(() => googleMapsUri.value || config.profileUrl || '')

  async function load() {
    if (!site.features?.googleReviews) {
      status.value = 'empty'
      return
    }
    if (pendingLoad) return pendingLoad
    if (status.value === 'ready' || status.value === 'empty') return

    status.value = 'loading'
    pendingLoad = fetchGoogleReviews({ locale: site.i18n?.activeLocale || site.locale })
      .then((data) => {
        if (!data || data.reviews.length === 0) {
          status.value = 'empty'
          return
        }
        rating.value = data.rating
        userRatingCount.value = data.userRatingCount
        googleMapsUri.value = data.googleMapsUri
        reviews.value = data.reviews.slice(0, config.maxReviews || data.reviews.length)
        status.value = 'ready'
      })
      .finally(() => {
        pendingLoad = null
      })

    return pendingLoad
  }

  return { status, rating, userRatingCount, reviews, profileUrl, load }
}

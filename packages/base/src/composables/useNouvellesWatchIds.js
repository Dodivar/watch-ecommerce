import { ref } from 'vue'
import { loadNouvellesWatchIds } from '@/services/nouvellesWatchesService'

/**
 * IDs des montres « nouveautés » (alignés sur CarouselNouvelles).
 */
export function useNouvellesWatchIds() {
  const watchIds = ref(new Set())
  const isLoading = ref(true)

  loadNouvellesWatchIds()
    .then((ids) => {
      watchIds.value = ids
    })
    .catch((error) => {
      console.error('Erreur lors du chargement des nouveautés:', error)
      watchIds.value = new Set()
    })
    .finally(() => {
      isLoading.value = false
    })

  const isNouvelle = (watchId) => Boolean(watchId && watchIds.value.has(watchId))

  return { watchIds, isLoading, isNouvelle }
}

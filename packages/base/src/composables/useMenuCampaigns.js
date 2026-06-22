import { ref, computed } from 'vue'
import { getMenuCampaignLinksPublic } from '@/services/watchPromotionCampaignService.js'

const links = ref(/** @type {Array<{ label: string, to: string, slug: string, name: string }> | null} */ (null))
const isLoading = ref(false)
const error = ref(/** @type {string | null} */ (null))
/** @type {Promise<void> | null} */
let loadPromise = null

async function loadMenuCampaigns() {
  if (links.value) return
  if (loadPromise) {
    await loadPromise
    return
  }

  isLoading.value = true
  error.value = null

  loadPromise = (async () => {
    try {
      links.value = await getMenuCampaignLinksPublic()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Impossible de charger les promotions.'
      links.value = []
    } finally {
      isLoading.value = false
      loadPromise = null
    }
  })()

  await loadPromise
}

/**
 * Liens dynamiques campagnes actives pour le mega-menu Promotions.
 */
export function useMenuCampaigns() {
  async function load() {
    await loadMenuCampaigns()
  }

  return {
    links: computed(() => links.value ?? []),
    isLoading: computed(() => isLoading.value),
    error: computed(() => error.value),
    load,
  }
}

export function prefetchMenuCampaigns() {
  return loadMenuCampaigns()
}

export function invalidateMenuCampaignsCache() {
  links.value = null
}

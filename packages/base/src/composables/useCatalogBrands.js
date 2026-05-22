import { ref, computed } from 'vue'
import {
  getAvailableCatalogBrands,
  peekAvailableCatalogBrands,
} from '@/services/watchService'

const brands = ref(/** @type {string[] | null} */ (peekAvailableCatalogBrands()))
const isLoading = ref(false)
const error = ref(/** @type {string | null} */ (null))
/** @type {Promise<void> | null} */
let loadPromise = null

async function loadCatalogBrands() {
  if (brands.value) return
  if (loadPromise) {
    await loadPromise
    return
  }

  isLoading.value = true
  error.value = null

  loadPromise = (async () => {
    try {
      brands.value = await getAvailableCatalogBrands()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Impossible de charger les marques.'
      brands.value = []
    } finally {
      isLoading.value = false
      loadPromise = null
    }
  })()

  await loadPromise
}

/**
 * Marques disponibles dans le catalogue (fetch unique, cache partagé).
 * Utilise une requête légère (`select brand`) via {@link getAvailableCatalogBrands}.
 * Cache mémoire (SPA) + sessionStorage TTL 15 min (rechargements de page).
 */
export function useCatalogBrands() {
  async function load() {
    await loadCatalogBrands()
  }

  return {
    brands: computed(() => brands.value ?? []),
    isLoading: computed(() => isLoading.value),
    error: computed(() => error.value),
    load,
  }
}

/**
 * Précharge les marques catalogue (ex. header avec mega-menu marques).
 */
export function prefetchCatalogBrands() {
  return loadCatalogBrands()
}

/**
 * Répartit une liste en N colonnes (remplissage vertical par colonne).
 * @param {string[]} items
 * @param {number} columnCount
 * @returns {string[][]}
 */
export function splitIntoColumns(items, columnCount) {
  const count = Math.max(1, Math.floor(columnCount))
  if (items.length === 0) return Array.from({ length: count }, () => [])

  const columns = Array.from({ length: count }, () => /** @type {string[]} */ ([]))
  const baseSize = Math.floor(items.length / count)
  const remainder = items.length % count
  let index = 0

  for (let columnIndex = 0; columnIndex < count; columnIndex += 1) {
    const size = baseSize + (columnIndex < remainder ? 1 : 0)
    columns[columnIndex] = items.slice(index, index + size)
    index += size
  }

  return columns
}

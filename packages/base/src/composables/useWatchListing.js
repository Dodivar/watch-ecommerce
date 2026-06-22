import { ref, computed, watch, reactive } from 'vue'
import { getAllWatchesForListing } from '@/services/watchService'
import { getActiveCampaignWatchPricingPublic } from '@/services/watchPromotionCampaignService.js'
import { enrichWatchesWithActiveCampaignPricing } from '@/utils/watchPromotionCampaign.js'
import {
  compareCaseSizeValues,
  normalizeCaseSizeValue,
  watchMatchesCaseSize,
} from '@/utils/caseSize'
import { compareWatchesByRecent } from '@/utils/watchSort.js'
import {
  getCatalogWatchPrice,
  getEffectiveWatchPrice,
  isWatchOnPromotion,
} from '@/utils/watchPricing.js'

function watchMatchesAudience(watchModel, selected) {
  if (!selected || selected === 'all') return true
  const a = watchModel.audience || 'unisexe'
  if (a === 'unisexe') return true
  return a === selected
}

function countAppliedBrandFilters(selectedBrands) {
  return selectedBrands.length
}

function countAppliedPriceActive(priceMin, priceMax) {
  return priceMin !== null || priceMax !== null ? 1 : 0
}

function countAppliedAudience(selectedAudience) {
  return selectedAudience !== 'all' ? 1 : 0
}

function countAppliedCaseSizes(selectedCaseSizes) {
  return selectedCaseSizes.length
}

function countAppliedPromotionOnly(selectedPromotionOnly) {
  return selectedPromotionOnly ? 1 : 0
}

function countAppliedCampaignFilter(selectedCampaignWatchIds) {
  return selectedCampaignWatchIds?.size > 0 ? 1 : 0
}

/**
 * Filtre facettes collection (marque, public, diamètre, prix).
 * Prix appliqués : `priceMin` / `priceMax` (null = pas de borne).
 * Limites slider : prix catalogue (plage stable). Filtrage : prix effectif (promo incluse).
 * Prix brouillon : `priceRange` + limites catalogue ; filtre si la plage diffère des limites.
 *
 * @param {Array<{ brand: string, price: number, audience?: string, details?: { caseSize?: string } }>} watchList
 * @param {{
 *   selectedBrands: string[],
 *   selectedAudience: string,
 *   selectedCaseSizes: string[],
 *   priceMin?: number | null,
 *   priceMax?: number | null,
 *   priceRange?: [number, number],
 *   priceMinLimit?: number,
 *   priceMaxLimit?: number,
 *   selectedPromotionOnly?: boolean,
 *   selectedCampaignWatchIds?: Set<string> | null,
 * }} options
 */
function filterWatchesForListing(watchList, options) {
  let filtered = watchList
  const {
    selectedBrands,
    selectedAudience,
    selectedCaseSizes,
    priceMin,
    priceMax,
    priceRange,
    priceMinLimit,
    priceMaxLimit,
    selectedPromotionOnly,
    selectedCampaignWatchIds,
  } = options

  if (selectedCampaignWatchIds?.size > 0) {
    filtered = filtered.filter((watch) => selectedCampaignWatchIds.has(watch.id))
  } else if (selectedPromotionOnly) {
    filtered = filtered.filter((watch) => isWatchOnPromotion(watch))
  }

  if (selectedBrands.length > 0) {
    filtered = filtered.filter((watch) => selectedBrands.includes(watch.brand))
  }

  if (selectedAudience !== 'all') {
    filtered = filtered.filter((w) => watchMatchesAudience(w, selectedAudience))
  }

  if (selectedCaseSizes.length > 0) {
    filtered = filtered.filter((w) => watchMatchesCaseSize(w, selectedCaseSizes))
  }

  if (
    priceRange != null &&
    priceMinLimit != null &&
    priceMaxLimit != null &&
    (priceRange[0] !== priceMinLimit || priceRange[1] !== priceMaxLimit)
  ) {
    filtered = filtered.filter(
      (watch) => {
        const filterPrice = getEffectiveWatchPrice(watch)
        return filterPrice >= priceRange[0] && filterPrice <= priceRange[1]
      },
    )
  } else if (priceMin !== undefined || priceMax !== undefined) {
    if (priceMin !== null || priceMax !== null) {
      filtered = filtered.filter((watch) => {
        const filterPrice = getEffectiveWatchPrice(watch)
        const matchesMin = priceMin === null || filterPrice >= priceMin
        const matchesMax = priceMax === null || filterPrice <= priceMax
        return matchesMin && matchesMax
      })
    }
  }

  return filtered
}

/**
 * Listing montres : chargement, filtres marque / audience / prix, tri.
 */
export function useWatchListing() {
  const selectedBrands = ref([])
  const selectedCaseSizes = ref(/** @type {string[]} */ ([]))
  const selectedAudience = ref(/** @type {AudienceFilter} */ ('all'))
  const selectedPromotionOnly = ref(false)
  const selectedEventSlug = ref('')
  const campaignFilterLabel = ref('')
  const selectedCampaignWatchIds = ref(/** @type {Set<string> | null} */ (null))
  const priceMin = ref(null)
  const priceMax = ref(null)
  const sortOrder = ref('recent')

  const isFilterDrawerOpen = ref(false)
  const isSortMenuOpen = ref(false)

  const tempPriceRange = ref([0, 150000])
  const tempSelectedBrands = ref([])
  const tempSelectedCaseSizes = ref(/** @type {string[]} */ ([]))
  const tempPriceMinInput = ref(0)
  const tempPriceMaxInput = ref(150000)
  /** Brouillon « Public » dans le tiroir ; validé via `applyDrawerFilters`. */
  const tempAudience = ref(/** @type {AudienceFilter} */ ('all'))
  /** Brouillon « Promotions » dans le tiroir ; validé via `applyDrawerFilters`. */
  const tempPromotionOnly = ref(false)

  const watches = ref([])
  const isLoading = ref(true)
  const error = ref(null)

  const roundToTen = (value) => Math.ceil(value / 10) * 10

  /** Jeu de montres pour limites de prix / filtres (toujours la collection complète chargée). */
  const scopedWatches = computed(() => watches.value)

  const priceMinLimit = computed(() => {
    if (scopedWatches.value.length === 0) return 0
    return Math.min(...scopedWatches.value.map((w) => getCatalogWatchPrice(w)))
  })

  const priceMaxLimit = computed(() => {
    if (scopedWatches.value.length === 0) return 150000
    return Math.max(...scopedWatches.value.map((w) => getCatalogWatchPrice(w)))
  })

  const quickPriceRanges = computed(() => {
    if (scopedWatches.value.length === 0) return []

    const min = priceMinLimit.value
    const max = priceMaxLimit.value
    const oneThirdMax = roundToTen(max / 3)
    const halfMax = roundToTen(max / 2)
    const quarterMax = roundToTen(max / 4)
    const threeQuarterMax = roundToTen((max * 3) / 4)

    return [
      {
        id: 'min-to-third',
        label: `jusqu'à ${oneThirdMax.toLocaleString()} €`,
        min,
        max: oneThirdMax,
      },
      {
        id: 'min-to-half',
        label: `jusqu'à ${halfMax.toLocaleString()} €`,
        min,
        max: halfMax,
      },
      {
        id: 'quarter-to-three-quarter',
        label: `${quarterMax.toLocaleString()} € - ${threeQuarterMax.toLocaleString()} €`,
        min: quarterMax,
        max: threeQuarterMax,
      },
      {
        id: 'half-to-max',
        label: `à partir de ${halfMax.toLocaleString()} €`,
        min: halfMax,
        max,
      },
    ]
  })

  const availableBrands = computed(() => {
    const brands = [...new Set(watches.value.map((watch) => watch.brand))]
    return brands.sort()
  })

  const availableCaseSizes = computed(() => {
    const sizes = new Set()
    for (const watch of scopedWatches.value) {
      const normalized = normalizeCaseSizeValue(watch.details?.caseSize)
      if (normalized) sizes.add(normalized)
    }
    return [...sizes].sort(compareCaseSizeValues)
  })

  /** Compte filtres **appliqués** (hors tri), pour le badge « Filtrer ». */
  const activeFilterCount = computed(() => {
    let n = 0
    n += countAppliedBrandFilters(selectedBrands.value)
    n += countAppliedCaseSizes(selectedCaseSizes.value)
    n += countAppliedAudience(selectedAudience.value)
    n += countAppliedPromotionOnly(selectedPromotionOnly.value)
    n += countAppliedCampaignFilter(selectedCampaignWatchIds.value)
    n += countAppliedPriceActive(priceMin.value, priceMax.value)
    return n
  })

  /** Compte filtres **brouillon** dans le tiroir (badge sections + APPLIQUER). */
  const draftFilterCount = computed(() => {
    let n = 0
    n += countAppliedBrandFilters(tempSelectedBrands.value)
    n += countAppliedCaseSizes(tempSelectedCaseSizes.value)
    n += countAppliedAudience(tempAudience.value)
    n += countAppliedPromotionOnly(tempPromotionOnly.value)
    const priceActive =
      tempPriceRange.value[0] > priceMinLimit.value ||
      tempPriceRange.value[1] < priceMaxLimit.value
    n += priceActive ? 1 : 0
    return n
  })

  const hasActiveFilters = computed(() => activeFilterCount.value > 0)

  const filteredWatches = computed(() => {
    const filtered = filterWatchesForListing(scopedWatches.value, {
      selectedBrands: selectedBrands.value,
      selectedAudience: selectedAudience.value,
      selectedCaseSizes: selectedCaseSizes.value,
      selectedPromotionOnly: selectedPromotionOnly.value,
      selectedCampaignWatchIds: selectedCampaignWatchIds.value,
      priceMin: priceMin.value,
      priceMax: priceMax.value,
    })

    const sorted = [...filtered]
    switch (sortOrder.value) {
      case 'price-asc':
        sorted.sort((a, b) => getEffectiveWatchPrice(a) - getEffectiveWatchPrice(b))
        break
      case 'price-desc':
        sorted.sort((a, b) => getEffectiveWatchPrice(b) - getEffectiveWatchPrice(a))
        break
      case 'recent':
      default:
        sorted.sort(compareWatchesByRecent)
    }

    return sorted
  })

  /** Nombre de montres correspondant au brouillon du tiroir (aperçu). */
  function getDraftFilteredCount() {
    return filterWatchesForListing(scopedWatches.value, {
      selectedBrands: tempSelectedBrands.value,
      selectedAudience: tempAudience.value,
      selectedCaseSizes: tempSelectedCaseSizes.value,
      selectedPromotionOnly: tempPromotionOnly.value,
      selectedCampaignWatchIds: selectedCampaignWatchIds.value,
      priceRange: tempPriceRange.value,
      priceMinLimit: priceMinLimit.value,
      priceMaxLimit: priceMaxLimit.value,
    }).length
  }

  /** Compte brouillon pour une section (pastille titre accordéon). */
  function getDraftSectionCount(section) {
    if (section === 'brand') {
      return tempSelectedBrands.value.length
    }
    if (section === 'audience') {
      return tempAudience.value !== 'all' ? 1 : 0
    }
    if (section === 'caseSize') {
      return tempSelectedCaseSizes.value.length
    }
    if (section === 'price') {
      const narrowed =
        tempPriceRange.value[0] > priceMinLimit.value ||
        tempPriceRange.value[1] < priceMaxLimit.value
      return narrowed ? 1 : 0
    }
    if (section === 'promotion') {
      return tempPromotionOnly.value ? 1 : 0
    }
    return 0
  }

  const openFilterDrawer = () => {
    const minValue = roundToTen(priceMin.value !== null ? priceMin.value : priceMinLimit.value)
    const maxValue = roundToTen(priceMax.value !== null ? priceMax.value : priceMaxLimit.value)
    tempPriceRange.value = [minValue, maxValue]
    tempPriceMinInput.value = minValue
    tempPriceMaxInput.value = maxValue
    tempSelectedBrands.value = [...selectedBrands.value]
    tempSelectedCaseSizes.value = [...selectedCaseSizes.value]
    tempAudience.value = selectedAudience.value
    tempPromotionOnly.value = selectedPromotionOnly.value
    isFilterDrawerOpen.value = true
    document.body.style.overflow = 'hidden'
  }

  const closeFilterDrawer = () => {
    isFilterDrawerOpen.value = false
    document.body.style.overflow = ''
  }

  const clearDraftFilters = () => {
    tempSelectedBrands.value = []
    tempSelectedCaseSizes.value = []
    tempAudience.value = 'all'
    tempPromotionOnly.value = false
    if (scopedWatches.value.length > 0) {
      const minPrice = Math.min(...scopedWatches.value.map((w) => getCatalogWatchPrice(w)))
      const maxPrice = Math.max(...scopedWatches.value.map((w) => getCatalogWatchPrice(w)))
      const roundedMin = roundToTen(minPrice)
      const roundedMax = roundToTen(maxPrice)
      tempPriceRange.value = [roundedMin, roundedMax]
      tempPriceMinInput.value = roundedMin
      tempPriceMaxInput.value = roundedMax
    }
  }

  /** Valide le brouillon vers les filtres appliqués. */
  const applyDrawerFilters = () => {
    if (
      tempPriceRange.value[0] <= priceMinLimit.value &&
      tempPriceRange.value[1] >= priceMaxLimit.value
    ) {
      priceMin.value = null
      priceMax.value = null
    } else {
      priceMin.value =
        tempPriceRange.value[0] === priceMinLimit.value ? null : tempPriceRange.value[0]
      priceMax.value =
        tempPriceRange.value[1] === priceMaxLimit.value ? null : tempPriceRange.value[1]
    }

    selectedAudience.value = tempAudience.value
    selectedPromotionOnly.value = tempPromotionOnly.value
    selectedCaseSizes.value = [...tempSelectedCaseSizes.value]
    selectedBrands.value = [...tempSelectedBrands.value]

    closeFilterDrawer()
    return {}
  }

  const toggleSortMenu = () => {
    isSortMenuOpen.value = !isSortMenuOpen.value
  }

  const closeSortMenu = () => {
    isSortMenuOpen.value = false
  }

  const selectSort = (value) => {
    sortOrder.value = value
    closeSortMenu()
  }

  const applyQuickPrice = (quickPrice) => {
    const maxValue =
      quickPrice.max !== null ? Math.min(quickPrice.max, priceMaxLimit.value) : priceMaxLimit.value
    tempPriceRange.value = [
      roundToTen(Math.max(quickPrice.min, priceMinLimit.value)),
      roundToTen(maxValue),
    ]
  }

  const isQuickPriceSelected = (quickPrice) => {
    const expectedMax =
      quickPrice.max !== null ? Math.min(quickPrice.max, priceMaxLimit.value) : priceMaxLimit.value
    const expectedMin = Math.max(quickPrice.min, priceMinLimit.value)
    return (
      Math.abs(tempPriceRange.value[0] - expectedMin) < 10 &&
      Math.abs(tempPriceRange.value[1] - expectedMax) < 10
    )
  }

  const updatePriceFromInput = () => {
    let newMin = roundToTen(tempPriceMinInput.value)
    let newMax = roundToTen(tempPriceMaxInput.value)
    if (newMin > newMax) {
      newMin = newMax
      tempPriceMinInput.value = newMin
    }
    newMin = Math.max(priceMinLimit.value, Math.min(priceMaxLimit.value, newMin))
    newMax = Math.max(priceMinLimit.value, Math.min(priceMaxLimit.value, newMax))
    tempPriceRange.value = [newMin, newMax]
    tempPriceMinInput.value = newMin
    tempPriceMaxInput.value = newMax
  }

  const toggleBrand = (brand) => {
    const index = tempSelectedBrands.value.indexOf(brand)
    if (index > -1) tempSelectedBrands.value.splice(index, 1)
    else tempSelectedBrands.value.push(brand)
  }

  const toggleCaseSize = (size) => {
    const index = tempSelectedCaseSizes.value.indexOf(size)
    if (index > -1) tempSelectedCaseSizes.value.splice(index, 1)
    else tempSelectedCaseSizes.value.push(size)
  }

  watch(
    () => [tempPriceRange.value[0], tempPriceRange.value[1]],
    ([min, max], [prevMin, prevMax]) => {
      if (min === prevMin && max === prevMax) return

      const roundedMin = roundToTen(min)
      const roundedMax = roundToTen(max)
      tempPriceMinInput.value = roundedMin
      tempPriceMaxInput.value = roundedMax

      if (roundedMin !== min || roundedMax !== max) {
        const clampedMin = Math.max(priceMinLimit.value, Math.min(priceMaxLimit.value, roundedMin))
        const clampedMax = Math.max(priceMinLimit.value, Math.min(priceMaxLimit.value, roundedMax))
        if (clampedMin !== min || clampedMax !== max) {
          tempPriceRange.value = [clampedMin, clampedMax]
        }
      }
    },
  )

  watch([priceMinLimit, priceMaxLimit], () => {
    if (tempPriceRange.value[0] < priceMinLimit.value) {
      tempPriceRange.value[0] = roundToTen(priceMinLimit.value)
      tempPriceMinInput.value = tempPriceRange.value[0]
    }
    if (tempPriceRange.value[1] > priceMaxLimit.value) {
      tempPriceRange.value[1] = roundToTen(priceMaxLimit.value)
      tempPriceMaxInput.value = tempPriceRange.value[1]
    }
  })

  function setCampaignFilter(slug, watchIds, label = '') {
    selectedEventSlug.value = slug || ''
    campaignFilterLabel.value = label || ''
    selectedCampaignWatchIds.value =
      watchIds?.length > 0 ? new Set(watchIds) : slug ? new Set() : null
    if (slug) {
      selectedPromotionOnly.value = false
    }
  }

  function clearCampaignFilter() {
    selectedEventSlug.value = ''
    campaignFilterLabel.value = ''
    selectedCampaignWatchIds.value = null
  }

  const resetAllFilters = () => {
    selectedBrands.value = []
    selectedCaseSizes.value = []
    selectedAudience.value = 'all'
    selectedPromotionOnly.value = false
    clearCampaignFilter()
    priceMin.value = null
    priceMax.value = null
    if (scopedWatches.value.length > 0) {
      const minPrice = Math.min(...scopedWatches.value.map((w) => getCatalogWatchPrice(w)))
      const maxPrice = Math.max(...scopedWatches.value.map((w) => getCatalogWatchPrice(w)))
      const roundedMin = roundToTen(minPrice)
      const roundedMax = roundToTen(maxPrice)
      tempPriceRange.value = [roundedMin, roundedMax]
      tempPriceMinInput.value = roundedMin
      tempPriceMaxInput.value = roundedMax
    }
    tempSelectedBrands.value = []
    tempSelectedCaseSizes.value = []
    tempAudience.value = 'all'
    tempPromotionOnly.value = false
  }

  const loadWatches = async () => {
    try {
      isLoading.value = true
      error.value = null
      const [data, campaignPricing] = await Promise.all([
        getAllWatchesForListing(),
        getActiveCampaignWatchPricingPublic(),
      ])
      watches.value = enrichWatchesWithActiveCampaignPricing(data, campaignPricing)
      const pool = watches.value
      if (pool.length > 0) {
        const minPrice = Math.min(...pool.map((w) => getCatalogWatchPrice(w)))
        const maxPrice = Math.max(...pool.map((w) => getCatalogWatchPrice(w)))
        const roundedMin = roundToTen(minPrice)
        const roundedMax = roundToTen(maxPrice)
        tempPriceRange.value = [roundedMin, roundedMax]
        tempPriceMinInput.value = roundedMin
        tempPriceMaxInput.value = roundedMax
      }
    } catch (err) {
      console.error('Erreur lors du chargement des montres:', err)
      error.value = err.message || 'Une erreur est survenue lors du chargement des montres'
    } finally {
      isLoading.value = false
    }
  }

  return reactive({
    scopedWatches,
    selectedBrands,
    selectedCaseSizes,
    selectedAudience,
    selectedPromotionOnly,
    selectedEventSlug,
    campaignFilterLabel,
    selectedCampaignWatchIds,
    setCampaignFilter,
    clearCampaignFilter,
    priceMin,
    priceMax,
    sortOrder,
    isFilterDrawerOpen,
    isSortMenuOpen,
    tempPriceRange,
    tempSelectedBrands,
    tempSelectedCaseSizes,
    tempPriceMinInput,
    tempPriceMaxInput,
    tempAudience,
    tempPromotionOnly,
    watches,
    isLoading,
    error,
    priceMinLimit,
    priceMaxLimit,
    quickPriceRanges,
    availableBrands,
    availableCaseSizes,
    hasActiveFilters,
    activeFilterCount,
    draftFilterCount,
    filteredWatches,
    roundToTen,
    getDraftFilteredCount,
    getDraftSectionCount,
    openFilterDrawer,
    closeFilterDrawer,
    clearDraftFilters,
    applyDrawerFilters,
    toggleSortMenu,
    closeSortMenu,
    selectSort,
    applyQuickPrice,
    isQuickPriceSelected,
    updatePriceFromInput,
    toggleBrand,
    toggleCaseSize,
    resetAllFilters,
    loadWatches,
  })
}

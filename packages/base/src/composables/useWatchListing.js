import { ref, computed, watch, reactive } from 'vue'
import { getAllWatches } from '@/services/watchService'
import { resolveBrandFromSlug } from '@/utils/brandSlug.js'

function watchMatchesAudience(watchModel, selected) {
  if (!selected || selected === 'all') return true
  const a = watchModel.audience || 'unisexe'
  if (a === 'unisexe') return true
  return a === selected
}

function countAppliedBrandFilters(brandSlugRef, selectedBrands) {
  if (brandSlugRef) return 0
  return selectedBrands.length
}

function countAppliedPriceActive(priceMin, priceMax) {
  return priceMin !== null || priceMax !== null ? 1 : 0
}

function countAppliedAudience(selectedAudience) {
  return selectedAudience !== 'all' ? 1 : 0
}

/**
 * Listing montres : chargement, filtres marque / audience / prix, tri.
 * @param {{ brandSlug?: import('vue').Ref }} options - Si `brandSlug` est renseigné, le jeu de montres est restreint à cette marque (slug URL).
 */
export function useWatchListing(options = {}) {
  const brandSlug = options.brandSlug != null ? options.brandSlug : ref(null)

  const selectedBrands = ref([])
  const selectedAudience = ref(/** @type {AudienceFilter} */ ('all'))
  const priceMin = ref(null)
  const priceMax = ref(null)
  const sortOrder = ref('recent')

  const isFilterDrawerOpen = ref(false)
  const isSortMenuOpen = ref(false)

  const tempPriceRange = ref([0, 150000])
  const tempSelectedBrands = ref([])
  const tempPriceMinInput = ref(0)
  const tempPriceMaxInput = ref(150000)
  /** Brouillon « Public » dans le tiroir ; validé via `applyDrawerFilters`. */
  const tempAudience = ref(/** @type {AudienceFilter} */ ('all'))

  const watches = ref([])
  const isLoading = ref(true)
  const error = ref(null)

  const roundToTen = (value) => Math.ceil(value / 10) * 10

  const resolvedFixedBrand = computed(() => {
    const slug = brandSlug?.value
    if (!slug) return null
    return resolveBrandFromSlug(watches.value, slug)
  })

  /** Montres de base pour cette vue (toutes, ou une marque si slug valide). */
  const scopedWatches = computed(() => {
    const slug = brandSlug?.value
    if (!slug) return watches.value
    const fb = resolvedFixedBrand.value
    if (!fb) return []
    return watches.value.filter((w) => w.brand === fb)
  })

  const priceMinLimit = computed(() => {
    if (scopedWatches.value.length === 0) return 0
    return Math.min(...scopedWatches.value.map((w) => w.price))
  })

  const priceMaxLimit = computed(() => {
    if (scopedWatches.value.length === 0) return 150000
    return Math.max(...scopedWatches.value.map((w) => w.price))
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

  /** Compte filtres **appliqués** (hors tri), pour le badge « Filtrer ». */
  const activeFilterCount = computed(() => {
    const slug = brandSlug?.value
    let n = 0
    n += countAppliedBrandFilters(slug, selectedBrands.value)
    n += countAppliedAudience(selectedAudience.value)
    n += countAppliedPriceActive(priceMin.value, priceMax.value)
    return n
  })

  /** Compte filtres **brouillon** dans le tiroir (badge sections + APPLIQUER). */
  const draftFilterCount = computed(() => {
    const slug = brandSlug?.value
    let n = 0
    n += countAppliedBrandFilters(slug, tempSelectedBrands.value)
    n += countAppliedAudience(tempAudience.value)
    const priceActive =
      tempPriceRange.value[0] > priceMinLimit.value ||
      tempPriceRange.value[1] < priceMaxLimit.value
    n += priceActive ? 1 : 0
    return n
  })

  const hasActiveFilters = computed(() => activeFilterCount.value > 0)

  const filteredWatches = computed(() => {
    let filtered = scopedWatches.value

    if (!brandSlug?.value && selectedBrands.value.length > 0) {
      filtered = filtered.filter((watch) => selectedBrands.value.includes(watch.brand))
    }

    if (selectedAudience.value !== 'all') {
      filtered = filtered.filter((w) => watchMatchesAudience(w, selectedAudience.value))
    }

    if (priceMin.value !== null || priceMax.value !== null) {
      filtered = filtered.filter((watch) => {
        const matchesMin = priceMin.value === null || watch.price >= priceMin.value
        const matchesMax = priceMax.value === null || watch.price <= priceMax.value
        return matchesMin && matchesMax
      })
    }

    const sorted = [...filtered]
    switch (sortOrder.value) {
      case 'price-asc':
        sorted.sort((a, b) => a.price - b.price)
        break
      case 'price-desc':
        sorted.sort((a, b) => b.price - a.price)
        break
      case 'recent':
      default:
        sorted.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
          if (dateA === 0 && dateB === 0) {
            return (b.displayOrder || 0) - (a.displayOrder || 0)
          }
          return dateB - dateA
        })
    }

    return sorted
  })

  /** Nombre de montres correspondant au brouillon du tiroir (aperçu). */
  function getDraftFilteredCount() {
    let filtered = scopedWatches.value
    if (!brandSlug?.value && tempSelectedBrands.value.length > 0) {
      filtered = filtered.filter((watch) => tempSelectedBrands.value.includes(watch.brand))
    }
    if (tempAudience.value !== 'all') {
      filtered = filtered.filter((w) => watchMatchesAudience(w, tempAudience.value))
    }
    if (
      tempPriceRange.value[0] !== priceMinLimit.value ||
      tempPriceRange.value[1] !== priceMaxLimit.value
    ) {
      filtered = filtered.filter(
        (watch) =>
          watch.price >= tempPriceRange.value[0] && watch.price <= tempPriceRange.value[1],
      )
    }
    return filtered.length
  }

  /** Compte brouillon pour une section (pastille titre accordéon). */
  function getDraftSectionCount(section) {
    if (section === 'brand') {
      if (brandSlug?.value) return 0
      return tempSelectedBrands.value.length
    }
    if (section === 'audience') {
      return tempAudience.value !== 'all' ? 1 : 0
    }
    if (section === 'price') {
      const narrowed =
        tempPriceRange.value[0] > priceMinLimit.value ||
        tempPriceRange.value[1] < priceMaxLimit.value
      return narrowed ? 1 : 0
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
    tempAudience.value = selectedAudience.value
    isFilterDrawerOpen.value = true
    document.body.style.overflow = 'hidden'
  }

  const closeFilterDrawer = () => {
    isFilterDrawerOpen.value = false
    document.body.style.overflow = ''
  }

  const clearDraftFilters = () => {
    tempSelectedBrands.value = []
    tempAudience.value = 'all'
    if (scopedWatches.value.length > 0) {
      const minPrice = Math.min(...scopedWatches.value.map((w) => w.price))
      const maxPrice = Math.max(...scopedWatches.value.map((w) => w.price))
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

    selectedBrands.value = [...tempSelectedBrands.value]

    closeFilterDrawer()
    return { navigateToBrandSlug: null }
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

  watch(
    tempPriceRange,
    (newValue, oldValue) => {
      if (!oldValue || (newValue[0] === oldValue[0] && newValue[1] === oldValue[1])) return

      const roundedMin = roundToTen(newValue[0])
      const roundedMax = roundToTen(newValue[1])
      tempPriceMinInput.value = roundedMin
      tempPriceMaxInput.value = roundedMax

      if (roundedMin !== newValue[0] || roundedMax !== newValue[1]) {
        const clampedMin = Math.max(priceMinLimit.value, Math.min(priceMaxLimit.value, roundedMin))
        const clampedMax = Math.max(priceMinLimit.value, Math.min(priceMaxLimit.value, roundedMax))
        if (clampedMin !== newValue[0] || clampedMax !== newValue[1]) {
          tempPriceRange.value = [clampedMin, clampedMax]
        }
      }
    },
    { deep: true },
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

  const resetAllFilters = () => {
    selectedBrands.value = []
    selectedAudience.value = 'all'
    priceMin.value = null
    priceMax.value = null
    if (scopedWatches.value.length > 0) {
      const minPrice = Math.min(...scopedWatches.value.map((w) => w.price))
      const maxPrice = Math.max(...scopedWatches.value.map((w) => w.price))
      const roundedMin = roundToTen(minPrice)
      const roundedMax = roundToTen(maxPrice)
      tempPriceRange.value = [roundedMin, roundedMax]
      tempPriceMinInput.value = roundedMin
      tempPriceMaxInput.value = roundedMax
    }
    tempSelectedBrands.value = []
    tempAudience.value = 'all'
  }

  const loadWatches = async () => {
    try {
      isLoading.value = true
      error.value = null
      const data = await getAllWatches()
      watches.value = data
      let pool = data
      const slug = brandSlug?.value
      if (slug && data.length > 0) {
        const fb = resolveBrandFromSlug(data, slug)
        if (fb) pool = data.filter((w) => w.brand === fb)
      }
      if (pool.length > 0) {
        const minPrice = Math.min(...pool.map((w) => w.price))
        const maxPrice = Math.max(...pool.map((w) => w.price))
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
    brandSlug,
    resolvedFixedBrand,
    scopedWatches,
    selectedBrands,
    selectedAudience,
    priceMin,
    priceMax,
    sortOrder,
    isFilterDrawerOpen,
    isSortMenuOpen,
    tempPriceRange,
    tempSelectedBrands,
    tempPriceMinInput,
    tempPriceMaxInput,
    tempAudience,
    watches,
    isLoading,
    error,
    priceMinLimit,
    priceMaxLimit,
    quickPriceRanges,
    availableBrands,
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
    resetAllFilters,
    loadWatches,
  })
}

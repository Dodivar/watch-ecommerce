<template>
  <section class="py-3 lg:py-10 min-h-screen">
    <div class="max-w-7xl mx-auto px-4">
      <!-- Header -->
      <div class="text-center mb-3 lg:mb-8">
        <h1 class="text-2xl font-bold text-text-main">Notre collection de montres</h1>
      </div>

      <!-- Filters Bar -->
      <div class="bg-white rounded-md shadow-lg p-6 mb-3 lg:mb-8">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <!-- Main Filters -->
          <div class="flex flex-wrap gap-4">
            <button
              @click="openBrandModal"
              class="px-4 py-2 border border-primary text-white bg-primary rounded-lg hover:bg-primary-hover focus:ring-2 focus:ring-primary focus:border-transparent transition-colors flex items-center gap-2"
            >
              <span>Marque</span>
              <span v-if="selectedBrands.length > 0" class="text-white font-semibold">
                ({{ selectedBrands.length === 1 ? selectedBrands[0] : selectedBrands.length }})
              </span>
            </button>

            <button
              @click="openPriceModal"
              class="px-4 py-2 border border-primary text-white bg-primary rounded-lg hover:bg-primary-hover focus:ring-2 focus:ring-primary focus:border-transparent transition-colors flex items-center gap-2"
            >
              <span>Prix</span>
              <span v-if="priceMin !== null || priceMax !== null" class="text-white font-semibold">
                ({{ priceMin !== null ? priceMin.toLocaleString() + ' €' : '0 €' }} - {{ priceMax !== null ? priceMax.toLocaleString() + ' €' : '∞' }})
              </span>
            </button>

            <div class="flex flex-wrap items-center gap-2">
              <span class="text-sm text-gray-600 font-medium">Public</span>
              <button
                v-for="opt in audienceOptions"
                :key="opt.id"
                type="button"
                @click="setAudienceFilter(opt.id)"
                :class="[
                  'px-3 py-2 rounded-lg border text-sm transition-colors',
                  selectedAudience === opt.id
                    ? 'border-primary bg-primary text-white'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-primary',
                ]"
              >
                {{ opt.label }}
              </button>
            </div>
          </div>

          <!-- Results Count and Actions -->
          <div class="flex items-center gap-4">
            <div class="text-sm text-gray-600 font-light">
              {{ filteredWatches.length }} montre{{
                filteredWatches.length > 1 ? 's' : ''
              }}
              disponible{{ filteredWatches.length > 1 ? 's' : '' }}
            </div>

            <!-- Sort Dropdown -->
            <div class="relative" ref="sortDropdownRef">
              <button
                @click.stop="toggleSortMenu"
                class="p-2 hover:bg-cream-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label="Trier les montres"
              >
                <svg 
                  class="w-5 h-5 text-gray-700"
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
              </button>

              <!-- Sort Menu Dropdown -->
              <div
                v-if="isSortMenuOpen"
                ref="sortMenuRef"
                class="absolute top-full right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-50 min-w-[180px]"
                @click.stop
              >
                <button
                  @click="selectSort('recent')"
                  :class="[
                    'w-full text-left px-4 py-2 hover:bg-cream transition-colors',
                    sortOrder === 'recent' ? 'bg-primary text-white hover:bg-primary-hover' : 'text-gray-700'
                  ]"
                >
                  Ajout récent
                </button>
                <button
                  @click="selectSort('price-asc')"
                  :class="[
                    'w-full text-left px-4 py-2 hover:bg-cream transition-colors',
                    sortOrder === 'price-asc' ? 'bg-primary text-white hover:bg-primary-hover' : 'text-gray-700'
                  ]"
                >
                  Prix croissant
                </button>
                <button
                  @click="selectSort('price-desc')"
                  :class="[
                    'w-full text-left px-4 py-2 hover:bg-cream transition-colors rounded-b-lg',
                    sortOrder === 'price-desc' ? 'bg-primary text-white hover:bg-primary-hover' : 'text-gray-700'
                  ]"
                >
                  Prix décroissant
                </button>
              </div>
            </div>

            <!-- Reset Filters Button -->
            <button
              v-if="hasActiveFilters"
              @click="resetAllFilters"
              class="p-2 rounded-lg hover:bg-cream focus:ring-2 focus:ring-primary focus:border-transparent transition-colors flex items-center gap-2 text-gray-700"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Réinitialiser</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Loading State with Skeletons -->
      <div v-if="isLoading" class="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 lg:gap-6 mb-8">
        <WatchCardSkeleton
          v-for="n in 8"
          :key="`skeleton-${n}`"
          :show-reference="true"
          :show-sold-badge="true"
          :show-price="true"
        />
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="text-center py-10">
        <div class="text-red-500 mb-3">
          <svg class="w-16 h-16 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 class="text-xl text-gray-900 mb-2">Erreur de chargement</h3>
        <p class="text-gray-600 mb-3">{{ error }}</p>
        <button
          @click="loadWatches"
          class="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
        >
          Réessayer
        </button>
      </div>

      <!-- Watches Grid -->
      <div v-else class="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 lg:gap-6 mb-8">
        <WatchCard
          v-for="watch in filteredWatches"
          :key="watch.id"
          :watch="watch"
          @viewDetails="handleViewDetails"
          class="animate-fade-in"
        />
      </div>

      <!-- Empty State -->
      <div v-if="!isLoading && !error && filteredWatches.length === 0" class="text-center py-10">
        <div class="text-gray-400 mb-3">
          <svg class="w-16 h-16 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1"
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 class="text-xl text-gray-600 mb-2">Aucune montre trouvée</h3>
        <p class="text-gray-500">Essayez de modifier vos critères de recherche</p>
      </div>

      <!-- Contact Section -->
      <div class="bg-white rounded-md shadow-lg p-8 text-center">
        <h2 class="text-2xl font-semibold text-text-main mb-4">Une pièce vous intéresse ?</h2>
        <p class="text-lg text-gray-600 mb-6 font-light">
          Contactez-nous pour plus d'informations ou pour organiser une visite en main propre
        </p>

        <div class="flex flex-col sm:flex-row justify-center gap-4">
          <a
            :href="'https://wa.me/' + WHATSAPP_NUMBER"
            target="_blank"
            class="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-primary hover:bg-primary-hover transition-colors duration-200"
          >
            <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path
                d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"
              />
            </svg>
            Contact WhatsApp
          </a>
          <a
            :href="'mailto:' + EMAIL_CONTACT"
            class="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-primary hover:bg-primary-hover transition-colors duration-200"
          >
            <svg class="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            Contact Email
          </a>
        </div>
      </div>
    </div>

    <!-- Price Filter Modal -->
    <Teleport to="body">
      <div
        v-if="isPriceModalOpen"
        class="modal-overlay fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 p-4"
        @click="closePriceModal"
        @keydown.esc="closePriceModal"
        tabindex="-1"
      >
        <div
          @click.stop
          class="modal-container bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          <!-- Header -->
          <div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
            <h2 class="text-2xl font-bold text-text-main">Prix</h2>
            <button
              @click="closePriceModal"
              class="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Fermer"
            >
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Content -->
          <div class="p-6">
            <!-- Quick Price Buttons -->
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 mb-3">Prix les plus recherchés</label>
              <div class="flex flex-wrap gap-3">
                <button
                  v-for="quickPrice in quickPriceRanges"
                  :key="quickPrice.id"
                  @click="applyQuickPrice(quickPrice)"
                  :class="[
                    'px-4 py-2 rounded-lg border transition-colors',
                    isQuickPriceSelected(quickPrice)
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-primary hover:text-primary'
                  ]"
                >
                  {{ quickPrice.label }}
                </button>
              </div>
            </div>

            <!-- Price Slider -->
            <div class="mt-12 mb-2 mx-4">
              <div class="mb-4">
                <Slider
                  v-model="tempPriceRange"
                  :min="priceMinLimit"
                  :max="priceMaxLimit"
                  :step="10"
                  :tooltips="true"
                  :format="{ suffix: ' €', decimals: 0, thousand: ' ' }"
                  class="w-full"
                />
              </div>
              <div class="flex justify-between text-xs text-gray-500">
                <span>{{ priceMinLimit.toLocaleString() }} €</span>
                <span>{{ priceMaxLimit.toLocaleString() }} €</span>
              </div>
            </div>

            <!-- Manual Input Fields -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Prix minimum</label>
                <div class="relative">
                  <input
                    v-model.number="tempPriceMinInput"
                    type="number"
                    :min="priceMinLimit"
                    :max="priceMaxLimit"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    @blur="updatePriceFromInput"
                  />
                  <span class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">€</span>
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Prix maximum</label>
                <div class="relative">
                  <input
                    v-model.number="tempPriceMaxInput"
                    type="number"
                    :min="priceMinLimit"
                    :max="priceMaxLimit"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    @blur="updatePriceFromInput"
                  />
                  <span class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">€</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="sticky bottom-0 border-t border-gray-200 px-6 py-4 flex items-center justify-between">
            <div class="text-sm text-gray-600">
              {{ getFilteredCountWithPrice() }} résultat{{ getFilteredCountWithPrice() > 1 ? 's' : '' }}
            </div>
            <div class="flex gap-3">
              <button
                @click="cancelPriceFilter"
                class="px-6 py-2 border border-gray-300 rounded-lg hover:bg-cream transition-colors font-medium text-gray-700"
              >
              Réinitialiser
              </button>
              <button
                @click="applyPriceFilter"
                class="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors font-medium"
              >
                Appliquer les filtres
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Brand Filter Modal -->
    <Teleport to="body">
      <div
        v-if="isBrandModalOpen"
        class="modal-overlay fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 p-4"
        @click="closeBrandModal"
        @keydown.esc="closeBrandModal"
        tabindex="-1"
      >
        <div
          @click.stop
          class="modal-container bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          <!-- Header -->
          <div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
            <h2 class="text-2xl font-bold text-text-main">Marque</h2>
            <button
              @click="closeBrandModal"
              class="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Fermer"
            >
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Content -->
          <div class="p-6">
            <!-- All Brands -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-3">Toutes les marques</label>
              <div class="flex flex-wrap gap-3 items-center">
                <button
                  v-for="brand in availableBrands"
                  :key="brand"
                  type="button"
                  @click="toggleBrand(brand)"
                  :class="[
                    'px-4 py-2 rounded-lg border transition-colors text-left min-w-[8rem]',
                    tempSelectedBrands.includes(brand)
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-primary hover:text-primary'
                  ]"
                >
                  {{ brand }}
                </button>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="sticky bottom-0  border-t border-gray-200 px-6 py-4 flex items-center justify-between">
            <div class="text-sm text-gray-600">
              {{ getFilteredCountWithBrand() }} résultat{{ getFilteredCountWithBrand() > 1 ? 's' : '' }}
            </div>
            <div class="flex gap-3">
              <button
                @click="cancelBrandFilter"
                class="px-6 py-2 border border-gray-300 rounded-lg hover:bg-cream transition-colors font-medium text-gray-700"
              >
                Réinitialiser
              </button>
              <button
                @click="submitBrandFilter"
                class="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors font-medium"
              >
                Appliquer les filtres
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </section>
</template>

<script setup>
import { ref, onMounted, onUnmounted, toRefs } from 'vue'
import { useRouter } from 'vue-router'
import { useHead } from '@vueuse/head'
import Slider from '@vueform/slider'
import '@vueform/slider/themes/default.css'

import WatchCard from './WatchCard.vue'
import WatchCardSkeleton from './WatchCardSkeleton.vue'
import { scrollAnimation } from '@/animation'
import { WHATSAPP_NUMBER, EMAIL_CONTACT, BASE_URL } from '@/config'
import { getSiteConfig } from '@/site/getSiteConfig.js'
import { useWatchListing } from '@/composables/useWatchListing.js'
import { slugifyBrand } from '@/utils/brandSlug.js'

const router = useRouter()

const brandSlug = ref(null)
const listing = useWatchListing({ brandSlug })
const {
  selectedBrands,
  selectedAudience,
  priceMin,
  priceMax,
  sortOrder,
  isPriceModalOpen,
  isBrandModalOpen,
  isSortMenuOpen,
  tempPriceRange,
  tempSelectedBrands,
  tempPriceMinInput,
  tempPriceMaxInput,
  isLoading,
  error,
  priceMinLimit,
  priceMaxLimit,
  quickPriceRanges,
  availableBrands,
  hasActiveFilters,
  filteredWatches,
} = toRefs(listing)

const {
  getFilteredCountWithPrice,
  getFilteredCountWithBrand,
  openPriceModal,
  closePriceModal,
  openBrandModal,
  closeBrandModal,
  toggleSortMenu,
  closeSortMenu,
  selectSort,
  applyQuickPrice,
  isQuickPriceSelected,
  updatePriceFromInput,
  cancelPriceFilter,
  applyPriceFilter,
  toggleBrand,
  cancelBrandFilter,
  resetAllFilters,
  loadWatches,
} = listing

const audienceOptions = [
  { id: 'all', label: 'Tous' },
  { id: 'homme', label: 'Homme' },
  { id: 'femme', label: 'Femme' },
  { id: 'enfant', label: 'Enfant' },
]

const setAudienceFilter = (id) => {
  selectedAudience.value = id
}

const seo = getSiteConfig().seo.collection

useHead({
  title: seo.title,
  meta: [
    {
      name: 'description',
      content: seo.metaDescription,
    },
    {
      property: 'og:title',
      content: seo.ogTitle,
    },
    {
      property: 'og:description',
      content: seo.ogDescription,
    },
    {
      property: 'og:url',
      content: `${BASE_URL}/collection`,
    },
    {
      property: 'og:type',
      content: 'website',
    },
    {
      name: 'twitter:card',
      content: 'summary',
    },
    {
      name: 'twitter:title',
      content: seo.twitterTitle,
    },
    {
      name: 'twitter:description',
      content: seo.twitterDescription,
    },
  ],
  link: [
    {
      rel: 'canonical',
      href: `${BASE_URL}/collection`,
    },
  ],
})

const sortDropdownRef = ref(null)
const sortMenuRef = ref(null)

const handleClickOutsideSortMenu = (event) => {
  if (sortDropdownRef.value && !sortDropdownRef.value.contains(event.target)) {
    closeSortMenu()
  }
}

const handleViewDetails = (watchId) => {
  router.push(`/watch/${watchId}`)
}

/** Une seule marque → page dédiée ; plusieurs ou aucune → filtre sur la collection. */
const submitBrandFilter = () => {
  if (tempSelectedBrands.value.length === 1) {
    const brand = tempSelectedBrands.value[0]
    selectedBrands.value = []
    tempSelectedBrands.value = []
    closeBrandModal()
    router.push(`/collection/marque/${slugifyBrand(brand)}`)
    return
  }
  listing.applyBrandFilter()
}

onMounted(async () => {
  await loadWatches()
  scrollAnimation()
  document.addEventListener('click', handleClickOutsideSortMenu)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutsideSortMenu)
})
</script>

<style scoped>
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes modal-fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes modal-slide-up {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.animate-fade-in {
  animation: fade-in 0.6s ease-out;
}


.modal-overlay {
  animation: modal-fade-in 0.2s ease-out;
}

.modal-container {
  animation: modal-slide-up 0.3s ease-out;
}

/* Custom slider styles */
:deep(.slider-connect) {
  background: #0f2a1d;
}

:deep(.slider-handle) {
  background: #0f2a1d;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

:deep(.slider-handle:hover) {
  background: #163d2a;
}

:deep(.slider-tooltip) {
  background: #0f2a1d;
  border: none;
  color: white;
}

:deep(.slider-tooltip::before) {
  border-top-color: #0f2a1d;
}
</style>

<template>
  <section
    class="min-h-screen"
    :class="
      hasBrandHero ? 'pt-0 pb-3 lg:pb-10' : 'py-3 lg:py-10'
    "
  >
    <!-- Hero bord à bord sous le menu (pas de py haut sur cette page si image) -->
    <div
      v-if="listing.resolvedFixedBrand && heroConfig?.image"
      class="relative w-full mb-6 lg:mb-10"
    >
      <div
        class="relative w-full overflow-hidden bg-cream aspect-[21/9] min-h-[12rem] max-h-[min(20rem,33.333vw)] shadow-lg"
      >
        <img
          :src="heroConfig.image"
          :alt="heroConfig.alt || resolvedTitle"
          class="absolute inset-0 w-full h-full object-cover"
        />
        <div class="absolute inset-0 bg-black/35 flex items-center justify-center px-4">
          <h1 class="text-2xl md:text-4xl font-bold text-white text-center drop-shadow-md">
            {{ resolvedTitle }}
          </h1>
        </div>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4">
      <div
        v-if="listing.resolvedFixedBrand && !heroConfig?.image"
        class="text-center mb-3 lg:mb-8"
      >
        <h1 class="text-2xl font-bold text-text-main">{{ resolvedTitle }}</h1>
      </div>

      <!-- Marque introuvable (slug invalide) -->
      <div
        v-if="!listing.isLoading && !listing.error && unknownBrand"
        class="text-center py-16"
      >
        <h2 class="text-xl font-semibold text-text-main mb-3">Marque introuvable</h2>
        <p class="text-gray-600 mb-6">Cette marque ne correspond à aucune montre en stock.</p>
        <RouterLink
          to="/collection"
          class="inline-flex px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
        >
          Voir toute la collection
        </RouterLink>
      </div>

      <template v-else>
        <!-- Filtres -->
        <div class="bg-white rounded-md shadow-lg p-6 mb-3 lg:mb-8">
          <div class="flex flex-wrap items-center justify-between gap-4">
            <div class="flex flex-wrap gap-4">
              <button
                type="button"
                @click="listing.openPriceModal"
                class="px-4 py-2 border border-primary text-white bg-primary rounded-lg hover:bg-primary-hover focus:ring-2 focus:ring-primary focus:border-transparent transition-colors flex items-center gap-2"
              >
                <span>Prix</span>
                <span
                  v-if="listing.priceMin !== null || listing.priceMax !== null"
                  class="text-white font-semibold"
                >
                  ({{
                    listing.priceMin !== null ? listing.priceMin.toLocaleString() + ' €' : '0 €'
                  }}
                  -
                  {{
                    listing.priceMax !== null ? listing.priceMax.toLocaleString() + ' €' : '∞'
                  }})
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
                    listing.selectedAudience === opt.id
                      ? 'border-primary bg-primary text-white'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-primary',
                  ]"
                >
                  {{ opt.label }}
                </button>
              </div>
            </div>

            <div class="flex items-center gap-4">
              <RouterLink
                to="/collection"
                class="text-sm text-primary hover:underline font-medium"
              >
                Toute la collection
              </RouterLink>
              <div class="text-sm text-gray-600 font-light">
                {{ listing.filteredWatches.length }} montre{{
                  listing.filteredWatches.length > 1 ? 's' : ''
                }}
                disponible{{ listing.filteredWatches.length > 1 ? 's' : '' }}
              </div>

              <div class="relative" ref="sortDropdownRef">
                <button
                  type="button"
                  @click.stop="listing.toggleSortMenu"
                  class="p-2 hover:bg-cream-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                  aria-label="Trier les montres"
                >
                  <svg
                    class="w-5 h-5 text-gray-700"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                    />
                  </svg>
                </button>

                <div
                  v-if="listing.isSortMenuOpen"
                  ref="sortMenuRef"
                  class="absolute top-full right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-50 min-w-[180px]"
                  @click.stop
                >
                  <button
                    type="button"
                    @click="listing.selectSort('recent')"
                    :class="[
                      'w-full text-left px-4 py-2 hover:bg-cream transition-colors',
                      listing.sortOrder === 'recent'
                        ? 'bg-primary text-white hover:bg-primary-hover'
                        : 'text-gray-700',
                    ]"
                  >
                    Ajout récent
                  </button>
                  <button
                    type="button"
                    @click="listing.selectSort('price-asc')"
                    :class="[
                      'w-full text-left px-4 py-2 hover:bg-cream transition-colors',
                      listing.sortOrder === 'price-asc'
                        ? 'bg-primary text-white hover:bg-primary-hover'
                        : 'text-gray-700',
                    ]"
                  >
                    Prix croissant
                  </button>
                  <button
                    type="button"
                    @click="listing.selectSort('price-desc')"
                    :class="[
                      'w-full text-left px-4 py-2 hover:bg-cream transition-colors rounded-b-lg',
                      listing.sortOrder === 'price-desc'
                        ? 'bg-primary text-white hover:bg-primary-hover'
                        : 'text-gray-700',
                    ]"
                  >
                    Prix décroissant
                  </button>
                </div>
              </div>

              <button
                v-if="listing.hasActiveFilters"
                type="button"
                @click="listing.resetAllFilters"
                class="p-2 rounded-lg hover:bg-cream focus:ring-2 focus:ring-primary focus:border-transparent transition-colors flex items-center gap-2 text-gray-700"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                <span>Réinitialiser</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Loading -->
        <div
          v-if="listing.isLoading"
          class="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 lg:gap-6 mb-8"
        >
          <WatchCardSkeleton
            v-for="n in 8"
            :key="`skeleton-${n}`"
            :show-reference="true"
            :show-sold-badge="true"
            :show-price="true"
          />
        </div>

        <!-- Error -->
        <div v-else-if="listing.error" class="text-center py-10">
          <h3 class="text-xl text-gray-900 mb-2">Erreur de chargement</h3>
          <p class="text-gray-600 mb-3">{{ listing.error }}</p>
          <button
            type="button"
            @click="listing.loadWatches"
            class="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
          >
            Réessayer
          </button>
        </div>

        <!-- Grid -->
        <div
          v-else
          class="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 lg:gap-6 mb-8"
        >
          <WatchCard
            v-for="watch in listing.filteredWatches"
            :key="watch.id"
            :watch="watch"
            @viewDetails="handleViewDetails"
            class="animate-fade-in"
          />
        </div>

        <!-- Empty -->
        <div
          v-if="
            !listing.isLoading &&
            !listing.error &&
            !unknownBrand &&
            listing.filteredWatches.length === 0
          "
          class="text-center py-10"
        >
          <h3 class="text-xl text-gray-600 mb-2">Aucune montre trouvée</h3>
          <p class="text-gray-500">Essayez de modifier vos critères de recherche</p>
        </div>

        <!-- Contact -->
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
              Contact WhatsApp
            </a>
            <a
              :href="'mailto:' + EMAIL_CONTACT"
              class="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-primary hover:bg-primary-hover transition-colors duration-200"
            >
              Contact Email
            </a>
          </div>
        </div>
      </template>
    </div>

    <!-- Modal prix (identique collection) -->
    <Teleport to="body">
      <div
        v-if="listing.isPriceModalOpen"
        class="modal-overlay fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 p-4"
        @click="listing.closePriceModal"
        tabindex="-1"
      >
        <div
          @click.stop
          class="modal-container bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          <div
            class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10"
          >
            <h2 class="text-2xl font-bold text-text-main">Prix</h2>
            <button
              type="button"
              @click="listing.closePriceModal"
              class="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Fermer"
            >
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div class="p-6">
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 mb-3">Prix les plus recherchés</label>
              <div class="flex flex-wrap gap-3">
                <button
                  v-for="quickPrice in listing.quickPriceRanges"
                  :key="quickPrice.id"
                  type="button"
                  @click="listing.applyQuickPrice(quickPrice)"
                  :class="[
                    'px-4 py-2 rounded-lg border transition-colors',
                    listing.isQuickPriceSelected(quickPrice)
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-primary hover:text-primary',
                  ]"
                >
                  {{ quickPrice.label }}
                </button>
              </div>
            </div>

            <div class="mt-12 mb-2 mx-4">
              <div class="mb-4">
                <Slider
                  v-model="tempPriceRangeModel"
                  :min="listing.priceMinLimit"
                  :max="listing.priceMaxLimit"
                  :step="10"
                  :tooltips="true"
                  :format="{ suffix: ' €', decimals: 0, thousand: ' ' }"
                  class="w-full"
                />
              </div>
              <div class="flex justify-between text-xs text-gray-500">
                <span>{{ listing.priceMinLimit.toLocaleString() }} €</span>
                <span>{{ listing.priceMaxLimit.toLocaleString() }} €</span>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Prix minimum</label>
                <div class="relative">
                  <input
                    v-model.number="listing.tempPriceMinInput"
                    type="number"
                    :min="listing.priceMinLimit"
                    :max="listing.priceMaxLimit"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    @blur="listing.updatePriceFromInput"
                  />
                  <span class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">€</span>
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Prix maximum</label>
                <div class="relative">
                  <input
                    v-model.number="listing.tempPriceMaxInput"
                    type="number"
                    :min="listing.priceMinLimit"
                    :max="listing.priceMaxLimit"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    @blur="listing.updatePriceFromInput"
                  />
                  <span class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">€</span>
                </div>
              </div>
            </div>
          </div>

          <div
            class="sticky bottom-0 border-t border-gray-200 px-6 py-4 flex items-center justify-between"
          >
            <div class="text-sm text-gray-600">
              {{ listing.getFilteredCountWithPrice() }} résultat{{
                listing.getFilteredCountWithPrice() > 1 ? 's' : ''
              }}
            </div>
            <div class="flex gap-3">
              <button
                type="button"
                @click="listing.cancelPriceFilter"
                class="px-6 py-2 border border-gray-300 rounded-lg hover:bg-cream transition-colors font-medium text-gray-700"
              >
                Réinitialiser
              </button>
              <button
                type="button"
                @click="listing.applyPriceFilter"
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
import { computed, ref, watch, onMounted, onUnmounted, toRef } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useHead } from '@vueuse/head'
import Slider from '@vueform/slider'
import '@vueform/slider/themes/default.css'

import WatchCard from './WatchCard.vue'
import WatchCardSkeleton from './WatchCardSkeleton.vue'
import { scrollAnimation } from '@/animation'
import { WHATSAPP_NUMBER, EMAIL_CONTACT, BASE_URL } from '@/config'
import { getSiteConfig } from '@/site/getSiteConfig.js'
import { useWatchListing } from '@/composables/useWatchListing.js'

const route = useRoute()
const router = useRouter()

const brandSlug = computed(() => {
  const p = route.params.brandSlug
  const raw = Array.isArray(p) ? p[0] : p
  return raw ? String(raw) : ''
})

const listing = useWatchListing({ brandSlug })

const siteConfig = getSiteConfig()
const audienceOptions = [
  { id: 'all', label: 'Tous' },
  { id: 'homme', label: 'Homme' },
  { id: 'femme', label: 'Femme' },
  { id: 'enfant', label: 'Enfant' },
]

const resolvedTitle = computed(() => listing.resolvedFixedBrand || 'Marque')

const heroConfig = computed(() => {
  const name = listing.resolvedFixedBrand
  if (!name || !siteConfig.brandHero) return null
  return siteConfig.brandHero[name] || null
})

/** Hero présent : pas de padding haut sur la section pour coller le bandeau au menu. */
const hasBrandHero = computed(
  () => Boolean(listing.resolvedFixedBrand && heroConfig.value?.image),
)

const unknownBrand = computed(() => {
  if (listing.isLoading || listing.error || !brandSlug.value) return false
  if (!listing.watches.length) return false
  return !listing.resolvedFixedBrand
})

function fillBrand(template, brand) {
  if (!template) return ''
  return template.replace(/\{brand\}/g, brand || '')
}

const seoBrand = computed(() => siteConfig.seo?.brandCollection || {})

watch(
  () => [listing.resolvedFixedBrand, brandSlug.value],
  () => {
    const brand = listing.resolvedFixedBrand
    const slug = brandSlug.value
    const baseUrl = `${BASE_URL}/collection/marque/${slug}`
    const title = brand
      ? fillBrand(seoBrand.value.title || '{brand} | Collection', brand)
      : seoBrand.value.titleFallback || 'Collection par marque'
    const desc = brand
      ? fillBrand(
          seoBrand.value.metaDescription ||
            'Montres {brand} disponibles. Filtrez par public et budget.',
          brand,
        )
      : seoBrand.value.metaDescriptionFallback || ''

    useHead({
      title,
      meta: [
        { name: 'description', content: desc },
        { property: 'og:title', content: title },
        { property: 'og:description', content: desc },
        { property: 'og:url', content: baseUrl },
        { property: 'og:type', content: 'website' },
        { name: 'twitter:card', content: 'summary' },
        { name: 'twitter:title', content: title },
        { name: 'twitter:description', content: desc },
      ],
      link: [{ rel: 'canonical', href: baseUrl }],
    })
  },
  { immediate: true },
)

const selectedAudienceRef = toRef(listing, 'selectedAudience')
const tempPriceRangeModel = toRef(listing, 'tempPriceRange')
const setAudienceFilter = (id) => {
  selectedAudienceRef.value = id
}

const sortDropdownRef = ref(null)

const handleClickOutsideSortMenu = (event) => {
  if (sortDropdownRef.value && !sortDropdownRef.value.contains(event.target)) {
    listing.closeSortMenu()
  }
}

const handleViewDetails = (watchId) => {
  router.push(`/watch/${watchId}`)
}

onMounted(async () => {
  await listing.loadWatches()
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

.animate-fade-in {
  animation: fade-in 0.6s ease-out;
}

.modal-overlay {
  animation: modal-fade-in 0.2s ease-out;
}

.modal-container {
  animation: modal-slide-up 0.3s ease-out;
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

:deep(.slider-connect) {
  background: #0f2a1d;
}

:deep(.slider-handle) {
  background: #0f2a1d;
  border: 2px solid white;
}
</style>

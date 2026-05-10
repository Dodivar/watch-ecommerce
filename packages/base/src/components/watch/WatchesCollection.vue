<template>
  <section
    class="min-h-screen"
    :class="
      effectiveBrandHero ? 'pt-0 pb-3 lg:pb-10' : 'py-3 lg:py-10'
    "
  >
    <!-- Hero marque : route /collection/marque/:slug ou une seule marque sélectionnée sur /collection -->
    <div
      v-if="effectiveBrandHero"
      class="relative w-full mb-6 lg:mb-10"
    >
      <div
        class="relative w-full overflow-hidden bg-cream aspect-[21/9] h-[20rem] shadow-lg"
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
      <!-- Titre : collection complète, ou nom de la marque unique (filtre / URL) sans image hero -->
      <div
        v-if="!effectiveBrandHero"
        class="text-center mb-3 lg:mb-8"
      >
        <h1 class="text-2xl font-bold text-text-main">
          {{ pageHeadingTitle }}
        </h1>
      </div>

      <!-- Marque introuvable -->
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
        <!-- Barre : filtres + tri -->
        <div
          v-if="showFilters || showSort || isBrandRoute || singleBrandLabel"
          class="bg-white rounded-md shadow-lg p-4 mb-3 lg:mb-8"
        >
          <div class="flex flex-wrap items-center justify-between gap-4">
            <div class="flex flex-wrap items-center gap-3">
              <button
                v-if="showFilters"
                type="button"
                class="inline-flex items-center gap-2 rounded-lg border border-primary bg-primary px-4 py-2.5 text-white transition-colors hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                @click="listing.openFilterDrawer"
              >
                <svg class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                  />
                </svg>
                <span class="text-sm font-semibold uppercase tracking-wide">Filtrer</span>
                <span
                  v-if="listing.activeFilterCount > 0"
                  class="inline-flex min-h-[1.25rem] min-w-[1.25rem] items-center justify-center rounded-full bg-white px-1.5 text-xs font-bold text-text-main"
                >
                  {{ listing.activeFilterCount }}
                </span>
              </button>
              <RouterLink
                v-if="isBrandRoute || singleBrandLabel"
                to="/collection"
                class="text-sm text-primary hover:underline font-medium"
              >
                Toute la collection
              </RouterLink>
            </div>

            <div class="flex items-center gap-4">
              <div class="text-sm text-gray-600 font-light">
                {{ listing.filteredWatches.length }} montre{{
                  listing.filteredWatches.length > 1 ? 's' : ''
                }}
                disponible{{ listing.filteredWatches.length > 1 ? 's' : '' }}
              </div>

              <div
                v-if="showSort"
                class="relative"
                ref="sortDropdownRef"
              >
                <button
                  type="button"
                  class="p-2 hover:bg-cream-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                  aria-label="Trier les montres"
                  @click.stop="listing.toggleSortMenu"
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
                    class="w-full text-left px-4 py-2 hover:bg-cream transition-colors"
                    :class="
                      listing.sortOrder === 'recent'
                        ? 'bg-primary text-white hover:bg-primary-hover'
                        : 'text-gray-700'
                    "
                    @click="listing.selectSort('recent')"
                  >
                    Ajout récent
                  </button>
                  <button
                    type="button"
                    class="w-full text-left px-4 py-2 hover:bg-cream transition-colors"
                    :class="
                      listing.sortOrder === 'price-asc'
                        ? 'bg-primary text-white hover:bg-primary-hover'
                        : 'text-gray-700'
                    "
                    @click="listing.selectSort('price-asc')"
                  >
                    Prix croissant
                  </button>
                  <button
                    type="button"
                    class="w-full text-left px-4 py-2 hover:bg-cream transition-colors rounded-b-lg"
                    :class="
                      listing.sortOrder === 'price-desc'
                        ? 'bg-primary text-white hover:bg-primary-hover'
                        : 'text-gray-700'
                    "
                    @click="listing.selectSort('price-desc')"
                  >
                    Prix décroissant
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Skeleton -->
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

        <!-- Erreur -->
        <div v-else-if="listing.error" class="text-center py-10">
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
          <p class="text-gray-600 mb-3">{{ listing.error }}</p>
          <button
            type="button"
            class="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
            @click="listing.loadWatches"
          >
            Réessayer
          </button>
        </div>

        <!-- Grille -->
        <div
          v-else
          class="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 lg:gap-6 mb-8"
        >
          <WatchCard
            v-for="watch in listing.filteredWatches"
            :key="watch.id"
            :watch="watch"
            class="animate-fade-in"
            @viewDetails="handleViewDetails"
          />
        </div>

        <!-- Vide -->
        <div
          v-if="
            !listing.isLoading &&
            !listing.error &&
            !unknownBrand &&
            listing.filteredWatches.length === 0
          "
          class="text-center py-10"
        >
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

        <!-- Contact -->
        <div
          v-if="showContactSection"
          class="bg-white rounded-md shadow-lg p-8 text-center"
        >
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
      </template>
    </div>

    <WatchCollectionFiltersDrawer
      v-if="showFilters"
      :open="listing.isFilterDrawerOpen"
      :listing="listing"
      :sections="filterSections"
      @close="listing.closeFilterDrawer"
    />
  </section>
</template>

<script setup>
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useHead } from '@vueuse/head'

import WatchCard from './WatchCard.vue'
import WatchCardSkeleton from './WatchCardSkeleton.vue'
import WatchCollectionFiltersDrawer from './WatchCollectionFiltersDrawer.vue'
import { scrollAnimation } from '@/animation'
import { WHATSAPP_NUMBER, EMAIL_CONTACT, BASE_URL } from '@/config'
import { getSiteConfig } from '@/site/getSiteConfig.js'
import { getMergedCollectionFilters } from '@/site/collectionFilters.js'
import { useWatchListing } from '@/composables/useWatchListing.js'

const props = defineProps({
  showFilters: { type: Boolean, default: true },
  showSort: { type: Boolean, default: true },
  showContactSection: { type: Boolean, default: true },
  showBrandHero: { type: Boolean, default: true },
})

const route = useRoute()
const router = useRouter()

const brandSlug = computed(() => {
  const p = route.params.brandSlug
  const raw = Array.isArray(p) ? p[0] : p
  return raw ? String(raw) : ''
})

const isBrandRoute = computed(() => Boolean(brandSlug.value))

const listing = useWatchListing({ brandSlug })

const siteConfig = getSiteConfig()

const filterSections = computed(() => {
  const cfg = getMergedCollectionFilters(siteConfig)
  return {
    price: cfg.price,
    brand: cfg.brand,
    audience: cfg.audience,
  }
})

/** Marque unique affichée : URL /collection/marque/:slug ou exactement une marque cochée sur /collection */
const singleBrandLabel = computed(() => {
  if (listing.resolvedFixedBrand) return listing.resolvedFixedBrand
  const brands = listing.selectedBrands
  if (Array.isArray(brands) && brands.length === 1) return brands[0]
  return null
})

const resolvedTitle = computed(() => singleBrandLabel.value || 'Marque')

const pageHeadingTitle = computed(() =>
  singleBrandLabel.value ? singleBrandLabel.value : 'Notre collection de montres',
)

const heroConfig = computed(() => {
  const name = singleBrandLabel.value
  if (!name || !siteConfig.brandHero) return null
  return siteConfig.brandHero[name] || null
})

const effectiveBrandHero = computed(
  () =>
    props.showBrandHero &&
    Boolean(singleBrandLabel.value && heroConfig.value?.image),
)

const unknownBrand = computed(() => {
  if (listing.isLoading || listing.error || !brandSlug.value) return false
  if (!listing.watches.length) return false
  return !listing.resolvedFixedBrand
})

const seoCollection = getSiteConfig().seo.collection

function fillBrand(template, brand) {
  if (!template) return ''
  return template.replace(/\{brand\}/g, brand || '')
}

const seoBrand = computed(() => siteConfig.seo?.brandCollection || {})

watch(
  () => [brandSlug.value, listing.resolvedFixedBrand],
  () => {
    if (!brandSlug.value) {
      useHead({
        title: seoCollection.title,
        meta: [
          { name: 'description', content: seoCollection.metaDescription },
          { property: 'og:title', content: seoCollection.ogTitle },
          { property: 'og:description', content: seoCollection.ogDescription },
          { property: 'og:url', content: `${BASE_URL}/collection` },
          { property: 'og:type', content: 'website' },
          { name: 'twitter:card', content: 'summary' },
          { name: 'twitter:title', content: seoCollection.twitterTitle },
          { name: 'twitter:description', content: seoCollection.twitterDescription },
        ],
        link: [{ rel: 'canonical', href: `${BASE_URL}/collection` }],
      })
      return
    }

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
</style>

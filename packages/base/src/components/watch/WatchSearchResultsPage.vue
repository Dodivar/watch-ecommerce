<template>
  <section class="py-3 lg:py-10 min-h-screen">
    <div class="max-w-7xl mx-auto px-4">
      <div class="mb-6 lg:mb-8">
        <HeaderQuickSearch
          variant="page"
          :initial-query="searchQuery || ''"
        />
      </div>

      <div v-if="searchQuery" class="text-center mb-6 lg:mb-8">
        <h1 class="text-2xl font-bold text-text-main mb-2">
          Résultats pour « {{ searchQuery }} »
        </h1>
        <p
          v-if="listingReady && !listing.isLoading && !listing.error"
          class="text-muted"
          aria-live="polite"
        >
          {{ totalFiltered }} montre{{ totalFiltered > 1 ? 's' : '' }} trouvée{{ totalFiltered > 1 ? 's' : '' }}
        </p>
      </div>

      <div
        v-if="listing.isLoading"
        class="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 lg:gap-6 mb-8"
      >
        <WatchCardSkeleton
          v-for="n in skeletonCardCount"
          :key="`skeleton-${n}`"
          :show-reference="true"
          :show-sold-badge="true"
          :show-price="true"
        />
      </div>

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
        <h2 class="text-xl text-text-main mb-2">Erreur de chargement</h2>
        <p class="text-muted mb-3">{{ listing.error }}</p>
        <button
          type="button"
          class="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
          @click="listing.loadWatches"
        >
          Réessayer
        </button>
      </div>

      <div
        v-else-if="searchQuery && totalFiltered === 0"
        class="text-center py-10"
      >
        <div class="text-subtle mb-3">
          <svg class="w-16 h-16 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <h2 class="text-xl text-text-main mb-2">Aucune montre trouvée</h2>
        <p class="text-muted mb-6">
          Aucun résultat pour « {{ searchQuery }} ». Essayez un autre terme (marque, modèle ou référence).
        </p>
        <div class="flex flex-col sm:flex-row gap-3 justify-center">
          <RouterLink
            to="/collection"
            class="inline-block px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
          >
            Voir toute la collection
          </RouterLink>
          <RouterLink
            v-if="features.recherche"
            to="/recherche"
            class="inline-block px-6 py-2 border border-border-strong text-text-main rounded-lg hover:bg-cream-100 transition-colors"
          >
            Recherche personnalisée
          </RouterLink>
        </div>
      </div>

      <template v-else-if="searchQuery && totalFiltered > 0">
        <div
          class="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 lg:gap-6 mb-8"
        >
          <WatchCard
            v-for="(watch, index) in paginatedWatches"
            :key="watch.id"
            v-bind="WATCH_CARD_GRID_PROPS"
            :watch="watch"
            :show-new-badge="isNouvelle(watch.id)"
            :image-loading="index < 4 ? 'eager' : 'lazy'"
            :image-fetch-priority="index === 0 ? 'high' : 'auto'"
            class="animate-fade-in"
            @viewDetails="handleViewDetails"
          />
        </div>

        <div
          v-if="listingReady && totalPages > 1"
          class="mb-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center sm:gap-8"
        >
          <p class="order-2 text-center text-sm text-subtle sm:order-1 sm:text-center">
            {{ totalFiltered }} montre{{ totalFiltered > 1 ? 's' : '' }}
          </p>
          <nav
            class="order-1 flex w-full max-w-full justify-center overflow-x-auto overflow-y-hidden py-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:order-2 sm:overflow-visible sm:py-0 [&::-webkit-scrollbar]:hidden"
            aria-label="Pagination des résultats de recherche"
          >
            <div class="flex max-w-full shrink-0 items-center gap-0 sm:gap-1.5">
              <button
                type="button"
                class="inline-flex h-11 w-11 shrink-0 touch-manipulation items-center justify-center rounded-lg border border-border-strong bg-white p-0 text-text-main/85 transition-colors hover:bg-cream-100 sm:h-10 sm:w-10"
                :class="currentPage === 1 ? 'cursor-not-allowed bg-cream-200 text-gray-400' : ''"
                :disabled="currentPage === 1"
                aria-label="Page précédente"
                @click="goToPage(currentPage - 1)"
              >
                <svg
                  class="h-5 w-5 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15.75 19.5l-7.5-7.5 7.5-7.5"
                  />
                </svg>
              </button>
              <ul
                class="m-0 flex shrink-0 list-none flex-wrap items-center justify-center gap-0 p-0 sm:gap-1"
                aria-label="Sélection de page"
              >
                <li
                  v-for="(item, itemIdx) in paginationItems"
                  :key="`page-${itemIdx}-${item.type === 'page' ? item.n : 'ellipsis'}`"
                  class="m-0 flex h-11 w-11 items-center justify-center p-0 sm:h-10 sm:w-10"
                >
                  <span
                    v-if="item.type === 'ellipsis'"
                    class="box-border inline-flex h-11 w-11 shrink-0 items-center justify-center text-sm font-medium text-subtle sm:h-10 sm:w-10"
                    aria-hidden="true"
                  >
                    …
                  </span>
                  <span
                    v-else-if="item.type === 'page' && item.n === currentPage"
                    class="box-border inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-primary bg-primary text-sm font-semibold text-white sm:h-10 sm:w-10"
                    aria-current="page"
                  >
                    {{ item.n }}
                  </span>
                  <button
                    v-else-if="item.type === 'page'"
                    type="button"
                    class="box-border inline-flex h-11 w-11 shrink-0 touch-manipulation items-center justify-center rounded-lg border border-border-strong bg-white text-sm font-medium text-text-main/85 transition-colors hover:bg-cream-100 sm:h-10 sm:w-10"
                    :aria-label="`Page ${item.n}`"
                    @click="goToPage(item.n)"
                  >
                    {{ item.n }}
                  </button>
                </li>
              </ul>
              <button
                type="button"
                class="inline-flex h-11 w-11 shrink-0 touch-manipulation items-center justify-center rounded-lg border border-border-strong bg-white p-0 text-text-main/85 transition-colors hover:bg-cream-100 sm:h-10 sm:w-10"
                :class="
                  currentPage === totalPages
                    ? 'cursor-not-allowed bg-cream-200 text-gray-400'
                    : ''
                "
                :disabled="currentPage === totalPages"
                aria-label="Page suivante"
                @click="goToPage(currentPage + 1)"
              >
                <svg
                  class="h-5 w-5 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M8.25 4.5l7.5 7.5-7.5 7.5"
                  />
                </svg>
              </button>
            </div>
          </nav>
        </div>
      </template>
    </div>
  </section>
</template>

<script setup>
import { computed, ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useHead } from '@vueuse/head'

import HeaderQuickSearch from '@/components/layout/HeaderQuickSearch.vue'
import WatchCard from './WatchCard.vue'
import WatchCardSkeleton from './WatchCardSkeleton.vue'
import { WATCH_CARD_GRID_PROPS } from '@/constants/watchCardDefaults.js'
import { scrollAnimation } from '@/animation'
import { BASE_URL } from '@/config'
import { getSiteConfig } from '@/site/getSiteConfig.js'
import { getResolvedCollectionPageSize } from '@/site/collectionFilters.js'
import { useWatchListing } from '@/composables/useWatchListing.js'
import { useNouvellesWatchIds } from '@/composables/useNouvellesWatchIds.js'
import { parseSearchQuery, watchMatchesSearchQuery } from '@/utils/watchSearch.js'
import {
  COLLECTION_PAGINATION_MOBILE_MQ,
  buildCollectionPaginationItems,
} from '@/utils/collectionPagination.js'
import { compareWatchesByRecent } from '@/utils/watchSort.js'
import { navigateToWatch } from '@/utils/watchSlug.js'

defineOptions({ name: 'WatchSearchResultsPage' })

const route = useRoute()
const router = useRouter()
const siteConfig = getSiteConfig()
const features = siteConfig.features
const listing = useWatchListing()
const { isNouvelle } = useNouvellesWatchIds()

const collectionPageSize = getResolvedCollectionPageSize(siteConfig)
const currentPage = ref(1)
const listingReady = ref(false)

const isPaginationCompact = ref(false)
let paginationMq = null

const searchQuery = computed(() => parseSearchQuery(route.query.q))

// Catalogue complet (pas filteredWatches) : la recherche ignore les facettes collection.
const searchResults = computed(() => {
  const q = searchQuery.value
  if (!q) return []
  return listing.watches.filter((w) => watchMatchesSearchQuery(w, q))
})

const sortedResults = computed(() => {
  return [...searchResults.value].sort(compareWatchesByRecent)
})

const totalFiltered = computed(() => sortedResults.value.length)

const totalPages = computed(() =>
  Math.max(1, Math.ceil(totalFiltered.value / collectionPageSize)),
)

const paginatedWatches = computed(() => {
  const start = (currentPage.value - 1) * collectionPageSize
  return sortedResults.value.slice(start, start + collectionPageSize)
})

const skeletonCardCount = computed(() => Math.min(collectionPageSize, 12))

const paginationItems = computed(() =>
  buildCollectionPaginationItems(
    currentPage.value,
    totalPages.value,
    isPaginationCompact.value,
  ),
)

function buildSearchQueryFromPage(page) {
  const q = searchQuery.value
  if (!q) return {}
  const next = { q }
  if (page > 1) next.page = String(page)
  return next
}

function updatePageQuery(page) {
  router.replace({ path: '/collection/recherche', query: buildSearchQueryFromPage(page) })
}

function syncPageFromRoute() {
  const raw = route.query.page
  const parsed = parseInt(Array.isArray(raw) ? raw[0] : raw, 10)
  const p = Number.isFinite(parsed) && parsed >= 1 ? parsed : 1
  const tp = totalPages.value
  const clamped = Math.min(Math.max(1, p), tp)
  currentPage.value = clamped
  if (clamped !== p) updatePageQuery(clamped)
}

function goToPage(page) {
  const tp = totalPages.value
  const p = Math.min(Math.max(1, page), tp)
  currentPage.value = p
  updatePageQuery(p)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function handleViewDetails(watch) {
  navigateToWatch(router, watch)
}

function syncPaginationViewport() {
  isPaginationCompact.value = window.matchMedia(COLLECTION_PAGINATION_MOBILE_MQ).matches
}

// Redirect immédiat si q invalide ; onMounted empêche aussi loadWatches dans ce cas.
watch(
  () => route.query.q,
  (q) => {
    if (!parseSearchQuery(q)) {
      router.replace('/collection')
      return
    }
    currentPage.value = 1
  },
  { immediate: true },
)

watch(
  () => route.query.page,
  () => {
    if (!listingReady.value) return
    const before = currentPage.value
    syncPageFromRoute()
    if (currentPage.value !== before) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  },
)

watch(totalPages, (tp) => {
  if (!listingReady.value) return
  if (currentPage.value > tp) {
    currentPage.value = Math.max(1, tp)
    updatePageQuery(currentPage.value)
  }
})

watch(searchQuery, (next, prev) => {
  if (!listingReady.value || prev === undefined) return
  if (next !== prev && currentPage.value !== 1) {
    currentPage.value = 1
    updatePageQuery(1)
  }
})

const searchHead = computed(() => {
  const q = searchQuery.value
  if (!q) return {}

  const siteName = siteConfig.brand?.displayName || siteConfig.brand?.legalName || 'Montres'
  const title = `Résultats : ${q} | ${siteName}`

  return {
    title,
    meta: [
      { name: 'robots', content: 'noindex, follow' },
      { name: 'description', content: `Résultats de recherche pour ${q}` },
      { property: 'og:title', content: title },
      { property: 'og:url', content: `${BASE_URL}/collection/recherche?q=${encodeURIComponent(q)}` },
    ],
    link: [
      {
        rel: 'canonical',
        href: `${BASE_URL}/collection/recherche?q=${encodeURIComponent(q)}`,
      },
    ],
  }
})

useHead(searchHead)

onMounted(async () => {
  paginationMq = window.matchMedia(COLLECTION_PAGINATION_MOBILE_MQ)
  syncPaginationViewport()
  paginationMq.addEventListener('change', syncPaginationViewport)

  if (!searchQuery.value) {
    router.replace('/collection')
    return
  }

  await listing.loadWatches()
  await nextTick()
  listingReady.value = true
  syncPageFromRoute()
  scrollAnimation()
})

onUnmounted(() => {
  paginationMq?.removeEventListener('change', syncPaginationViewport)
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

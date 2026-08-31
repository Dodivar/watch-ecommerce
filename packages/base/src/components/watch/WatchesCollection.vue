<template>
  <SeoStructuredData v-if="collectionBreadcrumbSchema" :schemas="collectionBreadcrumbSchema" />
  <section
    class="min-h-screen"
    :class="
      effectiveBrandHero ? 'pt-0 pb-3 lg:pb-10' : 'py-3 lg:py-10'
    "
  >
    <!-- Hero marque : une seule marque sélectionnée (filtre / ?marque=) -->
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
          fetchpriority="high"
          decoding="async"
          width="1680"
          height="720"
          sizes="100vw"
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
      <!-- Marque introuvable -->
      <div
        v-if="!listing.isLoading && !listing.error && unknownBrand"
        class="text-center py-16"
      >
        <h2 class="text-xl font-semibold text-text-main mb-3">{{ t('collection.brandNotFound') }}</h2>
        <p class="text-gray-600 mb-6">{{ t('collection.brandNoWatches') }}</p>
        <RouterLink
          to="/collection"
          class="inline-flex px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
        >
          {{ t('collection.seeAll') }}
        </RouterLink>
      </div>

      <template v-else>
        <!-- En-tête : titre + filtrer/tri (même ligne) + chips (ligne dessous) -->
        <div
          v-if="showFilters || showSort || !effectiveBrandHero"
          class="mb-3 lg:mb-8"
        >
          <!-- Ligne 1 : titre (pleine largeur sur mobile, à gauche dès sm) + Filtrer/Tri -->
          <div
            class="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3 sm:gap-y-3 lg:gap-4"
          >
            <h1
              v-if="!effectiveBrandHero"
              class="min-w-0 text-xl font-bold text-text-main sm:flex-1 sm:text-2xl"
            >
              {{ pageHeadingTitle }}
            </h1>

            <div class="flex items-center gap-2 sm:ml-auto sm:shrink-0 sm:gap-3">
              <button
                v-if="showFilters"
                type="button"
                class="inline-flex flex-1 shrink-0 items-center justify-center gap-2 rounded-lg border border-primary bg-primary px-3 py-2 text-white transition-colors hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 sm:flex-none sm:px-4 sm:py-2.5"
                :aria-label="filterButtonAriaLabel"
                @click="listing.openFilterDrawer"
              >
                <SlidersHorizontal class="h-5 w-5 shrink-0" :stroke-width="2" />
                <span class="text-sm font-semibold uppercase tracking-wide">{{ t('collection.filter') }}</span>
                <span
                  v-if="listing.activeFilterCount > 0"
                  class="inline-flex min-h-[1.25rem] min-w-[1.25rem] items-center justify-center rounded-full bg-white px-1.5 text-xs font-bold leading-none text-text-main shadow-sm ring-1 ring-primary/10"
                  aria-hidden="true"
                >
                  {{ listing.activeFilterCount }}
                </span>
              </button>

              <div
                v-if="showSort"
                class="relative flex-1 shrink-0 sm:flex-none"
                ref="sortDropdownRef"
              >
                <button
                  type="button"
                  class="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-text-main transition-colors hover:bg-cream-100 focus:outline-none focus:ring-2 focus:ring-primary sm:w-auto sm:gap-2 sm:px-4 sm:py-2.5"
                  :aria-label="t('collection.sortWatches', { label: currentSortLabel })"
                  aria-haspopup="listbox"
                  :aria-expanded="listing.isSortMenuOpen"
                  @click.stop="listing.toggleSortMenu"
                >
                  <ArrowDownUp class="h-4 w-4 shrink-0 text-gray-600" :stroke-width="2" />
                  <span class="whitespace-nowrap">{{ currentSortLabel }}</span>
                  <ChevronDown
                    class="h-4 w-4 shrink-0 text-gray-500 transition-transform"
                    :class="{ 'rotate-180': listing.isSortMenuOpen }"
                    :stroke-width="2"
                  />
                </button>

                <div
                  v-if="listing.isSortMenuOpen"
                  ref="sortMenuRef"
                  class="absolute top-full right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-50 min-w-[180px]"
                  role="listbox"
                  :aria-label="t('collection.sortWatches', { label: currentSortLabel })"
                  @click.stop
                >
                  <button
                    v-for="(option, index) in sortOptions"
                    :key="option.value"
                    type="button"
                    role="option"
                    :aria-selected="listing.sortOrder === option.value"
                    class="w-full text-left px-4 py-2 hover:bg-cream transition-colors"
                    :class="[
                      listing.sortOrder === option.value
                        ? 'bg-primary text-white hover:bg-primary-hover'
                        : 'text-gray-700',
                      index === sortOptions.length - 1 ? 'rounded-b-lg' : '',
                      index === 0 ? 'rounded-t-lg' : '',
                    ]"
                    @click="listing.selectSort(option.value)"
                  >
                    {{ option.label }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Ligne 2 : chips de filtres actifs -->
          <div
            v-if="activeFilterChips.length > 0"
            class="collection-active-filters mt-3 flex flex-wrap items-center gap-2 lg:mt-4"
            :aria-label="t('collection.activeFilters')"
          >
            <button
              v-for="chip in activeFilterChips"
              :key="chip.id"
              type="button"
              class="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-text-main transition-colors hover:border-primary hover:bg-cream-100 focus:outline-none focus:ring-2 focus:ring-primary"
              :aria-label="t('collection.removeFilter', { label: chip.label })"
              @click="removeActiveFilter(chip)"
            >
              <span class="whitespace-nowrap">{{ chip.label }}</span>
              <X class="h-3.5 w-3.5 shrink-0 text-gray-500" :stroke-width="2.5" aria-hidden="true" />
            </button>
          </div>
        </div>

        <!-- Erreur -->
        <div v-if="listing.error" class="text-center py-10">
          <div class="text-red-500 mb-3">
            <AlertCircle class="w-16 h-16 mx-auto mb-3" :stroke-width="2" />
          </div>
          <h3 class="text-xl text-gray-900 mb-2">{{ t('watch.loadError') }}</h3>
          <p class="text-gray-600 mb-3">{{ listing.error }}</p>
          <button
            type="button"
            class="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
            @click="listing.loadWatches"
          >
            {{ t('common.retry') }}
          </button>
        </div>

        <!-- Catalogue : squelette puis montres, dans le format choisi par le manifest -->
        <WatchCollectionLayout
          v-else
          :mode="collectionDisplayMode"
          :watches="paginatedWatches"
          :is-loading="listing.isLoading"
          :skeleton-count="skeletonCardCount"
          :is-nouvelle="isNouvelle"
          @viewDetails="handleViewDetails"
        />

        <!-- Pagination + total (discret) -->
        <div
          v-if="
            collectionListingReady &&
            !listing.isLoading &&
            !listing.error &&
            !unknownBrand &&
            totalFiltered > 0
          "
          class="mb-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center sm:gap-8"
        >
          <p
            class="order-2 text-center text-sm text-gray-500 sm:order-1 sm:text-center"
          >
            <template v-if="showFilteredTotal">
              {{ tc('collection.resultCountOfTotal', totalFiltered, { total: totalCount }) }}
            </template>
            <template v-else>
              {{ tc('collection.resultCount', totalFiltered) }}
            </template>
            <span v-if="listing.isLoadingMore" class="ml-1 text-gray-400">
              {{ t('collection.loadingMore') }}
            </span>
          </p>
          <nav
            v-if="totalPages > 1"
            class="order-1 flex w-full max-w-full justify-center overflow-x-auto overflow-y-hidden py-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:order-2 sm:overflow-visible sm:py-0 [&::-webkit-scrollbar]:hidden"
            :aria-label="t('pagination.label')"
          >
            <div
              class="flex max-w-full shrink-0 items-center gap-0 sm:gap-1.5"
            >
              <button
                type="button"
                class="inline-flex h-11 w-11 shrink-0 touch-manipulation items-center justify-center rounded-lg border border-gray-300 bg-white p-0 text-gray-700 transition-colors hover:bg-cream-100 sm:h-10 sm:w-10"
                :class="
                  currentPage === 1
                    ? 'cursor-not-allowed bg-cream-200 text-gray-400'
                    : ''
                "
                :disabled="currentPage === 1"
                :aria-label="t('pagination.previous')"
                @click="goToPage(currentPage - 1)"
              >
                <ChevronLeft class="h-5 w-5 shrink-0 sm:h-5 sm:w-5" :stroke-width="2" />
              </button>
              <ul
                class="m-0 flex shrink-0 list-none flex-wrap items-center justify-center gap-0 p-0 sm:gap-1"
                :aria-label="t('pagination.pageSelect')"
              >
                <li
                  v-for="(item, itemIdx) in collectionPaginationItems"
                  :key="`page-${itemIdx}-${item.type === 'page' ? item.n : 'ellipsis'}`"
                  class="m-0 flex h-11 w-11 items-center justify-center p-0 sm:h-10 sm:w-10"
                >
                  <span
                    v-if="item.type === 'ellipsis'"
                    class="box-border inline-flex h-11 w-11 shrink-0 items-center justify-center text-sm font-medium text-gray-500 sm:h-10 sm:w-10"
                    aria-hidden="true"
                  >
                    …
                  </span>
                  <span
                    v-else-if="item.type === 'page' && item.n === currentPage"
                    class="box-border inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-primary bg-primary text-sm font-semibold text-white sm:h-10 sm:w-10 sm:text-sm"
                    aria-current="page"
                  >
                    {{ item.n }}
                  </span>
                  <button
                    v-else-if="item.type === 'page'"
                    type="button"
                    class="box-border inline-flex h-11 w-11 shrink-0 touch-manipulation items-center justify-center rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 transition-colors hover:bg-cream-100 sm:h-10 sm:w-10 sm:text-sm"
                    :aria-label="t('pagination.page', { n: item.n })"
                    @click="goToPage(item.n)"
                  >
                    {{ item.n }}
                  </button>
                </li>
              </ul>
              <button
                type="button"
                class="inline-flex h-11 w-11 shrink-0 touch-manipulation items-center justify-center rounded-lg border border-gray-300 bg-white p-0 text-gray-700 transition-colors hover:bg-cream-100 sm:h-10 sm:w-10"
                :class="
                  currentPage === totalPages
                    ? 'cursor-not-allowed bg-cream-200 text-gray-400'
                    : ''
                "
                :disabled="currentPage === totalPages"
                :aria-label="t('pagination.next')"
                @click="goToPage(currentPage + 1)"
              >
                <ChevronRight class="h-5 w-5 shrink-0 sm:h-5 sm:w-5" :stroke-width="2" />
              </button>
            </div>
          </nav>
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
            <Clock class="w-16 h-16 mx-auto mb-3" :stroke-width="1" />
          </div>
          <h3 class="text-xl text-gray-600 mb-2">
            {{ campaignLoadError ? t('collection.campaignUnavailable') : t('collection.noWatchFound') }}
          </h3>
          <p class="text-gray-500">
            {{
              campaignLoadError
                ? t('collection.eventOver')
                : t('blog.adjustSearch')
            }}
          </p>
        </div>

        <!-- Contact -->
        <div
          v-if="showContactSection"
          class="bg-white rounded-md shadow-lg p-8 text-center"
        >
          <h2 class="text-2xl font-semibold text-text-main mb-4">{{ t('collection.interestedInPiece') }}</h2>
          <p class="text-lg text-gray-600 mb-6 font-light">
            {{ t('watch.contactInPerson') }}
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
              {{ t('contact.whatsapp') }}
            </a>
            <a
              :href="'mailto:' + EMAIL_CONTACT"
              class="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-primary hover:bg-primary-hover transition-colors duration-200"
            >
              <Mail class="w-5 h-5 mr-2" :stroke-width="2" />
              {{ t('contact.byEmail') }}
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
      @applied="onFiltersApplied"
    />
  </section>
</template>

<script setup>
import { computed, ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import {
  AlertCircle,
  ArrowDownUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Mail,
  SlidersHorizontal,
  X,
} from '@lucide/vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useHead } from '@vueuse/head'

import WatchCollectionLayout from './WatchCollectionLayout.vue'
import WatchCollectionFiltersDrawer from './WatchCollectionFiltersDrawer.vue'
import { scrollAnimation } from '@/animation'
import { WHATSAPP_NUMBER, EMAIL_CONTACT, BASE_URL, CANONICAL_BASE_URL } from '@/config'
import { getSiteConfig } from '@/site/getSiteConfig.js'
import {
  getMergedCollectionFilters,
  getResolvedCollectionDisplayMode,
  getResolvedCollectionPageSize,
} from '@/site/collectionFilters.js'
import { useWatchListing } from '@/composables/useWatchListing.js'
import { useNouvellesWatchIds } from '@/composables/useNouvellesWatchIds.js'
import { isValidCollectionPublicQuerySlug, getStaticWatchAudienceFilterOptions } from '@/constants/watchAudiences.js'
import { formatCaseSizeDisplay } from '@/utils/caseSize'
import { getBraceletColorLabel } from '@/constants/watchBraceletColors'
import { getBraceletMaterialLabel } from '@/constants/watchBraceletMaterials'
import SeoStructuredData from '@/components/seo/SeoStructuredData.vue'
import { buildBreadcrumbStructuredData } from '@/site/buildBreadcrumbStructuredData.js'
import { buildBrandCollectionPath, buildBrandCollectionUrl, resolveBrandSlugFromRoute } from '@/utils/collectionRoutes.js'
import { resolveBrandFromSlug } from '@/utils/brandSlug.js'
import { navigateToWatch } from '@/utils/watchSlug.js'
import {
  COLLECTION_PAGINATION_MOBILE_MQ,
  buildCollectionPaginationItems,
} from '@/utils/collectionPagination.js'
import { getActiveCampaignBySlugPublic } from '@/services/watchPromotionCampaignService.js'
import { isValidCampaignSlug } from '@/utils/campaignSlug.js'
import { formatNumber } from '@/utils/formatters.js'
import { t, tc } from '@/i18n'

const props = defineProps({
  showFilters: { type: Boolean, default: true },
  showSort: { type: Boolean, default: true },
  showContactSection: { type: Boolean, default: true },
  showBrandHero: { type: Boolean, default: true },
})

const sortOptions = [
  { value: 'recent', label: t('collection.sortNewest') },
  { value: 'price-asc', label: t('collection.sortPriceAsc') },
  { value: 'price-desc', label: t('collection.sortPriceDesc') },
]

const route = useRoute()
const router = useRouter()

const marqueQuerySlug = computed(() => resolveBrandSlugFromRoute(route))

const publicQuerySlug = computed(() => {
  const q = route.query.public
  const raw = Array.isArray(q) ? q[0] : q
  const slug = raw ? String(raw) : ''
  return isValidCollectionPublicQuerySlug(slug) ? slug : ''
})

const promotionQueryActive = computed(() => {
  const q = route.query.promotion
  const raw = Array.isArray(q) ? q[0] : q
  return raw === '1' || raw === 'true'
})

const eventQuerySlug = computed(() => {
  const q = route.query.event
  const raw = Array.isArray(q) ? q[0] : q
  const slug = raw ? String(raw).trim().toLowerCase() : ''
  return isValidCampaignSlug(slug) ? slug : ''
})

const campaignLoadError = ref(false)

const listing = useWatchListing()
const { isNouvelle } = useNouvellesWatchIds()

const currentSortLabel = computed(() => {
  const match = sortOptions.find((option) => option.value === listing.sortOrder)
  return match?.label ?? sortOptions[0].label
})

const filterButtonAriaLabel = computed(() => {
  const count = listing.activeFilterCount
  if (count > 0) return tc('collection.filterWithCount', count)
  return t('collection.filter')
})

watch(
  () => [marqueQuerySlug.value, listing.watches.length],
  () => {
    if (!listing.watches?.length) return
    const slug = marqueQuerySlug.value
    if (!slug) {
      listing.selectedBrands = []
      return
    }
    const brand = resolveBrandFromSlug(listing.watches, slug)
    listing.selectedBrands = brand ? [brand] : []
  },
  { immediate: true },
)

watch(
  publicQuerySlug,
  (slug) => {
    listing.selectedAudience = slug || 'all'
  },
  { immediate: true },
)

watch(
  promotionQueryActive,
  (active) => {
    if (eventQuerySlug.value) return
    listing.selectedPromotionOnly = active
  },
  { immediate: true },
)

watch(
  eventQuerySlug,
  async (slug) => {
    if (!slug) {
      listing.clearCampaignFilter()
      campaignLoadError.value = false
      return
    }

    listing.selectedPromotionOnly = false
    const campaign = await getActiveCampaignBySlugPublic(slug)
    if (!campaign) {
      listing.setCampaignFilter(slug, [], '')
      campaignLoadError.value = true
      return
    }

    campaignLoadError.value = false
    listing.setCampaignFilter(slug, campaign.watchIds, campaign.name)
  },
  { immediate: true },
)

const siteConfig = getSiteConfig()

const collectionPageSize = getResolvedCollectionPageSize(siteConfig)
const collectionDisplayMode = getResolvedCollectionDisplayMode(siteConfig)

const currentPage = ref(1)
const collectionListingReady = ref(false)

const totalFiltered = computed(() => listing.filteredWatches.length)

const totalCount = computed(() => listing.watches.length)

/** Affiche « X sur Y » quand des filtres réduisent la liste sous le total. */
const showFilteredTotal = computed(
  () => listing.hasActiveFilters && totalFiltered.value < totalCount.value,
)

const totalPages = computed(() =>
  Math.max(1, Math.ceil(totalFiltered.value / collectionPageSize)),
)

const paginatedWatches = computed(() => {
  const start = (currentPage.value - 1) * collectionPageSize
  return listing.filteredWatches.slice(start, start + collectionPageSize)
})

// Le plafond par format vit dans `WATCH_COLLECTION_LAYOUTS` : une rangée compacte
// en montre plus qu'une vitrine, la page n'a pas à en décider.
const skeletonCardCount = computed(() => collectionPageSize)

const isCollectionPaginationCompact = ref(false)
let collectionPaginationMq = null

const collectionPaginationItems = computed(() =>
  buildCollectionPaginationItems(
    currentPage.value,
    totalPages.value,
    isCollectionPaginationCompact.value,
  ),
)

const collectionFilterFingerprint = computed(() =>
  [
    listing.sortOrder,
    listing.selectedAudience,
    listing.selectedPromotionOnly,
    listing.selectedEventSlug,
    [...listing.selectedBraceletColors].slice().sort().join('|'),
    [...listing.selectedBraceletMaterials].slice().sort().join('|'),
    [...listing.selectedCaseSizes].slice().sort().join('\u0000'),
    listing.priceMin,
    listing.priceMax,
    [...listing.selectedBrands].slice().sort().join('\u0000'),
    marqueQuerySlug.value,
    publicQuerySlug.value,
    promotionQueryActive.value,
    eventQuerySlug.value,
  ].join('|'),
)

function buildCollectionLocation(page) {
  const query = {}

  if (listing.selectedAudience !== 'all') {
    query.public = listing.selectedAudience
  }

  if (listing.selectedEventSlug) {
    query.event = listing.selectedEventSlug
  } else if (listing.selectedPromotionOnly) {
    query.promotion = '1'
  }

  if (page > 1) query.page = String(page)

  if (listing.selectedBrands.length === 1) {
    return {
      path: buildBrandCollectionPath(listing.selectedBrands[0]),
      query,
    }
  }

  return {
    path: '/collection',
    query,
  }
}

function updateCollectionPageQuery(page) {
  router.replace(buildCollectionLocation(page))
}

function syncCollectionFilterQuery() {
  currentPage.value = 1
  router.replace(buildCollectionLocation(1))
}

function onFiltersApplied() {
  if (!collectionListingReady.value) return
  syncCollectionFilterQuery()
}

function syncCollectionPageFromRoute() {
  const raw = route.query.page
  const parsed = parseInt(Array.isArray(raw) ? raw[0] : raw, 10)
  const p = Number.isFinite(parsed) && parsed >= 1 ? parsed : 1
  const tp = totalPages.value
  const clamped = Math.min(Math.max(1, p), tp)
  currentPage.value = clamped
  if (clamped !== p) updateCollectionPageQuery(clamped)
}

function goToPage(page) {
  const tp = totalPages.value
  const p = Math.min(Math.max(1, page), tp)
  currentPage.value = p
  updateCollectionPageQuery(p)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

watch(
  () => route.query.page,
  () => {
    if (!collectionListingReady.value) return
    const before = currentPage.value
    syncCollectionPageFromRoute()
    if (currentPage.value !== before) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  },
)

watch(totalPages, (tp) => {
  if (!collectionListingReady.value) return
  if (currentPage.value > tp) {
    currentPage.value = Math.max(1, tp)
    updateCollectionPageQuery(currentPage.value)
  }
})

watch(collectionFilterFingerprint, (next, prev) => {
  if (!collectionListingReady.value || prev === undefined) return
  if (next === prev) return
  if (currentPage.value !== 1) {
    currentPage.value = 1
    updateCollectionPageQuery(1)
  }
})

const filterSections = computed(() => {
  const cfg = getMergedCollectionFilters(siteConfig)
  return {
    price: cfg.price,
    brand: cfg.brand,
    audience: cfg.audience,
    caseSize: cfg.caseSize,
    braceletColor: cfg.braceletColor,
    braceletMaterial: cfg.braceletMaterial,
    promotion: cfg.promotion,
  }
})

/** Marque unique affichée : exactement une marque cochée (filtre ou ?marque=slug). */
const singleBrandLabel = computed(() => {
  const brands = listing.selectedBrands
  if (Array.isArray(brands) && brands.length === 1) return brands[0]
  return null
})

const resolvedTitle = computed(() => singleBrandLabel.value || t('collection.brandFallback'))

const pageHeadingTitle = computed(() => {
  if (listing.campaignFilterLabel) return listing.campaignFilterLabel
  if (singleBrandLabel.value) return singleBrandLabel.value
  return t('collection.title')
})

const audienceLabelBySlug = Object.fromEntries(
  getStaticWatchAudienceFilterOptions().map((opt) => [opt.id, opt.label]),
)

const activeFilterChips = computed(() => {
  const chips = []

  for (const brand of listing.selectedBrands) {
    chips.push({
      id: `brand:${brand}`,
      type: 'brand',
      value: brand,
      label: brand,
    })
  }

  for (const size of listing.selectedCaseSizes) {
    chips.push({
      id: `caseSize:${size}`,
      type: 'caseSize',
      value: size,
      label: formatCaseSizeDisplay(size),
    })
  }

  for (const color of listing.selectedBraceletColors) {
    chips.push({
      id: `braceletColor:${color}`,
      type: 'braceletColor',
      value: color,
      label: getBraceletColorLabel(color),
    })
  }

  for (const material of listing.selectedBraceletMaterials) {
    chips.push({
      id: `braceletMaterial:${material}`,
      type: 'braceletMaterial',
      value: material,
      label: getBraceletMaterialLabel(material),
    })
  }

  if (listing.selectedAudience !== 'all') {
    chips.push({
      id: `audience:${listing.selectedAudience}`,
      type: 'audience',
      value: listing.selectedAudience,
      label: audienceLabelBySlug[listing.selectedAudience] || listing.selectedAudience,
    })
  }

  if (listing.selectedPromotionOnly) {
    chips.push({
      id: 'promotion',
      type: 'promotion',
      label: 'Promotions',
    })
  }

  if (listing.selectedEventSlug && listing.campaignFilterLabel) {
    chips.push({
      id: `event:${listing.selectedEventSlug}`,
      type: 'event',
      value: listing.selectedEventSlug,
      label: listing.campaignFilterLabel,
    })
  }

  if (listing.priceMin !== null || listing.priceMax !== null) {
    const min = listing.priceMin ?? listing.priceMinLimit
    const max = listing.priceMax ?? listing.priceMaxLimit
    chips.push({
      id: 'price',
      type: 'price',
      label: `${formatNumber(min)} € – ${formatNumber(max)} €`,
    })
  }

  return chips
})

function removeActiveFilter(chip) {
  switch (chip.type) {
    case 'brand':
      listing.selectedBrands = listing.selectedBrands.filter((brand) => brand !== chip.value)
      break
    case 'caseSize':
      listing.selectedCaseSizes = listing.selectedCaseSizes.filter((size) => size !== chip.value)
      break
    case 'braceletColor':
      listing.selectedBraceletColors = listing.selectedBraceletColors.filter(
        (color) => color !== chip.value,
      )
      break
    case 'braceletMaterial':
      listing.selectedBraceletMaterials = listing.selectedBraceletMaterials.filter(
        (material) => material !== chip.value,
      )
      break
    case 'audience':
      listing.selectedAudience = 'all'
      break
    case 'promotion':
      listing.selectedPromotionOnly = false
      break
    case 'event':
      listing.clearCampaignFilter()
      break
    case 'price':
      listing.priceMin = null
      listing.priceMax = null
      break
    default:
      return
  }

  if (collectionListingReady.value) {
    syncCollectionFilterQuery()
  }
}

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
  if (listing.isLoading || listing.error || !marqueQuerySlug.value) return false
  if (!listing.watches.length) return false
  return !resolveBrandFromSlug(listing.watches, marqueQuerySlug.value)
})

const seoCollection = getSiteConfig().seo.collection

function fillBrand(template, brand) {
  if (!template) return ''
  return template.replace(/\{brand\}/g, brand || '')
}

const seoBrand = computed(() => siteConfig.seo?.brandCollection || {})

const collectionHead = computed(() => {
  if (listing.isLoading || listing.error) return {}

  if (!singleBrandLabel.value || listing.selectedBrands.length !== 1) {
    return {
      title: seoCollection.title,
      meta: [
        { name: 'description', content: seoCollection.metaDescription },
        { property: 'og:title', content: seoCollection.ogTitle },
        { property: 'og:description', content: seoCollection.ogDescription },
        { property: 'og:url', content: `${CANONICAL_BASE_URL}/collection` },
        { property: 'og:type', content: 'website' },
        { name: 'twitter:card', content: 'summary' },
        { name: 'twitter:title', content: seoCollection.twitterTitle },
        { name: 'twitter:description', content: seoCollection.twitterDescription },
      ],
      link: [{ rel: 'canonical', href: `${CANONICAL_BASE_URL}/collection` }],
    }
  }

  const brand = singleBrandLabel.value
  const shareParams = new URLSearchParams()
  if (publicQuerySlug.value) {
    shareParams.set('public', publicQuerySlug.value)
  }
  if (promotionQueryActive.value) {
    shareParams.set('promotion', '1')
  }
  const shareQuery = shareParams.toString()
  const brandPath = buildBrandCollectionPath(brand)
  const shareUrl = shareQuery ? `${BASE_URL}${brandPath}?${shareQuery}` : `${BASE_URL}${brandPath}`
  const title = brand
    ? fillBrand(seoBrand.value.title || '{brand} | Collection', brand)
    : seoBrand.value.titleFallback || t('collection.brandCollectionFallback')
  const desc = brand
    ? fillBrand(
        seoBrand.value.metaDescription ||
          'Montres {brand} disponibles. Filtrez par public et budget.',
        brand,
      )
    : seoBrand.value.metaDescriptionFallback || ''

  return {
    title,
    meta: [
      { name: 'description', content: desc },
      { property: 'og:title', content: title },
      { property: 'og:description', content: desc },
      { property: 'og:url', content: shareUrl },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: desc },
    ],
    link: [{ rel: 'canonical', href: buildBrandCollectionUrl(CANONICAL_BASE_URL, brand) }],
  }
})

const collectionBreadcrumbSchema = computed(() => {
  if (!singleBrandLabel.value || listing.selectedBrands.length !== 1) return null
  return buildBreadcrumbStructuredData(CANONICAL_BASE_URL, [
    { name: 'Accueil', path: '/' },
    { name: 'Collection', path: '/collection' },
    { name: singleBrandLabel.value, path: buildBrandCollectionPath(singleBrandLabel.value) },
  ])
})

useHead(collectionHead)

const sortDropdownRef = ref(null)

const handleClickOutsideSortMenu = (event) => {
  if (sortDropdownRef.value && !sortDropdownRef.value.contains(event.target)) {
    listing.closeSortMenu()
  }
}

const handleViewDetails = (watch) => {
  navigateToWatch(router, watch)
}

function syncCollectionPaginationViewport() {
  isCollectionPaginationCompact.value = window.matchMedia(
    COLLECTION_PAGINATION_MOBILE_MQ,
  ).matches
}

onMounted(async () => {
  collectionPaginationMq = window.matchMedia(COLLECTION_PAGINATION_MOBILE_MQ)
  syncCollectionPaginationViewport()
  collectionPaginationMq.addEventListener('change', syncCollectionPaginationViewport)

  await listing.loadWatches()
  await nextTick()
  await nextTick()
  collectionListingReady.value = true
  syncCollectionPageFromRoute()
  scrollAnimation()
  document.addEventListener('click', handleClickOutsideSortMenu)
})

onUnmounted(() => {
  collectionPaginationMq?.removeEventListener('change', syncCollectionPaginationViewport)
  document.removeEventListener('click', handleClickOutsideSortMenu)
})
</script>

<style scoped>
.collection-active-filters {
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-x: contain;
}
</style>

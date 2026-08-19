<template>
  <section
    v-if="isLoading || latestWatches.length > 0"
    ref="sectionRef"
    class="py-12 bg-white"
  >
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center">
        <h2 class="text-3xl lg:text-4xl font-bold text-text-main mb-3">
          {{ nouvelles.title }}
        </h2>
        <p v-if="nouvelles.subtitle" class="text-xl text-gray-600">{{ nouvelles.subtitle }}</p>
      </div>
      <div class="relative group">
        <!-- Flèche gauche -->
        <button
          v-if="canScrollLeft"
          @click="scrollLeftManual"
          class="carousel-arrow carousel-arrow-left absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-2 sm:p-3 hover:bg-cream transition-all duration-200"
          :aria-label="t('carousel.scrollLeft')"
        >
          <svg class="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        <!-- Flèche droite -->
        <button
          v-if="canScrollRight"
          @click="scrollRightManual"
          class="carousel-arrow carousel-arrow-right absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-2 sm:p-3 hover:bg-cream transition-all duration-200"
          :aria-label="t('carousel.scrollRight')"
        >
          <svg class="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>

        <div
          ref="carouselContainer"
          class="overflow-x-auto custom-scrollbar-carrousel scroll-smooth p-4 sm:p-8"
          @scroll="onCarouselScroll"
        >
          <div ref="carouselContent" class="flex items-stretch space-x-4 sm:space-x-6 min-w-full">
            <!-- Loading State with Skeletons -->
            <template v-if="isLoading">
              <div
                v-for="n in 5"
                :key="`skeleton-${n}`"
                class="flex-shrink-0 w-40 sm:w-64 md:w-80"
              >
                <WatchCardSkeleton :show-new-badge="true" />
              </div>
            </template>
            <!-- Loaded Watches -->
            <template v-else v-for="(watch, i) in latestWatches" :key="`${i}-${watch.id || watch.name}`">
              <div class="flex-shrink-0 w-40 sm:w-64 md:w-80">
                <WatchCard
                  v-bind="WATCH_CARD_CATALOG_PROPS"
                  :watch="watch"
                  :show-new-badge="isNouvelle(watch.id)"
                  :image-loading="i < 2 ? 'eager' : 'lazy'"
                  :image-fetch-priority="i === 0 ? 'high' : 'auto'"
                  @viewDetails="handleViewDetails"
                />
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { t } from '@/i18n'
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { getSiteConfig } from '@/site/getSiteConfig.js'
import { loadNouvellesWatches } from '@/services/nouvellesWatchesService'
import { useNouvellesWatchIds } from '@/composables/useNouvellesWatchIds.js'
import WatchCard from '@/components/watch/WatchCard.vue'
import WatchCardSkeleton from '@/components/watch/WatchCardSkeleton.vue'
import { WATCH_CARD_CATALOG_PROPS } from '@/constants/watchCardDefaults.js'
import { navigateToWatch } from '@/utils/watchSlug.js'

const AUTO_SCROLL_DELAY_MS = 5000
const SCROLL_SETTLE_DEBOUNCE_MS = 150

const router = useRouter()
const { isNouvelle } = useNouvellesWatchIds()
const nouvelles = getSiteConfig().home.nouvelles
const latestWatches = ref([])
const isLoading = ref(true)
const sectionRef = ref(null)
const carouselContainer = ref(null)
const carouselContent = ref(null)
const canScrollLeft = ref(false)
const canScrollRight = ref(true)
const autoScrollEnabled = ref(true)
const isSectionFullyVisible = ref(false)

let autoScrollTimer = null
let scrollSettleTimer = null
let intersectionObserver = null
let supportsScrollEnd = false
let isProgrammaticScroll = false

const clearAutoScrollTimer = () => {
  if (autoScrollTimer !== null) {
    clearTimeout(autoScrollTimer)
    autoScrollTimer = null
  }
}

const clearScrollSettleTimer = () => {
  if (scrollSettleTimer !== null) {
    clearTimeout(scrollSettleTimer)
    scrollSettleTimer = null
  }
}

const canAutoScroll = () => {
  if (!autoScrollEnabled.value || isLoading.value || !isSectionFullyVisible.value) {
    return false
  }
  const container = carouselContainer.value
  if (!container) return false
  const { scrollWidth, clientWidth } = container
  return scrollWidth > clientWidth + 1
}

const scheduleAutoScroll = () => {
  clearAutoScrollTimer()
  if (!canAutoScroll()) return

  autoScrollTimer = setTimeout(() => {
    autoScrollTimer = null
    autoAdvance()
  }, AUTO_SCROLL_DELAY_MS)
}

const disableAutoScroll = () => {
  autoScrollEnabled.value = false
  clearAutoScrollTimer()
  clearScrollSettleTimer()
}

const beginProgrammaticScroll = () => {
  isProgrammaticScroll = true
}

const endProgrammaticScroll = () => {
  isProgrammaticScroll = false
}

const scrollToPosition = (left) => {
  const container = carouselContainer.value
  if (!container) return

  beginProgrammaticScroll()
  container.scrollTo({ left, behavior: 'smooth' })
}

const scrollLeft = () => {
  if (carouselContainer.value) {
    const container = carouselContainer.value
    const scrollAmount = container.clientWidth * 0.8
    const newScroll = Math.max(0, container.scrollLeft - scrollAmount)
    scrollToPosition(newScroll)
  }
}

const scrollRight = () => {
  if (carouselContainer.value) {
    const container = carouselContainer.value
    const scrollAmount = container.clientWidth * 0.8
    const maxScroll = container.scrollWidth - container.clientWidth
    const newScroll = Math.min(maxScroll, container.scrollLeft + scrollAmount)
    scrollToPosition(newScroll)
  }
}

const autoAdvance = () => {
  const container = carouselContainer.value
  if (!container || !autoScrollEnabled.value) return

  const maxScroll = container.scrollWidth - container.clientWidth
  const isAtEnd = container.scrollLeft >= maxScroll - 1

  if (isAtEnd) {
    scrollToPosition(0)
  } else {
    scrollRight()
  }
}

const scrollLeftManual = () => {
  disableAutoScroll()
  scrollLeft()
}

const scrollRightManual = () => {
  disableAutoScroll()
  scrollRight()
}

const updateArrowVisibility = () => {
  if (carouselContainer.value) {
    const { scrollLeft, scrollWidth, clientWidth } = carouselContainer.value
    canScrollLeft.value = scrollLeft > 0
    canScrollRight.value = scrollLeft < scrollWidth - clientWidth - 1
  }
}

const onScrollSettled = () => {
  updateArrowVisibility()
  endProgrammaticScroll()

  if (autoScrollEnabled.value && isSectionFullyVisible.value) {
    scheduleAutoScroll()
  }
}

const onCarouselScroll = () => {
  updateArrowVisibility()

  if (!isProgrammaticScroll) {
    disableAutoScroll()
    return
  }

  if (supportsScrollEnd) return

  clearScrollSettleTimer()
  scrollSettleTimer = setTimeout(() => {
    scrollSettleTimer = null
    onScrollSettled()
  }, SCROLL_SETTLE_DEBOUNCE_MS)
}

const setupIntersectionObserver = () => {
  if (!sectionRef.value || intersectionObserver) return

  intersectionObserver = new IntersectionObserver(
    (entries) => {
      const entry = entries[0]
      isSectionFullyVisible.value = entry?.isIntersecting ?? false

      if (isSectionFullyVisible.value) {
        scheduleAutoScroll()
      } else {
        clearAutoScrollTimer()
      }
    },
    { threshold: 1.0 },
  )

  intersectionObserver.observe(sectionRef.value)
}

const setupScrollEndListener = () => {
  const container = carouselContainer.value
  if (!container) return

  supportsScrollEnd = 'onscrollend' in document.createElement('div')
  if (supportsScrollEnd) {
    container.addEventListener('scrollend', onScrollSettled)
  }
}

const teardownScrollEndListener = () => {
  const container = carouselContainer.value
  if (container && supportsScrollEnd) {
    container.removeEventListener('scrollend', onScrollSettled)
  }
}

const onResize = () => {
  updateArrowVisibility()
  if (autoScrollEnabled.value && isSectionFullyVisible.value) {
    scheduleAutoScroll()
  }
}

onMounted(async () => {
  try {
    isLoading.value = true
    latestWatches.value = await loadNouvellesWatches()
    await nextTick()
    updateArrowVisibility()
    window.addEventListener('resize', onResize)
  } catch (error) {
    console.error('Erreur lors du chargement des nouvelles montres:', error)
    latestWatches.value = []
  } finally {
    isLoading.value = false
    await nextTick()
    updateArrowVisibility()
    setupIntersectionObserver()
    setupScrollEndListener()
    onScrollSettled()
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
  teardownScrollEndListener()
  intersectionObserver?.disconnect()
  intersectionObserver = null
  clearAutoScrollTimer()
  clearScrollSettleTimer()
})

const handleViewDetails = (watch) => {
  navigateToWatch(router, watch)
}
</script>

<style scoped>
/* Sur mobile: toujours afficher les flèches */
.carousel-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Sur desktop: afficher uniquement au survol */
@media (min-width: 768px) {
  .carousel-arrow {
    opacity: 0;
    transition: opacity 0.2s ease-in-out;
  }

  .group:hover .carousel-arrow {
    opacity: 1;
  }
}
</style>

<template>
  <section v-if="isLoading || salesWatches.length > 0" class="py-12 bg-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-3">
        <h2 class="text-3xl lg:text-4xl font-bold text-text-main">
          {{ t('carousel.recentSalesTitle') }}
        </h2>
        <p class="text-xl text-gray-600">{{ t('carousel.recentlySold') }}</p>
      </div>
      <div class="relative group">
        <!-- Flèche gauche -->
        <button
          v-if="canScrollLeft"
          @click="scrollLeft"
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
          @click="scrollRight"
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
          @scroll="updateArrowVisibility"
        >
          <div ref="carouselContent" class="flex space-x-4 sm:space-x-6 min-w-full">
            <!-- Loading State with Skeletons -->
            <template v-if="isLoading">
              <div
                v-for="n in 5"
                :key="`skeleton-${n}`"
                class="flex-shrink-0 w-40 sm:w-48 md:w-60"
              >
                <WatchCardSkeleton
                  :show-reference="false"
                  :show-sold-badge="false"
                  :show-price="false"
                />
              </div>
            </template>
            <!-- Loaded Watches -->
            <div
              v-else
              v-for="(watch, i) in transformedWatches"
              :key="`${i}-${watch.id || watch.name}`"
              class="flex-shrink-0 w-40 sm:w-48 md:w-60"
            >
              <WatchCard
                :watch="watch"
                :show-reference="false"
                :show-sold-badge="false"
                :show-price="false"
                :clickable="false"
                image-loading="lazy"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { getSoldWatches } from '@/services/watchService'
import WatchCard from '@/components/watch/WatchCard.vue'
import WatchCardSkeleton from '@/components/watch/WatchCardSkeleton.vue'
import { t } from '@/i18n'
const salesWatches = ref([])
const isLoading = ref(true)
const carouselContainer = ref(null)
const carouselContent = ref(null)
const canScrollLeft = ref(false)
const canScrollRight = ref(true)

const scrollLeft = () => {
  if (carouselContainer.value) {
    const container = carouselContainer.value
    const scrollAmount = container.clientWidth * 0.8
    const currentScroll = container.scrollLeft
    
    // Calculer la nouvelle position en s'assurant qu'elle ne dépasse pas 0
    const newScroll = Math.max(0, currentScroll - scrollAmount)
    
    container.scrollTo({
      left: newScroll,
      behavior: 'smooth'
    })
  }
}

const scrollRight = () => {
  if (carouselContainer.value) {
    const container = carouselContainer.value
    const scrollAmount = container.clientWidth * 0.8
    const currentScroll = container.scrollLeft
    const maxScroll = container.scrollWidth - container.clientWidth
    
    // Calculer la nouvelle position en s'assurant qu'elle ne dépasse pas le maximum
    const newScroll = Math.min(maxScroll, currentScroll + scrollAmount)
    
    container.scrollTo({
      left: newScroll,
      behavior: 'smooth'
    })
  }
}

const updateArrowVisibility = () => {
  if (carouselContainer.value) {
    const { scrollLeft, scrollWidth, clientWidth } = carouselContainer.value
    canScrollLeft.value = scrollLeft > 0
    canScrollRight.value = scrollLeft < scrollWidth - clientWidth - 1
  }
}

// Transformer les données pour correspondre au format attendu par WatchCard
const transformedWatches = computed(() => {
  return salesWatches.value.map((watch) => ({
    id: watch.id,
    name: watch.name,
    reference: watch.reference || '',
    price: watch.price || 0,
    isSold: true, // Toutes les montres dans ce carrousel sont vendues
    images: watch.imageUrl ? [watch.imageUrl] : [],
    contenu: watch.contenu || '',
    year: watch.year || null,
    details: {
      content: watch.details?.content || '',
    },
  }))
})

onMounted(async () => {
  try {
    isLoading.value = true
    const watches = await getSoldWatches()
    salesWatches.value = watches
    await nextTick()
    updateArrowVisibility()
    window.addEventListener('resize', updateArrowVisibility)
  } catch (error) {
    console.error('Erreur lors du chargement des montres vendues:', error)
    salesWatches.value = []
  } finally {
    isLoading.value = false
    await nextTick()
    updateArrowVisibility()
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', updateArrowVisibility)
})
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

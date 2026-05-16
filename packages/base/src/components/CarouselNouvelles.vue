<template>
  <section v-if="isLoading || latestWatches.length > 0" class="py-12 bg-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center">
        <h2 class="text-3xl lg:text-4xl font-bold text-text-main mb-3">
          Nouvelles arrivées
        </h2>
        <p class="text-xl text-gray-600">Découvrez nos dernières pièces ajoutées à notre sélection</p>
      </div>
      <div class="relative group">
        <!-- Flèche gauche -->
        <button
          v-if="canScrollLeft"
          @click="scrollLeft"
          class="carousel-arrow carousel-arrow-left absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-2 sm:p-3 hover:bg-cream transition-all duration-200"
          aria-label="Défiler vers la gauche"
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
          aria-label="Défiler vers la droite"
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
          <div ref="carouselContent" class="flex items-stretch space-x-4 sm:space-x-6 min-w-full">
            <!-- Loading State with Skeletons -->
            <template v-if="isLoading">
              <div
                v-for="n in 5"
                :key="`skeleton-${n}`"
                class="flex-shrink-0 w-40 sm:w-64 md:w-80"
              >
                <WatchCardSkeleton />
              </div>
            </template>
            <!-- Loaded Watches -->
            <template v-else v-for="(watch, i) in latestWatches" :key="`${i}-${watch.id || watch.name}`">
              <div class="flex-shrink-0 w-40 sm:w-64 md:w-80">
                <WatchCard
                  :watch="watch"
                  :show-image-navigation="false"
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
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { getLatestAvailableWatches } from '@/services/watchService'
import WatchCard from '@/components/watch/WatchCard.vue'
import WatchCardSkeleton from '@/components/watch/WatchCardSkeleton.vue'

const router = useRouter()
const latestWatches = ref([])
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

onMounted(async () => {
  try {
    isLoading.value = true
    const watches = await getLatestAvailableWatches(7)
    latestWatches.value = watches
    await nextTick()
    updateArrowVisibility()
    window.addEventListener('resize', updateArrowVisibility)
  } catch (error) {
    console.error('Erreur lors du chargement des nouvelles montres:', error)
    latestWatches.value = []
  } finally {
    isLoading.value = false
    await nextTick()
    updateArrowVisibility()
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', updateArrowVisibility)
})

const handleViewDetails = (watchId) => {
  router.push(`/watch/${watchId}`)
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


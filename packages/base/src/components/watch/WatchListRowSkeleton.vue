<template>
  <!-- Gabarit calqué sur WatchListRow : tout écart se voit comme un saut au chargement. -->
  <div
    class="flex items-stretch gap-3 rounded-md border border-gray-100 bg-white p-2 sm:gap-5 sm:p-3"
  >
    <div
      class="aspect-square w-24 shrink-0 overflow-hidden rounded bg-cream-300 shimmer-bg sm:w-32 lg:w-40"
    ></div>

    <div class="flex min-w-0 flex-1 flex-col justify-center gap-2 py-1">
      <div class="h-4 w-3/4 rounded bg-cream-300 shimmer-bg sm:h-5 lg:h-6"></div>
      <div class="h-3 w-1/3 rounded bg-cream-200 shimmer-bg sm:h-4"></div>
      <div v-if="effectiveShowReference" class="h-3 w-1/2 rounded bg-cream-200 shimmer-bg sm:h-4"></div>
      <div class="hidden gap-2 sm:flex">
        <div class="h-5 w-16 rounded bg-cream-200 shimmer-bg"></div>
        <div class="h-5 w-20 rounded bg-cream-200 shimmer-bg"></div>
      </div>
    </div>

    <div v-if="showPrice" class="flex shrink-0 items-center pl-1 sm:pl-2">
      <div class="h-5 w-20 rounded bg-cream-300 shimmer-bg sm:h-6 sm:w-28 lg:h-7"></div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { getSiteConfig } from '@/site/getSiteConfig.js'

const catalogDisplay = getSiteConfig().watchCatalog.display

const props = defineProps({
  showReference: {
    type: Boolean,
    default: true,
  },
  showPrice: {
    type: Boolean,
    default: true,
  },
})

const effectiveShowReference = computed(
  () => props.showReference && catalogDisplay.showReference,
)
</script>

<style scoped>
@keyframes shimmer {
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
}

.shimmer-bg {
  background: linear-gradient(
    90deg,
    #e5e7eb 0%,
    #f3f4f6 20%,
    #e5e7eb 40%,
    #e5e7eb 100%
  );
  background-size: 1000px 100%;
  animation: shimmer 2s infinite;
}
</style>

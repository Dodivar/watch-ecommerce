<template>
  <div>
    <!-- Image Slider Skeleton -->
    <div class="relative w-full aspect-square bg-cream-300 rounded-md overflow-hidden mb-3 md:mb-4 lg:mb-6 shimmer-bg">
      <div
        v-if="showNewBadge"
        class="absolute top-2 left-2 z-10 h-4 md:h-5 w-12 md:w-14 bg-cream-200 rounded-full shimmer-bg"
      ></div>
    </div>

    <!-- Watch Info Skeleton -->
    <div>
      <div class="flex items-start justify-between mb-1 md:mb-2">
        <!-- Title skeleton -->
        <div class="h-4 md:h-5 lg:h-6 bg-cream-300 rounded flex-1 pr-1 shimmer-bg" style="max-width: 75%;"></div>
        <!-- Badge skeleton (optional, shown if showSoldBadge is true) -->
        <div
          v-if="showSoldBadge"
          class="ml-1 md:ml-2 h-4 md:h-5 w-12 md:w-16 bg-cream-200 rounded-full flex-shrink-0 shimmer-bg"
        ></div>
      </div>

      <!-- Reference skeleton (optional) -->
      <div v-if="showReference" class="h-3 md:h-4 bg-cream-200 rounded mb-2 md:mb-3 w-1/2 shimmer-bg"></div>

      <!-- Price/Content/Year skeleton -->
      <div 
        v-if="showPrice"
        class="flex items-center gap-2"
      >
        <!-- Price skeleton -->
        <div v-if="showPrice" class="h-5 md:h-6 lg:h-7 bg-cream-300 rounded w-24 md:w-32 shimmer-bg"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  showReference: {
    type: Boolean,
    default: true,
  },
  showSoldBadge: {
    type: Boolean,
    default: true,
  },
  showNewBadge: {
    type: Boolean,
    default: false,
  },
  showPrice: {
    type: Boolean,
    default: true,
  },
})
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


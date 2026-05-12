<template>
  <div :class="{ 'cursor-pointer': clickable }" @click="handleCardClick">
    <!-- Image Slider -->
    <div class="relative w-full aspect-square bg-white rounded-md overflow-hidden mb-2 border border-gray-100">
      <div
        class="absolute inset-0 flex items-center justify-center"
        v-if="!watch.images || watch.images.length === 0"
      >
        <div class="text-gray-400 text-lg">Image non disponible</div>
      </div>

      <div 
        v-else 
        class="relative h-full"
        @touchstart="handleTouchStartWrapper"
        @touchend="handleTouchEndWrapper"
      >
        <img
          :src="watch.images[currentImageIndex]"
          :alt="watch.name"
          class="w-full h-full object-cover object-center"
        />

        <!-- Navigation arrows -->
        <button
          v-if="showImageNavigation && watch.images && watch.images.length > 1"
          @click.stop="previousImage"
          class="absolute left-1 md:left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-1 md:p-2 transition-all duration-200"
        >
          <svg class="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        <button
          v-if="showImageNavigation && watch.images && watch.images.length > 1"
          @click.stop="nextImage"
          class="absolute right-1 md:right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-1 md:p-2 transition-all duration-200"
        >
          <svg class="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>

        <!-- Image indicators -->
        <div
          v-if="showImageNavigation && watch.images && watch.images.length > 1"
          class="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1"
        >
          <button
            v-for="(_, index) in watch.images"
            :key="index"
            @click.stop="currentImageIndex = index"
            :class="[
              'w-1 h-1 md:w-2 md:h-2 rounded-full transition-all duration-200',
              currentImageIndex === index ? 'bg-white' : 'bg-white bg-opacity-50',
            ]"
          ></button>
        </div>
      </div>
    </div>

    <!-- Watch Info -->
    <div>
      <div class="flex items-start justify-between mb-1 md:mb-2">
        <h3
          class="text-xs md:text-base lg:text-xl font-semibold text-gray-900 leading-tight flex-1 pr-1 truncate"
          style="max-width: 100%;"
          :title="watch.name"
        >
          {{ watch.name }}
        </h3>
        <span
          v-if="watch.isSold && showSoldBadge"
          class="ml-1 md:ml-2 px-1.5 md:px-2 py-0.5 md:py-1 text-[10px] md:text-xs font-semibold rounded-full bg-red-100 text-red-800 whitespace-nowrap flex-shrink-0"
        >
          Vendue
        </span>
      </div>

      <p v-if="showReference" class="text-[10px] md:text-sm text-gray-600 md:mb-2 font-light">Réf. {{ watch.reference }}</p>


      <!-- Optional: Watch content or year -->
      <div 
        v-if="showPrice || watch.contenu || watch.details?.content || watch.year"
        class="flex items-center gap-2 text-[10px] md:text-sm text-gray-500"
      >
        <span v-if="showPrice" class="text-base md:text-xl lg:text-2xl font-medium text-primary">
          {{ formatPrice(watch.price) }}
        </span>
        <span 
          v-if="watch.contenu || watch.details?.content" 
          class="hidden md:inline bg-cream-200 px-1.5 md:px-2 py-0.5 md:py-1 rounded text-[10px] md:text-xs text-black"
        >
          {{ watch.contenu || watch.details?.content }}
        </span>
        <span 
          v-if="watch.year" 
          class="font-medium ml-auto"
        >
          {{ watch.year }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  watch: {
    type: Object,
    required: true,
  },
  showReference: {
    type: Boolean,
    default: true,
  },
  showSoldBadge: {
    type: Boolean,
    default: true,
  },
  showPrice: {
    type: Boolean,
    default: true,
  },
  showImageNavigation: {
    type: Boolean,
    default: true,
  },
  clickable: {
    type: Boolean,
    default: true,
  },
})

// Define emits for parent component communication
const emit = defineEmits(['viewDetails'])

const currentImageIndex = ref(0)

const handleCardClick = () => {
  if (props.clickable) {
    emit('viewDetails', props.watch.id)
  }
}

const nextImage = () => {
  if (props.watch.images && props.watch.images.length > 1) {
    currentImageIndex.value = (currentImageIndex.value + 1) % props.watch.images.length
  }
}

const previousImage = () => {
  if (props.watch.images && props.watch.images.length > 1) {
    currentImageIndex.value =
      currentImageIndex.value === 0 ? props.watch.images.length - 1 : currentImageIndex.value - 1
  }
}

const formatPrice = (price) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
  }).format(price)
}

// Touch/swipe support
let touchStartX = 0
let touchEndX = 0

const handleTouchStartWrapper = (e) => {
  if (props.showImageNavigation) {
    handleTouchStart(e)
  }
}

const handleTouchEndWrapper = (e) => {
  if (props.showImageNavigation) {
    handleTouchEnd(e)
  }
}

const handleTouchStart = (e) => {
  touchStartX = e.changedTouches[0].screenX
}

const handleTouchEnd = (e) => {
  touchEndX = e.changedTouches[0].screenX
  handleSwipe()
}

const handleSwipe = () => {
  const swipeThreshold = 50
  const diff = touchStartX - touchEndX

  if (Math.abs(diff) > swipeThreshold) {
    if (diff > 0) {
      nextImage()
    } else {
      previousImage()
    }
  }
}
</script>

<template>
  <div :class="{ 'cursor-pointer': clickable }" @click="handleCardClick">
    <div class="relative w-full aspect-square bg-white rounded-md overflow-hidden mb-2 border border-gray-100">
      <span
        v-if="showNewBadge"
        class="absolute top-2 left-2 z-10 px-2 py-0.5 md:py-1 text-[10px] md:text-xs font-semibold rounded-full bg-primary text-white shadow-sm"
      >
        Nouveau
      </span>
      <div
        v-if="!watch.images || watch.images.length === 0"
        class="absolute inset-0 flex items-center justify-center"
      >
        <div class="text-gray-400 text-lg">Image non disponible</div>
      </div>

      <div
        v-else-if="hoverSecondImage && hasSecondImage"
        class="relative h-full"
        @mouseenter="onHoverSecondEnter"
        @mouseleave="onHoverSecondLeave"
      >
        <img
          :src="firstImageSrc"
          :srcset="firstImageSrcSet"
          :sizes="firstImageSrcSet ? WATCH_CARD_IMAGE_SIZES : undefined"
          :alt="watch.name"
          :loading="imageLoading"
          :fetchpriority="imageFetchPriority"
          decoding="async"
          width="400"
          height="400"
          class="absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-300"
          :class="isHoveringSecond ? 'opacity-0' : 'opacity-100'"
        />
        <img
          v-if="isDesktopViewport"
          :src="secondImageSrc"
          :alt="`${watch.name} — vue alternative`"
          loading="lazy"
          decoding="async"
          width="400"
          height="400"
          class="absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-300"
          :class="isHoveringSecond ? 'opacity-100' : 'opacity-0'"
        />
      </div>

      <div
        v-else
        class="relative h-full"
        @touchstart="handleTouchStartWrapper"
        @touchend="handleTouchEndWrapper"
      >
        <img
          :src="displayImageSrc"
          :srcset="displayImageSrcSet"
          :sizes="displayImageSrcSet ? WATCH_CARD_IMAGE_SIZES : undefined"
          :alt="watch.name"
          :loading="imageLoading"
          :fetchpriority="imageFetchPriority"
          decoding="async"
          width="400"
          height="400"
          class="w-full h-full object-cover object-center"
        />

        <button
          v-if="effectiveShowImageNavigation && watch.images.length > 1"
          type="button"
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
          v-if="effectiveShowImageNavigation && watch.images.length > 1"
          type="button"
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

        <div
          v-if="effectiveShowImageNavigation && watch.images.length > 1"
          class="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1"
        >
          <button
            v-for="(_, index) in watch.images"
            :key="index"
            type="button"
            @click.stop="currentImageIndex = index"
            :class="[
              'w-1 h-1 md:w-2 md:h-2 rounded-full transition-all duration-200',
              currentImageIndex === index ? 'bg-white' : 'bg-white bg-opacity-50',
            ]"
          />
        </div>
      </div>
    </div>

    <div>
      <div class="flex items-start justify-between mb-1 md:mb-2">
        <h3
          class="text-xs md:text-base lg:text-xl font-semibold text-gray-900 leading-tight flex-1 pr-1 truncate"
          style="max-width: 100%"
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

      <p v-if="showReference" class="text-[10px] md:text-sm text-gray-600 md:mb-2 font-light">
        Réf. {{ watch.reference }}
      </p>

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
        <span v-if="watch.year" class="font-medium ml-auto">
          {{ watch.year }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  watchCardImageUrl,
  buildWatchCardSrcSet,
  WATCH_CARD_IMAGE_SIZES,
} from '@/utils/watchImageUrl.js'

const DESKTOP_HOVER_SECOND_IMAGE_MQ = '(min-width: 768px)'

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
  showNewBadge: {
    type: Boolean,
    default: false,
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
  imageLoading: {
    type: String,
    default: 'lazy',
    validator: (v) => v === 'lazy' || v === 'eager',
  },
  imageFetchPriority: {
    type: String,
    default: 'auto',
    validator: (v) => v === 'high' || v === 'low' || v === 'auto',
  },
  hoverSecondImage: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['viewDetails'])

const currentImageIndex = ref(0)
const isHoveringSecond = ref(false)
const isDesktopViewport = ref(false)

let desktopHoverMq = null

const hasSecondImage = computed(() => (props.watch.images?.length ?? 0) > 1)

const effectiveShowImageNavigation = computed(
  () => props.showImageNavigation && !props.hoverSecondImage,
)

function resolveDisplayUrl(url) {
  return watchCardImageUrl(url) ?? url
}

const firstImageSrc = computed(() => resolveDisplayUrl(props.watch.images?.[0] ?? ''))
const firstImageSrcSet = computed(() => buildWatchCardSrcSet(props.watch.images?.[0] ?? ''))
const secondImageSrc = computed(() => resolveDisplayUrl(props.watch.images?.[1] ?? ''))

const rawImageUrl = computed(
  () => props.watch.images?.[currentImageIndex.value] ?? '',
)

const displayImageSrc = computed(() => resolveDisplayUrl(rawImageUrl.value))
const displayImageSrcSet = computed(() => buildWatchCardSrcSet(rawImageUrl.value))

function prefetchImageUrl(url) {
  if (!url) return
  const img = new Image()
  img.src = resolveDisplayUrl(url)
}

function onHoverSecondEnter() {
  if (!props.hoverSecondImage || !isDesktopViewport.value || !hasSecondImage.value) return
  prefetchImageUrl(props.watch.images[1])
  isHoveringSecond.value = true
}

function onHoverSecondLeave() {
  isHoveringSecond.value = false
}

function syncDesktopViewport() {
  isDesktopViewport.value = window.matchMedia(DESKTOP_HOVER_SECOND_IMAGE_MQ).matches
}

onMounted(() => {
  desktopHoverMq = window.matchMedia(DESKTOP_HOVER_SECOND_IMAGE_MQ)
  syncDesktopViewport()
  desktopHoverMq.addEventListener('change', syncDesktopViewport)
})

onUnmounted(() => {
  desktopHoverMq?.removeEventListener('change', syncDesktopViewport)
})

const handleCardClick = () => {
  if (props.clickable) {
    emit('viewDetails', props.watch.id)
  }
}

const nextImage = () => {
  if (props.watch.images?.length > 1) {
    currentImageIndex.value = (currentImageIndex.value + 1) % props.watch.images.length
  }
}

const previousImage = () => {
  if (props.watch.images?.length > 1) {
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

let touchStartX = 0
let touchEndX = 0

const handleTouchStartWrapper = (e) => {
  if (effectiveShowImageNavigation.value) {
    handleTouchStart(e)
  }
}

const handleTouchEndWrapper = (e) => {
  if (effectiveShowImageNavigation.value) {
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

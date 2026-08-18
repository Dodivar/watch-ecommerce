<template>
  <div :class="{ 'cursor-pointer': clickable }" @click="handleCardClick">
    <!-- Plaque blanche : les visuels montres gardent leur fond clair quel que soit le thème. -->
    <div class="relative w-full aspect-square bg-white rounded-md overflow-hidden mb-2 border border-gray-100 group">
      <span
        v-if="showNewBadge"
        class="absolute top-2 left-2 z-10 px-2 py-0.5 md:py-1 text-[10px] md:text-xs font-semibold rounded-full bg-primary text-white shadow-sm"
      >
        {{ t('watch.new') }}
      </span>
      <span
        v-if="watchItem.isOnPromotion"
        class="absolute z-10 px-2 py-0.5 md:py-1 text-[10px] md:text-xs font-semibold rounded-full bg-red-600 text-white shadow-sm"
        :class="showNewBadge ? 'top-9 left-2 md:top-10' : 'top-2 left-2'"
      >
        -{{ watchItem.displayDiscountPercent }} %
      </span>
      <span
        v-if="showCornerYearBadge"
        class="absolute top-2 right-2 z-10 px-2 py-0.5 md:py-1 text-[10px] md:text-xs font-medium rounded border border-gray-200 bg-white/90 text-gray-800 shadow-sm backdrop-blur-sm"
      >
        {{ watchItem.year }}
      </span>
      <div
        v-if="!watchItem.images || watchItem.images.length === 0"
        class="absolute inset-0 flex items-center justify-center"
      >
        <div class="text-gray-400 text-lg">{{ t('watch.imageUnavailable') }}</div>
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
          :alt="watchItem.name"
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
          :alt="`${watchItem.name} — vue alternative`"
          loading="lazy"
          decoding="async"
          width="400"
          height="400"
          class="absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-300"
          :class="isHoveringSecond ? 'opacity-100' : 'opacity-0'"
        />
      </div>

      <WatchImageSwipeCarousel
        v-else
        class="relative h-full"
        ref="imageCarouselRef"
        v-model="currentImageIndex"
        :images="navigableImages"
        :show-navigation="effectiveShowImageNavigation && hasMultipleNavigableImages"
        navigation-button-class="hidden md:block md:opacity-0 md:group-hover:opacity-100 p-1 md:p-2"
        prev-navigation-class="left-1 md:left-2"
        next-navigation-class="right-1 md:right-2"
        :slide-key-fn="(image, index) => `${watchItem.id}-${index}`"
        :slide-alt-fn="(_, index) => (index === currentImageIndex ? watchItem.name : '')"
        @index-change="onCarouselIndexChange"
        @mouseenter="warmNavigableImages"
      >
        <template #slide="{ image, index, isActive }">
          <img
            :src="resolveImageSrc(image)"
            :alt="isActive ? watchItem.name : ''"
            :loading="navImageLoading(index)"
            :fetchpriority="index === 0 ? imageFetchPriority : 'auto'"
            decoding="async"
            width="400"
            height="400"
            class="pointer-events-none h-full w-full object-cover object-center"
            :aria-hidden="isActive ? undefined : 'true'"
            @load="onNavImageLoad(index)"
            @error="onNavImageLoad(index)"
            :ref="(el) => setNavImageRef(el, index)"
          />
        </template>

        <template #prev-icon>
          <ChevronLeft class="w-4 h-4 md:w-5 md:h-5" :stroke-width="2" />
        </template>

        <template #next-icon>
          <ChevronRight class="w-4 h-4 md:w-5 md:h-5" :stroke-width="2" />
        </template>

        <template #overlay>
          <div
            v-if="effectiveShowImageNavigation && hasMultipleNavigableImages"
            class="absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 gap-1"
          >
            <button
              v-for="(_, index) in navigableImages"
              :key="index"
              type="button"
              :aria-label="t('watch.imageIndex', { index: index + 1 })"
              :aria-current="currentImageIndex === index ? 'true' : undefined"
              @click.stop="goToImage(index)"
              :class="[
                'h-0.5 rounded-full transition-all duration-200',
                currentImageIndex === index ? 'w-5 bg-white' : 'w-2 bg-white/40',
              ]"
            />
          </div>
        </template>
      </WatchImageSwipeCarousel>

    </div>

    <div>
      <div class="flex items-start justify-between mb-1 md:mb-2">
        <h3
          class="text-xs md:text-base lg:text-xl font-semibold text-gray-900 leading-tight flex-1 pr-1 truncate"
          style="max-width: 100%"
          :title="watchItem.name"
        >
          {{ watchItem.name }}
        </h3>
        <span
          v-if="watchItem.isSold && effectiveShowSoldBadge"
          class="ml-1 md:ml-2 px-1.5 md:px-2 py-0.5 md:py-1 text-[10px] md:text-xs font-semibold rounded-full bg-red-100 text-red-800 whitespace-nowrap flex-shrink-0"
        >
          {{ t('watch.sold') }}
        </span>
        <span
          v-else-if="isOutOfStock"
          class="ml-1 md:ml-2 px-1.5 md:px-2 py-0.5 md:py-1 text-[10px] md:text-xs font-semibold rounded-full bg-orange-100 text-orange-800 whitespace-nowrap flex-shrink-0"
        >
          Hors stock
        </span>
      </div>

      <p v-if="effectiveShowReference" class="text-[10px] md:text-sm text-gray-600 md:mb-2 font-light">
        Réf. {{ watchItem.reference }}
      </p>

      <div
        v-if="showPrice || (catalogDisplay.showResaleFields && (watchItem.contenu || watchItem.details?.content || showInlineYear))"
        class="mt-2 md:mt-3 flex items-center gap-2 text-[10px] md:text-sm text-gray-500"
      >
        <span v-if="showPrice" class="inline-flex items-baseline gap-2">
          <span
            v-if="watchItem.isOnPromotion"
            class="text-sm md:text-base font-normal text-gray-400 line-through"
          >
            {{ formatPrice(watchItem.price) }}
          </span>
          <span class="text-base md:text-xl lg:text-2xl font-bold text-primary">
            {{ formatPrice(watchItem.effectivePrice ?? watchItem.price) }}
          </span>
        </span>
        <span
          v-if="catalogDisplay.showResaleFields && (watchItem.contenu || watchItem.details?.content)"
          class="hidden md:inline bg-cream-200 px-1.5 md:px-2 py-0.5 md:py-1 rounded text-[10px] md:text-xs text-black"
        >
          {{ watchItem.contenu || watchItem.details?.content }}
        </span>
        <span v-if="showInlineYear" class="font-medium ml-auto">
          {{ watchItem.year }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch as vueWatch } from 'vue'
import { ChevronLeft, ChevronRight } from '@lucide/vue'
import WatchImageSwipeCarousel from '@/components/watch/WatchImageSwipeCarousel.vue'
import {
  DESKTOP_HOVER_SECOND_IMAGE_MQ,
  WATCH_CARD_MAX_IMAGES,
} from '@/constants/watchCardDefaults.js'
import {
  watchCardImageUrl,
  buildWatchCardSrcSet,
  WATCH_CARD_IMAGE_SIZES,
} from '@/utils/watchImageUrl.js'
import { getSiteConfig } from '@/site/getSiteConfig.js'
import { isWatchOutOfStock } from '@/site/watchCatalogDisplay.js'
import { formatPrice } from '@/utils/formatters.js'
import { t } from '@/i18n'

const site = getSiteConfig()
const catalogDisplay = site.watchCatalog.display

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

const watchItem = computed(() => props.watch)

const effectiveShowReference = computed(
  () => props.showReference && catalogDisplay.showReference,
)

const effectiveShowSoldBadge = computed(
  () => props.showSoldBadge && catalogDisplay.showSoldBadge,
)

const isOutOfStock = computed(() => isWatchOutOfStock(site, watchItem.value))

const showCornerYearBadge = computed(
  () =>
    catalogDisplay.showResaleFields &&
    catalogDisplay.yearBadgePosition === 'corner' &&
    Boolean(watchItem.value.year),
)

const showInlineYear = computed(
  () =>
    catalogDisplay.showResaleFields &&
    catalogDisplay.yearBadgePosition !== 'corner' &&
    Boolean(watchItem.value.year),
)

const currentImageIndex = ref(0)
const imageCarouselRef = ref(null)
const warmedNavIndices = ref([0, 1])
const navImageRefs = ref([])
const decodedNavIndices = new Set()
const isHoveringSecond = ref(false)
const isDesktopViewport = ref(false)

let desktopHoverMq = null

const hasSecondImage = computed(() => (props.watch.images?.length ?? 0) > 1)

const effectiveShowImageNavigation = computed(
  () => props.showImageNavigation && !props.hoverSecondImage,
)

const navigableImages = computed(() => {
  const images = props.watch.images ?? []
  if (!effectiveShowImageNavigation.value) return images
  return images.slice(0, WATCH_CARD_MAX_IMAGES)
})

const hasMultipleNavigableImages = computed(() => navigableImages.value.length > 1)

function resolveDisplayUrl(url) {
  return watchCardImageUrl(url) ?? url
}

const firstImageSrc = computed(() => resolveImageSrc(props.watch.images?.[0] ?? ''))
const firstImageSrcSet = computed(() => buildWatchCardSrcSet(props.watch.images?.[0] ?? ''))
const secondImageSrc = computed(() => resolveImageSrc(props.watch.images?.[1] ?? ''))

function resolveImageSrc(url) {
  return resolveDisplayUrl(url) ?? ''
}

function navImageLoading(index) {
  if (index === 0) return props.imageLoading
  return warmedNavIndices.value.includes(index) ? 'eager' : 'lazy'
}

function warmNavIndex(index) {
  if (index < 0 || index >= navigableImages.value.length) return
  if (!warmedNavIndices.value.includes(index)) {
    warmedNavIndices.value = [...warmedNavIndices.value, index]
  }
}

function warmNavigableImages() {
  if (!effectiveShowImageNavigation.value) return
  warmedNavIndices.value = navigableImages.value.map((_, index) => index)
}

function setNavImageRef(el, index) {
  if (el) {
    navImageRefs.value[index] = el
    if (el.complete) {
      revealImage(index)
    }
  } else {
    delete navImageRefs.value[index]
  }
}

function waitForNavImageLoad(el) {
  return new Promise((resolve) => {
    if (el.complete) {
      resolve()
      return
    }
    const onDone = () => {
      el.removeEventListener('load', onDone)
      el.removeEventListener('error', onDone)
      resolve()
    }
    el.addEventListener('load', onDone)
    el.addEventListener('error', onDone)
  })
}

function preloadNavImageFallback(index) {
  const url = resolveImageSrc(navigableImages.value[index] ?? '')
  if (!url) return Promise.resolve(null)

  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = url
  })
}

async function revealImage(index) {
  if (currentImageIndex.value !== index) return

  const cachedEl = navImageRefs.value[index]
  if (decodedNavIndices.has(index) && cachedEl?.complete) {
    return
  }

  let el = cachedEl

  if (!el) {
    el = await preloadNavImageFallback(index)
    if (currentImageIndex.value !== index) return
  } else {
    await waitForNavImageLoad(el)
    if (currentImageIndex.value !== index) return
  }

  if (el && !decodedNavIndices.has(index) && typeof el.decode === 'function') {
    try {
      await el.decode()
    } catch {
      // Decode when available; reveal even if decode fails
    }
    decodedNavIndices.add(index)
  }
}

function onNavImageLoad(index) {
  revealImage(index)
}

function warmAdjacentImages(index) {
  warmNavIndex(index)
  warmNavIndex(index - 1)
  warmNavIndex(index + 1)
}

function onCarouselIndexChange(index) {
  warmAdjacentImages(index)
  revealImage(index)
}

function goToImage(index) {
  const images = navigableImages.value
  if (index < 0 || index >= images.length || index === currentImageIndex.value) return
  imageCarouselRef.value?.goToIndex(index)
}

function onHoverSecondEnter() {
  if (!props.hoverSecondImage || !isDesktopViewport.value || !hasSecondImage.value) return
  isHoveringSecond.value = true
}

function onHoverSecondLeave() {
  isHoveringSecond.value = false
}

function syncDesktopViewport() {
  isDesktopViewport.value = window.matchMedia(DESKTOP_HOVER_SECOND_IMAGE_MQ).matches
}

vueWatch(
  () => props.watch.id,
  () => {
    currentImageIndex.value = 0
    warmedNavIndices.value = [0, 1]
    navImageRefs.value = []
    decodedNavIndices.clear()
  },
)

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
    emit('viewDetails', props.watch)
  }
}

</script>

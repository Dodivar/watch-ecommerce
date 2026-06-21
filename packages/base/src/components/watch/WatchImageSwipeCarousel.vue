<template>
  <div
    ref="containerRef"
    class="relative h-full w-full overflow-hidden"
    @touchstart.passive="onTouchStart"
    @touchmove="onTouchMove"
    @touchend="onTouchEnd"
    @touchcancel="onTouchEnd"
  >
    <div class="flex h-full touch-pan-y" :style="trackStyle">
      <div
        v-for="(image, index) in images"
        :key="slideKey(image, index)"
        class="h-full w-full shrink-0 grow-0 basis-full"
      >
        <slot
          name="slide"
          :image="image"
          :index="index"
          :is-active="currentIndex === index"
        >
          <img
            :src="image"
            :alt="slideAlt(image, index)"
            class="pointer-events-none h-full w-full object-cover object-center"
          />
        </slot>
      </div>
    </div>

    <slot
      name="overlay"
      :current-index="currentIndex"
      :image-count="images.length"
      :next-image="nextImage"
      :previous-image="previousImage"
      :go-to-index="goToIndex"
    />

    <template v-if="showNavigation && images.length > 1">
      <button
        type="button"
        :aria-label="previousLabel"
        class="absolute top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition-all duration-200 hover:bg-black/70"
        :class="[prevNavigationClass, navigationButtonClass]"
        @click.stop="() => previousImage()"
      >
        <slot name="prev-icon">
          <ChevronLeft class="h-5 w-5" :stroke-width="2" />
        </slot>
      </button>

      <button
        type="button"
        :aria-label="nextLabel"
        class="absolute top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition-all duration-200 hover:bg-black/70"
        :class="[nextNavigationClass, navigationButtonClass]"
        @click.stop="() => nextImage()"
      >
        <slot name="next-icon">
          <ChevronRight class="h-5 w-5" :stroke-width="2" />
        </slot>
      </button>
    </template>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { ChevronLeft, ChevronRight } from '@lucide/vue'
import { useWatchImageSwipe } from '@/composables/useWatchImageSwipe.js'

const props = defineProps({
  images: {
    type: Array,
    default: () => [],
  },
  modelValue: {
    type: Number,
    default: 0,
  },
  showNavigation: {
    type: Boolean,
    default: true,
  },
  navigationButtonClass: {
    type: String,
    default: '',
  },
  prevNavigationClass: {
    type: String,
    default: 'left-2',
  },
  nextNavigationClass: {
    type: String,
    default: 'right-2',
  },
  slideKeyFn: {
    type: Function,
    default: null,
  },
  slideAltFn: {
    type: Function,
    default: null,
  },
  previousLabel: {
    type: String,
    default: 'Image précédente',
  },
  nextLabel: {
    type: String,
    default: 'Image suivante',
  },
})

const emit = defineEmits(['update:modelValue', 'index-change'])

const containerRef = ref(null)
const currentIndex = ref(Number.isFinite(props.modelValue) ? props.modelValue : 0)
const imageCount = computed(() => props.images.length)

watch(
  () => props.modelValue,
  (value) => {
    const normalized = Number.isFinite(value) ? value : 0
    if (normalized !== currentIndex.value) {
      currentIndex.value = normalized
    }
  },
)

function emitIndexChange(index) {
  emit('update:modelValue', index)
  emit('index-change', index)
}

const {
  trackStyle,
  nextImage,
  previousImage,
  goToIndex,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
} = useWatchImageSwipe({
  imageCount,
  containerRef,
  currentIndex,
  onIndexChange: emitIndexChange,
})

function slideKey(image, index) {
  return props.slideKeyFn ? props.slideKeyFn(image, index) : index
}

function slideAlt(image, index) {
  return props.slideAltFn ? props.slideAltFn(image, index) : `Image ${index + 1}`
}

defineExpose({
  nextImage,
  previousImage,
  goToIndex,
})
</script>

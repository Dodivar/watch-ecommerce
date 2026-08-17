<template>
  <div
    ref="containerRef"
    class="zoomable-image flex h-full w-full items-center justify-center"
    :class="{ 'is-zoomed': isZoomed }"
    @touchstart="onTouchStart"
    @touchmove="onTouchMove"
    @touchend="onTouchEnd"
    @touchcancel="onTouchEnd"
    @dblclick="onDoubleClick"
  >
    <img
      ref="imageRef"
      :src="src"
      :alt="alt"
      :style="transformStyle"
      class="max-h-full max-w-full select-none object-contain"
      draggable="false"
      @load="onImageLoad"
    />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useImagePinchZoom } from '@/composables/useImagePinchZoom.js'

const props = defineProps({
  src: {
    type: String,
    required: true,
  },
  alt: {
    type: String,
    default: '',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  maxScale: {
    type: Number,
    default: 4,
  },
})

const emit = defineEmits(['update:zoomed'])

const containerRef = ref(null)
const imageRef = ref(null)

const {
  isZoomed,
  transformStyle,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  onDoubleClick,
  reset,
} = useImagePinchZoom({
  containerRef,
  imageRef,
  maxScale: props.maxScale,
})

function onImageLoad() {
  reset()
}

watch(isZoomed, (zoomed) => {
  emit('update:zoomed', zoomed)
})

watch(
  () => props.isActive,
  (active) => {
    if (!active && isZoomed.value) {
      reset()
      emit('update:zoomed', false)
    }
  },
)

watch(
  () => props.src,
  () => {
    reset()
    emit('update:zoomed', false)
  },
)

defineExpose({ reset, isZoomed })
</script>

<style scoped>
.zoomable-image {
  /* Toutes les gestuelles sont pilotées en JS : on neutralise celles du navigateur
     (double-tap zoom, pinch page) pour éviter les conflits avec le carrousel. */
  touch-action: none;
  -webkit-user-select: none;
  user-select: none;
  -webkit-touch-callout: none;
  overflow: hidden;
}

.zoomable-image.is-zoomed {
  cursor: zoom-out;
}
</style>

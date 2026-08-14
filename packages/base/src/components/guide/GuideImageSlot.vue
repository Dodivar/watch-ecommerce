<template>
  <div class="relative overflow-hidden rounded-2xl ring-1 ring-black/5 shadow-md w-full bg-cream-100"
    :class="[
      variant === 'banner' ? 'aspect-[21/9] max-h-64 sm:max-h-72' : 'aspect-[16/10]',
      $attrs.class,
    ]"
  >
    <img
      v-if="image.src"
      :src="image.src"
      :alt="image.alt || image.placeholderLabel || ''"
      class="absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-300"
      :class="showImage ? 'opacity-100' : 'opacity-0'"
      loading="lazy"
      @load="onImageLoad"
      @error="onImageError"
    />
    <div
      v-if="!showImage"
      class="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center border-2 border-dashed border-cream-300"
    >
      <svg
        class="h-10 w-10 text-primary/30"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="1.5"
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
      <p class="text-sm font-medium text-subtle max-w-xs">
        {{ image.placeholderLabel || 'Illustration à venir' }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  image: {
    type: Object,
    required: true,
  },
  variant: {
    type: String,
    default: 'inline',
  },
})

defineOptions({
  inheritAttrs: false,
})

const showImage = ref(false)

watch(
  () => props.image?.src,
  () => {
    showImage.value = false
  },
)

function onImageLoad() {
  showImage.value = true
}

function onImageError() {
  showImage.value = false
}
</script>

<script>
export default {
  name: 'GuideImageSlot',
}
</script>

<script setup>
import { computed } from 'vue'

import { DEFAULT_ICON_PROPS, resolveIcon } from '@/icons/iconRegistry.js'

const props = defineProps({
  name: {
    type: String,
    required: true,
  },
  class: {
    type: String,
    default: 'h-5 w-5',
  },
  strokeWidth: {
    type: [Number, String],
    default: DEFAULT_ICON_PROPS.strokeWidth,
  },
})

const icon = computed(() => resolveIcon(props.name))
</script>

<template>
  <component :is="icon" :class="props.class" :stroke-width="strokeWidth" aria-hidden="true" />
</template>

<script setup>
import { computed } from 'vue'
import { parseLegalInline } from './parseLegalInline.js'

const props = defineProps({
  text: { type: String, required: true },
})

const segments = computed(() => parseLegalInline(props.text))
</script>

<template>
  <template v-for="(segment, i) in segments" :key="i">
    <strong v-if="segment.type === 'bold'">{{ segment.text }}</strong>
    <a
      v-else-if="segment.type === 'link'"
      :href="segment.href"
      class="font-medium text-primary underline decoration-primary/40 hover:text-primary-hover"
      :target="segment.href.startsWith('mailto:') ? undefined : '_blank'"
      :rel="segment.href.startsWith('mailto:') ? undefined : 'noopener noreferrer'"
      >{{ segment.text }}</a
    >
    <template v-else>{{ segment.text }}</template>
  </template>
</template>

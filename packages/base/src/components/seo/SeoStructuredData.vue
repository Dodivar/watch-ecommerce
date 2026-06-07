<script setup>
import { computed } from 'vue'
import { useHead } from '@vueuse/head'

const props = defineProps({
  /** Un ou plusieurs schémas schema.org (objets JSON-LD). */
  schemas: {
    type: [Object, Array],
    default: () => [],
  },
})

const normalizedSchemas = computed(() => {
  if (!props.schemas) return []
  return Array.isArray(props.schemas) ? props.schemas.filter(Boolean) : [props.schemas]
})

useHead({
  script: computed(() =>
    normalizedSchemas.value.map((data) => ({
      type: 'application/ld+json',
      children: JSON.stringify(data),
    })),
  ),
})
</script>

<template>
  <span class="sr-only" aria-hidden="true" />
</template>

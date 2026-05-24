<script setup>
import AppIcon from '@/components/ui/AppIcon.vue'

defineProps({
  name: {
    type: String,
    default: 'mechanics',
  },
})
</script>

<template>
  <AppIcon :name="name" class="h-7 w-7" />
</template>

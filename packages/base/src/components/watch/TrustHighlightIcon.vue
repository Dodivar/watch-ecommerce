<script setup>
import AppIcon from '@/components/ui/AppIcon.vue'

defineProps({
  name: {
    type: String,
    default: 'shield',
  },
})
</script>

<template>
  <AppIcon :name="name" />
</template>

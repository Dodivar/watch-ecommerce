<script setup>
import AppIcon from '@/components/ui/AppIcon.vue'

defineProps({
  name: {
    type: String,
    default: 'default',
  },
})
</script>

<template>
  <AppIcon :name="name" class="h-6 w-6" />
</template>

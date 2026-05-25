<script setup>
import { computed } from 'vue'
import AdminHeader from './AdminHeader.vue'
import AdminNav from './AdminNav.vue'

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  showBackButton: {
    type: Boolean,
    default: false,
  },
  backButtonText: {
    type: String,
    default: 'Tableau de bord',
  },
  backButtonRoute: {
    type: String,
    default: '/admin',
  },
  /** Classes Tailwind pour limiter la largeur du contenu sous le menu (ex. max-w-3xl). */
  contentClass: {
    type: String,
    default: '',
  },
})

const contentClasses = computed(() => {
  if (!props.contentClass) return ''
  const parts = props.contentClass.split(/\s+/).filter(Boolean)
  if (!parts.includes('mx-auto')) parts.push('mx-auto')
  if (!parts.includes('w-full')) parts.push('w-full')
  return parts.join(' ')
})
</script>

<template>
  <div class="min-h-screen bg-cream py-8 px-4 sm:px-6 lg:px-8">
    <div class="max-w-7xl mx-auto w-full">
      <AdminHeader
        :title="title"
        :show-back-button="showBackButton"
        :back-button-text="backButtonText"
        :back-button-route="backButtonRoute"
      />
      <AdminNav />
      <div :class="contentClasses">
        <slot />
      </div>
    </div>
  </div>
</template>

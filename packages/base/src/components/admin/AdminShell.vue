<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ChevronLeft, Menu } from '@lucide/vue'
import AdminSidebar from './AdminSidebar.vue'

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
  /** Sous-titre affiché sous le titre (ex. date du jour). */
  subtitle: {
    type: String,
    default: '',
  },
})

const router = useRouter()
const sidebarOpen = ref(false)

const contentClasses = computed(() => {
  if (!props.contentClass) return ''
  const parts = props.contentClass.split(/\s+/).filter(Boolean)
  if (!parts.includes('mx-auto')) parts.push('mx-auto')
  if (!parts.includes('w-full')) parts.push('w-full')
  return parts.join(' ')
})
</script>

<template>
  <div class="flex h-screen flex-col overflow-hidden bg-cream lg:flex-row">
    <AdminSidebar :open="sidebarOpen" @close="sidebarOpen = false" />

    <div class="flex-1 min-h-0 min-w-0 flex flex-col overflow-hidden">
      <div class="flex-1 min-h-0 overflow-y-auto overscroll-contain">
        <div class="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
          <nav v-if="showBackButton" class="mb-4">
            <button
              type="button"
              class="group inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 shadow-sm hover:border-gray-300 hover:bg-cream hover:text-gray-900 transition-colors"
              :aria-label="`Retour à ${backButtonText}`"
              @click="router.push(backButtonRoute)"
            >
              <ChevronLeft
                class="h-4 w-4 shrink-0 text-gray-400 transition-transform group-hover:-translate-x-0.5 group-hover:text-gray-600"
                :stroke-width="2"
              />
              <span>Retour</span>
              <span class="hidden sm:inline text-gray-300" aria-hidden="true">·</span>
              <span class="hidden sm:inline text-gray-700">{{ backButtonText }}</span>
            </button>
          </nav>
          <div class="flex flex-wrap items-center gap-4 mb-6">
            <button
              type="button"
              class="p-2 -ml-2 text-gray-600 hover:text-gray-900 rounded-lg lg:hidden"
              aria-label="Ouvrir le menu"
              @click="sidebarOpen = true"
            >
              <Menu class="w-6 h-6" :stroke-width="2" />
            </button>
            <div class="flex-1 min-w-0">
              <h1 class="text-2xl font-bold text-text-main truncate">{{ title }}</h1>
              <p v-if="subtitle" class="mt-0.5 text-sm text-gray-500">{{ subtitle }}</p>
            </div>
            <div v-if="$slots.actions" class="flex flex-wrap items-center gap-2 shrink-0">
              <slot name="actions" />
            </div>
          </div>
          <div v-if="$slots['below-header']" class="mb-8">
            <slot name="below-header" />
          </div>
          <div :class="contentClasses">
            <slot />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

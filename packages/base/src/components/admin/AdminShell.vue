<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Menu } from '@lucide/vue'
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
          <div class="flex items-center gap-4 mb-8">
            <button
              type="button"
              class="p-2 -ml-2 text-gray-600 hover:text-gray-900 rounded-lg lg:hidden"
              aria-label="Ouvrir le menu"
              @click="sidebarOpen = true"
            >
              <Menu class="w-6 h-6" :stroke-width="2" />
            </button>
            <h1 class="text-2xl font-bold text-text-main flex-1 min-w-0 truncate">{{ title }}</h1>
            <button
              v-if="showBackButton"
              @click="router.push(backButtonRoute)"
              class="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-cream-100 rounded-lg transition-colors shrink-0"
            >
              {{ backButtonText }}
            </button>
          </div>
          <div :class="contentClasses">
            <slot />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

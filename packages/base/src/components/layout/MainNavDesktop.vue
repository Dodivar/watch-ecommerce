<script setup>
import { ref, computed, onMounted } from 'vue'
import MainNavMegaMenuPanel from '@/components/layout/MainNavMegaMenuPanel.vue'
import { navigationUsesCatalogBrands } from '@/site/mainNavigation.js'
import { prefetchCatalogBrands } from '@/composables/useCatalogBrands.js'

const props = defineProps({
  features: { type: Object, required: true },
  isAdmin: { type: Boolean, required: true },
  navItems: { type: Array, required: true },
})

const openMegaMenuIndex = ref(null)
let closeTimer = null

const activeMegaMenuItem = computed(() => {
  if (openMegaMenuIndex.value === null) return null
  const item = props.navItems[openMegaMenuIndex.value]
  return item?.type === 'megaMenu' ? item : null
})

onMounted(() => {
  if (!props.isAdmin && navigationUsesCatalogBrands(props.navItems)) {
    prefetchCatalogBrands()
  }
})

function openMegaMenu(index) {
  clearCloseTimer()
  openMegaMenuIndex.value = index
}

function scheduleCloseMegaMenu() {
  clearCloseTimer()
  closeTimer = setTimeout(() => {
    openMegaMenuIndex.value = null
  }, 150)
}

function clearCloseTimer() {
  if (closeTimer) {
    clearTimeout(closeTimer)
    closeTimer = null
  }
}

function closeMegaMenu() {
  clearCloseTimer()
  openMegaMenuIndex.value = null
}
</script>

<template>
  <div class="hidden md:block">
    <div class="ml-10 flex items-baseline space-x-8">
      <template v-if="isAdmin && features.admin">
        <RouterLink
          v-if="features.collection"
          to="/collection"
          class="text-text-main hover:text-primary transition-colors"
          >Nos montres</RouterLink
        >
        <RouterLink to="/admin" class="text-text-main hover:text-primary transition-colors"
          >Tableau de bord</RouterLink
        >
        <RouterLink
          v-if="features.blog"
          to="/admin/articles"
          class="text-text-main hover:text-primary transition-colors"
          >Articles</RouterLink
        >
      </template>
      <template v-else>
        <template v-for="(item, idx) in navItems" :key="'nav-' + idx + '-' + item.type">
          <RouterLink
            v-if="item.type === 'link'"
            :to="item.to"
            class="text-text-main hover:text-primary transition-colors"
            >{{ item.label }}</RouterLink
          >
          <div
            v-else-if="item.type === 'megaMenu'"
            class="relative"
            @mouseenter="openMegaMenu(idx)"
            @mouseleave="scheduleCloseMegaMenu"
          >
            <div
              class="text-text-main hover:text-primary transition-colors flex items-center"
              :class="{ 'text-primary': openMegaMenuIndex === idx }"
            >
              <RouterLink :to="item.to" class="hover:text-primary transition-colors">{{
                item.label
              }}</RouterLink>
              <svg
                class="w-4 h-4 ml-1 shrink-0 pointer-events-none transition-transform"
                :class="{ 'rotate-180': openMegaMenuIndex === idx }"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
          <div v-else-if="item.type === 'group'" class="relative group">
            <div class="text-text-main hover:text-primary transition-colors flex items-center">
              <RouterLink
                v-if="item.to"
                :to="item.to"
                class="hover:text-primary transition-colors"
                >{{ item.label }}</RouterLink
              >
              <span v-else class="cursor-default">{{ item.label }}</span>
              <svg
                class="w-4 h-4 ml-1 shrink-0 pointer-events-none"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
            <div
              class="absolute left-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-30"
            >
              <RouterLink
                v-for="(sub, j) in item.items"
                :key="'sub-' + j + '-' + sub.to"
                :to="sub.to"
                class="block px-4 py-2 text-sm text-gray-700 hover:text-primary hover:bg-primary/10"
                >{{ sub.label }}</RouterLink
              >
            </div>
          </div>
        </template>
      </template>
    </div>

    <MainNavMegaMenuPanel
      v-if="activeMegaMenuItem"
      :item="activeMegaMenuItem"
      :visible="openMegaMenuIndex !== null"
      @mouseenter="clearCloseTimer"
      @mouseleave="scheduleCloseMegaMenu"
      @backdrop-click="closeMegaMenu"
    />
  </div>
</template>

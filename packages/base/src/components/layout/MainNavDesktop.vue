<script setup>
import { ref, computed, onMounted } from 'vue'
import { ChevronDown } from '@lucide/vue'
import MainNavMegaMenuPanel from '@/components/layout/MainNavMegaMenuPanel.vue'
import { navigationUsesCatalogBrands, navigationUsesMenuCampaigns } from '@/site/mainNavigation.js'
import { prefetchCatalogBrands } from '@/composables/useCatalogBrands.js'
import { prefetchMenuCampaigns } from '@/composables/useMenuCampaigns.js'

const props = defineProps({
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
  if (navigationUsesCatalogBrands(props.navItems)) {
    prefetchCatalogBrands()
  }
  if (navigationUsesMenuCampaigns(props.navItems)) {
    prefetchMenuCampaigns()
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
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-300 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-none"
      >
        <div
          v-if="openMegaMenuIndex !== null"
          class="fixed inset-0 z-10 bg-black/30"
          aria-hidden="true"
          @click="closeMegaMenu"
        />
      </Transition>
    </Teleport>

    <div class="ml-10 flex items-baseline space-x-8">
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
            <ChevronDown
              class="w-4 h-4 ml-1 shrink-0 pointer-events-none transition-transform"
              :class="{ 'rotate-180': openMegaMenuIndex === idx }"
              :stroke-width="2"
            />
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
            <ChevronDown class="w-4 h-4 ml-1 shrink-0 pointer-events-none" :stroke-width="2" />
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
    </div>

    <MainNavMegaMenuPanel
      v-if="activeMegaMenuItem"
      :item="activeMegaMenuItem"
      :visible="openMegaMenuIndex !== null"
      @mouseenter="clearCloseTimer"
      @mouseleave="scheduleCloseMegaMenu"
    />
  </div>
</template>

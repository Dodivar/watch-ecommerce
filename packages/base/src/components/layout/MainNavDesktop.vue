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
          class="scrim-light fixed inset-0 z-10"
          aria-hidden="true"
          @click="closeMegaMenu"
        />
      </Transition>
    </Teleport>

    <!-- Marges resserrées au point de bascule `md` : au-delà de 7 entrées, la
         barre débordait de quelques pixels à 768 px. -->
    <div class="ml-6 flex items-baseline space-x-6 lg:ml-10 lg:space-x-8">
      <template v-for="(item, idx) in navItems" :key="'nav-' + idx + '-' + item.type">
        <RouterLink
          v-if="item.type === 'link'"
          :to="item.to"
          class="nav-link"
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
            class="absolute left-0 mt-2 w-48 overflow-hidden rounded-md bg-white shadow-lg ring-1 ring-border-subtle opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-30"
          >
            <RouterLink
              v-for="(sub, j) in item.items"
              :key="'sub-' + j + '-' + sub.to"
              :to="sub.to"
              class="block px-4 py-2 text-sm text-text-main/85 transition-colors hover:bg-primary-tint hover:text-primary"
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

<style scoped>
/*
  Navigation : le survol et l'état actif sont signalés par un filet vert qui se
  déploie sous le libellé — plus discret qu'un aplat, cohérent avec `.link-forest`.
  L'état actif reste visible en permanence.
*/
.nav-link {
  position: relative;
  color: var(--color-text-main);
  transition: color 200ms ease;
}

.nav-link::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -0.375rem;
  height: 2px;
  border-radius: 2px;
  background-image: var(--gradient-cta);
  transform: scaleX(0);
  transform-origin: left center;
  transition: transform 260ms cubic-bezier(0.22, 1, 0.36, 1);
}

/*
  `:not([href*='#'])` : les entrées qui pointent vers une ancre de la page
  courante (ex. « FAQ » → `/#faq`) sont considérées actives par vue-router dès
  qu'on est sur cette page. Les exclure évite un soulignement permanent qui ne
  signale aucune navigation.
*/
.nav-link:hover,
.nav-link:focus-visible,
.nav-link.router-link-active:not([href*='#']) {
  color: var(--color-primary);
}

.nav-link:hover::after,
.nav-link:focus-visible::after,
.nav-link.router-link-active:not([href*='#'])::after {
  transform: scaleX(1);
}

@media (prefers-reduced-motion: reduce) {
  .nav-link::after {
    transition: none;
  }
}
</style>

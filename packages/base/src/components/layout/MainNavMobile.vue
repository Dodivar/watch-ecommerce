<script setup>
import { ref, watch, onMounted } from 'vue'
import { ChevronDown, ShoppingBag, X } from '@lucide/vue'
import { useCart } from '@/composables/useCart.js'
import { slugifyBrand } from '@/utils/brandSlug'
import { useCatalogBrands, prefetchCatalogBrands } from '@/composables/useCatalogBrands.js'
import { navigationUsesCatalogBrands } from '@/site/mainNavigation.js'

const props = defineProps({
  features: { type: Object, required: true },
  isAdmin: { type: Boolean, required: true },
  navItems: { type: Array, required: true },
  logoSrc: { type: String, required: true },
  logoAlt: { type: String, required: true },
  purchaseEnabled: { type: Boolean, default: false },
})

const open = defineModel('open', { type: Boolean, default: false })

const { badgeLabel, toggleDrawer } = useCart()
const { brands, isLoading, error, load } = useCatalogBrands()

const expandedMegaMenuIndex = ref(null)

watch(open, (isOpen) => {
  if (!isOpen) {
    expandedMegaMenuIndex.value = null
  }
})

onMounted(() => {
  if (!props.isAdmin && navigationUsesCatalogBrands(props.navItems)) {
    prefetchCatalogBrands()
  }
})

function close() {
  open.value = false
}

function openCartFromMenu() {
  toggleDrawer()
  open.value = false
}

function toggleMegaMenu(index, item) {
  if (expandedMegaMenuIndex.value === index) {
    expandedMegaMenuIndex.value = null
    return
  }
  expandedMegaMenuIndex.value = index
  if (item.columns?.some((column) => column.source === 'brands')) {
    load()
  }
}

function brandRoute(brandName) {
  return { path: '/collection', query: { marque: slugifyBrand(brandName) } }
}
</script>

<template>
  <Transition
    enter-active-class="transition-opacity duration-300"
    leave-active-class="transition-opacity duration-300"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-show="open"
      class="fixed inset-0 bg-primary z-30 flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-label="Menu principal"
    >
      <div class="absolute top-6 right-6 flex items-center gap-2">
        <button
          v-if="purchaseEnabled"
          type="button"
          class="relative p-2 text-white hover:bg-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/80"
          aria-label="Ouvrir le panier"
          @click="openCartFromMenu"
        >
          <ShoppingBag class="w-8 h-8" :stroke-width="2" />
          <span
            v-if="badgeLabel"
            class="absolute -top-0.5 -right-0.5 min-h-[1.125rem] min-w-[1.125rem] px-1 flex items-center justify-center rounded-full bg-white text-[10px] font-bold text-primary leading-none"
          >
            {{ badgeLabel }}
          </span>
        </button>
        <button
          type="button"
          @click="close"
          class="text-white focus:outline-none p-2"
          aria-label="Fermer le menu"
        >
          <X class="w-8 h-8" :stroke-width="2" />
        </button>
      </div>
      <nav
        class="flex flex-col items-center justify-center flex-1 space-y-8 text-xl font-semibold text-white w-screen px-4 overflow-y-auto py-24"
      >
        <RouterLink to="/" @click="close">
          <img width="100" :src="logoSrc" :alt="logoAlt" />
        </RouterLink>
        <template v-if="isAdmin && features.admin">
          <RouterLink
            v-if="features.collection"
            to="/collection"
            @click="close"
            class="hover:text-cream-100 transition-colors"
            >Nos montres</RouterLink
          >
          <RouterLink to="/admin" @click="close" class="hover:text-cream-100 transition-colors"
            >Tableau de bord</RouterLink
          >
          <RouterLink to="/admin/orders" @click="close" class="hover:text-cream-100 transition-colors"
            >Commandes</RouterLink
          >
          <RouterLink to="/admin/leads" @click="close" class="hover:text-cream-100 transition-colors"
            >Messages</RouterLink
          >
          <RouterLink
            v-if="features.blog"
            to="/admin/articles"
            @click="close"
            class="hover:text-cream-100 transition-colors"
            >Articles</RouterLink
          >
        </template>
        <template v-else>
          <template v-for="(item, idx) in navItems" :key="'mnav-' + idx + '-' + item.type">
            <RouterLink
              v-if="item.type === 'link'"
              :to="item.to"
              @click="close"
              class="hover:text-cream-100 transition-colors text-center"
              >{{ item.label }}</RouterLink
            >
            <div
              v-else-if="item.type === 'megaMenu'"
              class="flex flex-col items-center gap-4 w-full max-w-sm"
            >
              <button
                type="button"
                class="flex items-center gap-2 hover:text-cream-100 transition-colors text-center"
                :aria-expanded="expandedMegaMenuIndex === idx"
                @click="toggleMegaMenu(idx, item)"
              >
                <span>{{ item.label }}</span>
                <ChevronDown
                  class="w-5 h-5 shrink-0 transition-transform"
                  :class="{ 'rotate-180': expandedMegaMenuIndex === idx }"
                  :stroke-width="2"
                />
              </button>

              <div
                v-if="expandedMegaMenuIndex === idx"
                class="w-full space-y-6 text-base font-normal"
              >
                <RouterLink
                  :to="item.to"
                  @click="close"
                  class="block text-center text-white/90 hover:text-cream-100 transition-colors"
                >
                  Voir toute la collection
                </RouterLink>

                <template v-for="(column, columnIndex) in item.columns" :key="'mcol-' + columnIndex">
                  <div v-if="column.source !== 'brands'" class="space-y-3">
                    <p class="text-sm font-semibold uppercase tracking-wide text-white/75 text-center">
                      {{ column.title }}
                    </p>
                    <RouterLink
                      v-for="(link, linkIndex) in column.items"
                      :key="'mlink-' + linkIndex + '-' + link.to"
                      :to="link.to"
                      @click="close"
                      class="block text-center hover:text-cream-100 transition-colors"
                    >
                      {{ link.label }}
                    </RouterLink>
                  </div>

                  <div v-else class="space-y-3">
                    <p class="text-sm font-semibold uppercase tracking-wide text-white/75 text-center">
                      {{ column.title }}
                    </p>

                    <p v-if="isLoading" class="text-center text-white/70 text-sm">Chargement…</p>
                    <p v-else-if="error" class="text-center text-white/70 text-sm">{{ error }}</p>
                    <p
                      v-else-if="brands.length === 0"
                      class="text-center text-white/70 text-sm"
                    >
                      Aucune marque disponible pour le moment.
                    </p>
                    <RouterLink
                      v-for="brandName in brands"
                      v-else
                      :key="brandName"
                      :to="brandRoute(brandName)"
                      @click="close"
                      class="block text-center hover:text-cream-100 transition-colors"
                    >
                      {{ brandName }}
                    </RouterLink>

                    <RouterLink
                      v-if="column.footerLink"
                      :to="column.footerLink.to"
                      @click="close"
                      class="block text-center text-white/90 hover:text-cream-100 transition-colors"
                    >
                      {{ column.footerLink.label }}
                    </RouterLink>
                  </div>
                </template>
              </div>
            </div>
          </template>
        </template>
      </nav>
    </div>
  </Transition>
</template>

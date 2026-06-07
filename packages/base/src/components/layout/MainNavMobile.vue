<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { ChevronRight, ChevronLeft, ShoppingBag, X, Search } from '@lucide/vue'
import { useCart } from '@/composables/useCart.js'
import { buildBrandCollectionPath } from '@/utils/collectionRoutes.js'
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

const SEARCH_THRESHOLD = 12

// Pile de navigation en drill-down. Vide = niveau racine.
// Chaque entrée : { type: 'mega' | 'brands', index } (index dans navItems).
const navStack = ref([])
const direction = ref('forward')
const brandQuery = ref('')

const currentView = computed(() => navStack.value[navStack.value.length - 1] ?? null)
const viewKey = computed(() => {
  const view = currentView.value
  return view ? `${view.type}-${view.index}` : 'root'
})
const activeItem = computed(() => {
  const view = currentView.value
  if (!view) return null
  return props.navItems[view.index] ?? null
})
const brandsColumn = computed(
  () => activeItem.value?.columns?.find((column) => column.source === 'brands') ?? null,
)
const filteredBrands = computed(() => {
  const query = brandQuery.value.trim().toLowerCase()
  if (!query) return brands.value
  return brands.value.filter((name) => name.toLowerCase().includes(query))
})

const brandScrollContainer = ref(null)

// Regroupement alphabétique activé seulement quand la liste devient longue.
const showGroupedBrands = computed(() => brands.value.length > SEARCH_THRESHOLD)

function brandFirstLetter(name) {
  const base = name.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const char = base.charAt(0).toUpperCase()
  return /[A-Z]/.test(char) ? char : '#'
}

const groupedBrands = computed(() => {
  const groups = new Map()
  for (const name of filteredBrands.value) {
    const letter = brandFirstLetter(name)
    if (!groups.has(letter)) groups.set(letter, [])
    groups.get(letter).push(name)
  }
  return [...groups.entries()]
    .sort((a, b) => a[0].localeCompare(b[0], 'fr'))
    .map(([letter, items]) => ({
      letter,
      items: [...items].sort((a, b) => a.localeCompare(b, 'fr')),
    }))
})

function scrollToLetter(letter) {
  const target = brandScrollContainer.value?.querySelector(`[data-brand-letter="${letter}"]`)
  target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

watch(open, (isOpen) => {
  if (!isOpen) {
    resetNavigation()
  }
})

onMounted(() => {
  if (!props.isAdmin && navigationUsesCatalogBrands(props.navItems)) {
    prefetchCatalogBrands()
  }
})

function resetNavigation() {
  navStack.value = []
  direction.value = 'forward'
  brandQuery.value = ''
}

function close() {
  open.value = false
}

function openCartFromMenu() {
  toggleDrawer()
  open.value = false
}

function openMega(index) {
  direction.value = 'forward'
  navStack.value = [...navStack.value, { type: 'mega', index }]
}

function openBrands(index) {
  brandQuery.value = ''
  load()
  direction.value = 'forward'
  navStack.value = [...navStack.value, { type: 'brands', index }]
}

function goBack() {
  direction.value = 'back'
  navStack.value = navStack.value.slice(0, -1)
}

function brandRoute(brandName) {
  return buildBrandCollectionPath(brandName)
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
      <div class="absolute top-6 right-6 z-10 flex items-center gap-2">
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

      <div class="relative flex-1 overflow-hidden text-white">
        <Transition :name="'mnav-slide-' + direction">
          <div :key="viewKey" class="absolute inset-0 overflow-y-auto">
            <!-- Niveau racine : liens principaux -->
            <nav
              v-if="!currentView"
              class="flex flex-col items-center justify-center min-h-full w-full px-4 py-24 space-y-8 text-xl font-semibold"
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
                <RouterLink
                  to="/admin/orders"
                  @click="close"
                  class="hover:text-cream-100 transition-colors"
                  >Commandes</RouterLink
                >
                <RouterLink
                  to="/admin/leads"
                  @click="close"
                  class="hover:text-cream-100 transition-colors"
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
                  <button
                    v-else-if="item.type === 'megaMenu'"
                    type="button"
                    class="flex items-center gap-2 hover:text-cream-100 transition-colors"
                    @click="openMega(idx)"
                  >
                    <span>{{ item.label }}</span>
                    <ChevronRight class="w-5 h-5 shrink-0" :stroke-width="2" />
                  </button>
                </template>
              </template>
            </nav>

            <!-- Niveau 1 : détail d'un mega-menu -->
            <div
              v-else-if="currentView.type === 'mega' && activeItem"
              class="flex flex-col min-h-full px-5 pt-20 pb-10"
            >
              <button
                type="button"
                class="flex items-center gap-1 -ml-1 py-2 text-sm font-medium text-white/80 hover:text-white transition-colors"
                @click="goBack"
              >
                <ChevronLeft class="w-5 h-5 shrink-0" :stroke-width="2" />
                Retour
              </button>

              <h2 class="mt-2 mb-5 text-2xl font-semibold">{{ activeItem.label }}</h2>

              <RouterLink
                :to="activeItem.to"
                @click="close"
                class="block py-3 text-base font-medium text-white/90 hover:text-cream-100 border-b border-white/10 transition-colors"
              >
                Voir toute la collection
              </RouterLink>

              <template
                v-for="(column, columnIndex) in activeItem.columns"
                :key="'mcol-' + columnIndex"
              >
                <button
                  v-if="column.source === 'brands'"
                  type="button"
                  class="flex items-center justify-between w-full py-4 text-base font-medium border-b border-white/10 hover:text-cream-100 transition-colors"
                  @click="openBrands(currentView.index)"
                >
                  <span>{{ column.title }}</span>
                  <ChevronRight class="w-5 h-5 shrink-0 text-white/60" :stroke-width="2" />
                </button>

                <div v-else class="py-4 border-b border-white/10 space-y-1">
                  <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-white/60">
                    {{ column.title }}
                  </p>
                  <RouterLink
                    v-for="(link, linkIndex) in column.items"
                    :key="'mlink-' + linkIndex + '-' + link.to"
                    :to="link.to"
                    @click="close"
                    class="block py-2.5 text-base hover:text-cream-100 transition-colors"
                  >
                    {{ link.label }}
                  </RouterLink>
                </div>
              </template>
            </div>

            <!-- Niveau 2 : liste complète des marques -->
            <div
              v-else-if="currentView.type === 'brands' && brandsColumn"
              class="flex flex-col h-full px-5 pt-20 pb-6"
            >
              <button
                type="button"
                class="flex items-center gap-1 -ml-1 py-2 text-sm font-medium text-white/80 hover:text-white transition-colors shrink-0"
                @click="goBack"
              >
                <ChevronLeft class="w-5 h-5 shrink-0" :stroke-width="2" />
                Retour
              </button>

              <h2 class="mt-2 mb-4 text-2xl font-semibold shrink-0">{{ brandsColumn.title }}</h2>

              <div v-if="brands.length > SEARCH_THRESHOLD" class="relative mb-4 shrink-0">
                <Search
                  class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50"
                  :stroke-width="2"
                />
                <input
                  v-model="brandQuery"
                  type="search"
                  inputmode="search"
                  placeholder="Rechercher une marque"
                  aria-label="Rechercher une marque"
                  class="w-full rounded-lg bg-white/10 py-2.5 pl-10 pr-3 text-base text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/60"
                />
              </div>

              <div class="relative flex-1 min-h-0">
                <div ref="brandScrollContainer" class="h-full overflow-y-auto pr-7">
                  <p v-if="isLoading" class="py-3 text-white/70 text-sm">Chargement…</p>
                  <p v-else-if="error" class="py-3 text-white/70 text-sm">{{ error }}</p>
                  <p v-else-if="brands.length === 0" class="py-3 text-white/70 text-sm">
                    Aucune marque disponible pour le moment.
                  </p>
                  <p v-else-if="filteredBrands.length === 0" class="py-3 text-white/70 text-sm">
                    Aucune marque ne correspond à « {{ brandQuery }} ».
                  </p>

                  <template v-else-if="showGroupedBrands">
                    <div
                      v-for="group in groupedBrands"
                      :key="'mbrandgroup-' + group.letter"
                      :data-brand-letter="group.letter"
                    >
                      <p
                        class="sticky top-0 bg-primary py-1.5 text-xs font-semibold uppercase tracking-wide text-white/60"
                      >
                        {{ group.letter }}
                      </p>
                      <RouterLink
                        v-for="brandName in group.items"
                        :key="brandName"
                        :to="brandRoute(brandName)"
                        @click="close"
                        class="block py-3 text-base border-b border-white/10 hover:text-cream-100 transition-colors"
                      >
                        {{ brandName }}
                      </RouterLink>
                    </div>
                  </template>

                  <template v-else>
                    <RouterLink
                      v-for="brandName in filteredBrands"
                      :key="brandName"
                      :to="brandRoute(brandName)"
                      @click="close"
                      class="block py-3 text-base border-b border-white/10 hover:text-cream-100 transition-colors"
                    >
                      {{ brandName }}
                    </RouterLink>
                  </template>
                </div>

                <div
                  v-if="showGroupedBrands && groupedBrands.length > 1"
                  class="absolute right-0 top-0 bottom-0 flex flex-col items-center justify-center gap-0.5"
                  aria-hidden="true"
                >
                  <button
                    v-for="group in groupedBrands"
                    :key="'mrail-' + group.letter"
                    type="button"
                    tabindex="-1"
                    class="px-1 text-[10px] font-semibold leading-none text-white/50 hover:text-white transition-colors"
                    @click="scrollToLetter(group.letter)"
                  >
                    {{ group.letter }}
                  </button>
                </div>
              </div>

              <RouterLink
                v-if="brandsColumn.footerLink"
                :to="brandsColumn.footerLink.to"
                @click="close"
                class="block shrink-0 pt-4 text-base font-medium text-white/90 hover:text-cream-100 transition-colors"
              >
                {{ brandsColumn.footerLink.label }}
              </RouterLink>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.mnav-slide-forward-enter-active,
.mnav-slide-forward-leave-active,
.mnav-slide-back-enter-active,
.mnav-slide-back-leave-active {
  transition:
    transform 0.28s ease,
    opacity 0.28s ease;
}

.mnav-slide-forward-enter-from {
  transform: translateX(100%);
}

.mnav-slide-forward-leave-to {
  transform: translateX(-25%);
  opacity: 0;
}

.mnav-slide-back-enter-from {
  transform: translateX(-100%);
}

.mnav-slide-back-leave-to {
  transform: translateX(25%);
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .mnav-slide-forward-enter-active,
  .mnav-slide-forward-leave-active,
  .mnav-slide-back-enter-active,
  .mnav-slide-back-leave-active {
    transition: opacity 0.2s ease;
  }

  .mnav-slide-forward-enter-from,
  .mnav-slide-back-enter-from {
    transform: none;
  }

  .mnav-slide-forward-leave-to,
  .mnav-slide-back-leave-to {
    transform: none;
  }
}
</style>

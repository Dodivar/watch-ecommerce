<script setup>
import { ref, watch, computed, nextTick, onMounted, onUnmounted } from 'vue'
import { Search, X } from '@lucide/vue'
import { useRouter } from 'vue-router'
import { parseSearchQuery } from '@/utils/watchSearch.js'

const props = defineProps({
  variant: {
    type: String,
    default: 'page',
    validator: (v) =>
      v === 'page' || v === 'header-trigger' || v === 'header-panel',
  },
  initialQuery: {
    type: String,
    default: '',
  },
})

const open = defineModel('open', { type: Boolean, default: false })

const router = useRouter()
const inputValue = ref(props.initialQuery || '')
const isInvalid = ref(false)
const panelInputRef = ref(null)

const isHeaderTrigger = computed(() => props.variant === 'header-trigger')
const isHeaderPanel = computed(() => props.variant === 'header-panel')
const isPage = computed(() => props.variant === 'page')

watch(
  () => props.initialQuery,
  (val) => {
    inputValue.value = val || ''
  },
)

watch(open, (isOpen) => {
  if (isOpen && isHeaderPanel.value) {
    nextTick(() => {
      panelInputRef.value?.focus()
    })
  }
})

function togglePanel() {
  open.value = !open.value
}

function closePanel() {
  open.value = false
}

function submitSearch() {
  const parsed = parseSearchQuery(inputValue.value)
  if (!parsed) {
    isInvalid.value = true
    return
  }
  isInvalid.value = false
  closePanel()
  router.push({ path: '/collection/recherche', query: { q: parsed } })
}

function onDocumentKeydown(event) {
  if (event.key === 'Escape' && open.value && (isHeaderPanel.value || isHeaderTrigger.value)) {
    closePanel()
  }
}

onMounted(() => {
  document.addEventListener('keydown', onDocumentKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', onDocumentKeydown)
})

const inputClasses =
  'w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm text-text-main'
</script>

<template>
  <button
    v-if="isHeaderTrigger"
    type="button"
    class="p-2 rounded-lg text-text-main hover:bg-cream-100 focus:outline-none focus:ring-2 focus:ring-primary"
    :aria-label="open ? 'Fermer la recherche' : 'Ouvrir la recherche'"
    :aria-expanded="open ? 'true' : 'false'"
    aria-controls="header-catalog-search-panel"
    @click="togglePanel"
  >
    <Search class="h-6 w-6" :stroke-width="2" />
  </button>

  <Transition
    v-else-if="isHeaderPanel"
    enter-active-class="transition duration-200 ease-out"
    leave-active-class="transition duration-150 ease-in"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="open"
      id="header-catalog-search-panel"
      class="absolute left-0 right-0 top-full z-30 border-t border-gray-200 bg-white shadow-md"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <form class="flex items-center gap-2" role="search" @submit.prevent="submitSearch">
          <label for="catalog-search-header-panel" class="sr-only">Rechercher une montre</label>
          <input
            id="catalog-search-header-panel"
            ref="panelInputRef"
            v-model="inputValue"
            type="search"
            name="q"
            autocomplete="off"
            placeholder="Rechercher marque, modèle, référence…"
            :class="[inputClasses, isInvalid ? 'border-red-400' : 'border-gray-300']"
            :aria-invalid="isInvalid ? 'true' : 'false'"
            @input="isInvalid = false"
          />
          <button
            type="button"
            class="shrink-0 p-2 rounded-lg text-text-main hover:bg-cream-100 focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="Fermer la recherche"
            @click="closePanel"
          >
            <X class="h-5 w-5" :stroke-width="2" />
          </button>
        </form>
      </div>
    </div>
  </Transition>

  <form
    v-else-if="isPage"
    class="w-full max-w-2xl mx-auto"
    role="search"
    @submit.prevent="submitSearch"
  >
    <label for="catalog-search-page" class="sr-only">Rechercher une montre</label>
    <input
      id="catalog-search-page"
      v-model="inputValue"
      type="search"
      name="q"
      autocomplete="off"
      placeholder="Rechercher marque, modèle, référence…"
      :class="[
        inputClasses,
        isInvalid ? 'border-red-400' : 'border-gray-300',
        'py-3 text-base',
      ]"
      :aria-invalid="isInvalid ? 'true' : 'false'"
      @input="isInvalid = false"
    />
  </form>
</template>

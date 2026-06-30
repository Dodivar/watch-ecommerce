<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { getWatchesByIdsForAdmin, searchWatchesForAdmin } from '@/services/admin/adminWatchService'
import {
  getFeaturedWatchesForAdmin,
  setFeaturedWatchesForAdmin,
} from '@/services/admin/adminFeaturedService'
import { resetNouvellesWatchesCache } from '@/services/nouvellesWatchesService'
import { resetCollectionHighlightCache } from '@/services/collectionHighlightService'
import WatchCard from '@/components/watch/WatchCard.vue'
import { WATCH_CARD_CATALOG_PROPS } from '@/constants/watchCardDefaults.js'
import AdminShell from './AdminShell.vue'

const props = defineProps({
  /** Contexte `home_featured_watches` géré par cet écran. */
  context: {
    type: String,
    default: 'nouvelles',
  },
  /** Titre de la page admin (AdminShell). */
  title: {
    type: String,
    default: 'Sélection accueil — Nouveautés',
  },
  /** Texte d'aide affiché en tête de page. */
  description: {
    type: String,
    default:
      'Si la sélection est vide, le carrousel affiche automatiquement les dernières montres disponibles.',
  },
  /** Libellé de l'état vide / aperçu. */
  emptyHint: {
    type: String,
    default:
      'Aucune montre sélectionnée — le carrousel affichera automatiquement les dernières montres disponibles.',
  },
})

/** Invalidation du cache front associé au contexte courant. */
const CACHE_RESET_BY_CONTEXT = {
  nouvelles: resetNouvellesWatchesCache,
  collection: resetCollectionHighlightCache,
}

const PAGE_SIZE = 24
const SEARCH_DEBOUNCE_MS = 300

const watchById = ref(new Map())
const originalIds = ref([])
const selectedIds = ref([])
const search = ref('')

const availableWatches = ref([])
const availableTotal = ref(0)
const availablePage = ref(1)

const isLoading = ref(true)
const isLoadingAvailable = ref(false)
const isSaving = ref(false)
const error = ref(null)
const success = ref(null)

const draggedId = ref(null)
const draggedOverIndex = ref(null)

let searchDebounceTimer = null

const selectedWatches = computed(() =>
  selectedIds.value.map((id) => watchById.value.get(id)).filter(Boolean),
)

const totalPages = computed(() => Math.max(1, Math.ceil(availableTotal.value / PAGE_SIZE)))

const paginationStart = computed(() => {
  if (availableTotal.value === 0) return 0
  return (availablePage.value - 1) * PAGE_SIZE + 1
})

const paginationEnd = computed(() =>
  Math.min(availablePage.value * PAGE_SIZE, availableTotal.value),
)

const isDirty = computed(
  () => JSON.stringify(selectedIds.value) !== JSON.stringify(originalIds.value),
)

async function loadAvailableWatches() {
  try {
    isLoadingAvailable.value = true
    let page = availablePage.value
    let result = await searchWatchesForAdmin({
      search: search.value,
      page,
      pageSize: PAGE_SIZE,
      excludeIds: selectedIds.value,
    })
    const pages = Math.max(1, Math.ceil(result.total / PAGE_SIZE))
    if (page > pages) {
      page = pages
      availablePage.value = pages
      result = await searchWatchesForAdmin({
        search: search.value,
        page,
        pageSize: PAGE_SIZE,
        excludeIds: selectedIds.value,
      })
    }
    availableWatches.value = result.watches
    availableTotal.value = result.total
  } catch (err) {
    error.value = err.message
  } finally {
    isLoadingAvailable.value = false
  }
}

async function loadSelectedWatches() {
  const selected = await getWatchesByIdsForAdmin(selectedIds.value)
  watchById.value = new Map(selected.map((watch) => [watch.id, watch]))
}

async function load() {
  try {
    isLoading.value = true
    error.value = null
    const featuredRows = await getFeaturedWatchesForAdmin(props.context)
    originalIds.value = featuredRows.map((row) => row.watch_id).filter(Boolean)
    selectedIds.value = [...originalIds.value]
    await loadSelectedWatches()
    availablePage.value = 1
    await loadAvailableWatches()
  } catch (err) {
    error.value = err.message
  } finally {
    isLoading.value = false
  }
}

function addWatch(id) {
  if (selectedIds.value.includes(id)) return
  const watch = availableWatches.value.find((w) => w.id === id)
  if (watch) {
    watchById.value = new Map(watchById.value).set(id, watch)
  }
  selectedIds.value = [...selectedIds.value, id]
  success.value = null
  loadAvailableWatches()
}

function removeWatch(id) {
  selectedIds.value = selectedIds.value.filter((wid) => wid !== id)
  success.value = null
  loadAvailableWatches()
}

function moveWatch(index, direction) {
  const target = index + direction
  if (target < 0 || target >= selectedIds.value.length) return
  const next = [...selectedIds.value]
  ;[next[index], next[target]] = [next[target], next[index]]
  selectedIds.value = next
  success.value = null
}

function onDragStart(event, id) {
  draggedId.value = id
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('text/plain', id)
}

function onDragOver(event, index) {
  event.preventDefault()
  event.dataTransfer.dropEffect = 'move'
  draggedOverIndex.value = index
}

function onDragLeave() {
  draggedOverIndex.value = null
}

function onDrop(event, dropIndex) {
  event.preventDefault()
  draggedOverIndex.value = null
  const fromIndex = selectedIds.value.indexOf(draggedId.value)
  draggedId.value = null
  if (fromIndex === -1 || fromIndex === dropIndex) return
  const next = [...selectedIds.value]
  const [moved] = next.splice(fromIndex, 1)
  next.splice(dropIndex, 0, moved)
  selectedIds.value = next
  success.value = null
}

function onDragEnd() {
  draggedId.value = null
  draggedOverIndex.value = null
}

function goToPage(page) {
  if (page < 1 || page > totalPages.value) return
  availablePage.value = page
  loadAvailableWatches()
}

function cancel() {
  selectedIds.value = [...originalIds.value]
  success.value = null
  error.value = null
  loadSelectedWatches().then(() => {
    availablePage.value = 1
    loadAvailableWatches()
  })
}

async function save() {
  try {
    isSaving.value = true
    error.value = null
    success.value = null
    await setFeaturedWatchesForAdmin(props.context, selectedIds.value)
    originalIds.value = [...selectedIds.value]
    CACHE_RESET_BY_CONTEXT[props.context]?.()
    success.value = 'Sélection enregistrée.'
  } catch (err) {
    error.value = err.message
  } finally {
    isSaving.value = false
  }
}

watch(search, () => {
  clearTimeout(searchDebounceTimer)
  searchDebounceTimer = setTimeout(() => {
    availablePage.value = 1
    loadAvailableWatches()
  }, SEARCH_DEBOUNCE_MS)
})

onMounted(load)
</script>

<template>
  <AdminShell :title="title" content-class="max-w-5xl">
    <p class="text-sm text-gray-600 mb-4">
      {{ description }}
    </p>

    <div v-if="error" class="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-4">{{ error }}</div>
    <div v-if="success" class="bg-green-50 text-green-700 px-4 py-3 rounded-lg mb-4">{{ success }}</div>

    <div v-if="isLoading" class="text-center py-12 text-gray-500">Chargement…</div>

    <template v-else>
      <!-- Montres sélectionnées (réorganisables) -->
      <section class="bg-white rounded-lg shadow p-4 sm:p-6 mb-6">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-sm font-semibold text-gray-700">
            Montres sélectionnées ({{ selectedWatches.length }})
          </h2>
          <span class="text-xs text-gray-400">Glisser-déposer ou flèches pour réordonner</span>
        </div>

        <ul v-if="selectedWatches.length > 0" class="divide-y divide-gray-100">
          <li
            v-for="(watch, index) in selectedWatches"
            :key="`selected-${watch.id}`"
            draggable="true"
            class="flex items-center gap-3 py-2 transition-colors cursor-grab active:cursor-grabbing"
            :class="draggedOverIndex === index ? 'bg-cream-100' : ''"
            @dragstart="onDragStart($event, watch.id)"
            @dragover="onDragOver($event, index)"
            @dragleave="onDragLeave"
            @drop="onDrop($event, index)"
            @dragend="onDragEnd"
          >
            <span class="text-xs font-medium text-gray-400 w-5 text-center shrink-0">{{ index + 1 }}</span>
            <img
              v-if="watch.images && watch.images.length"
              :src="watch.images[0]"
              :alt="watch.name"
              class="w-12 h-12 rounded object-cover bg-gray-100 shrink-0"
              loading="lazy"
            />
            <div v-else class="w-12 h-12 rounded bg-gray-100 shrink-0"></div>
            <div class="flex-1 min-w-0">
              <p class="text-sm text-gray-800 truncate">{{ watch.brand }} — {{ watch.name }}</p>
              <span
                v-if="watch.is_available === false"
                class="inline-block mt-0.5 text-[10px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded"
              >
                Indisponible
              </span>
            </div>
            <div class="flex items-center gap-1 shrink-0">
              <button
                type="button"
                class="p-1.5 text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:hover:text-gray-400"
                :disabled="index === 0"
                aria-label="Monter"
                @click="moveWatch(index, -1)"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                </svg>
              </button>
              <button
                type="button"
                class="p-1.5 text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:hover:text-gray-400"
                :disabled="index === selectedWatches.length - 1"
                aria-label="Descendre"
                @click="moveWatch(index, 1)"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <button
                type="button"
                class="ml-1 text-sm text-red-600 hover:text-red-700 hover:underline"
                @click="removeWatch(watch.id)"
              >
                Retirer
              </button>
            </div>
          </li>
        </ul>
        <p v-else class="text-sm text-gray-500 py-4 text-center">Aucune sélection manuelle.</p>
      </section>

      <!-- Sélecteur visuel paginé -->
      <section class="bg-white rounded-lg shadow p-4 sm:p-6 mb-6">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h2 class="text-sm font-semibold text-gray-700">Ajouter une montre</h2>
          <input
            v-model="search"
            type="search"
            placeholder="Rechercher (marque, nom)…"
            class="w-full sm:w-64 px-3 py-2 border rounded-lg text-sm"
          />
        </div>

        <div v-if="isLoadingAvailable" class="text-center py-8 text-gray-500 text-sm">Chargement…</div>

        <template v-else>
          <div
            v-if="availableWatches.length > 0"
            class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3"
          >
            <button
              v-for="watch in availableWatches"
              :key="`available-${watch.id}`"
              type="button"
              class="group text-left border border-gray-100 rounded-lg overflow-hidden hover:border-primary hover:shadow transition"
              @click="addWatch(watch.id)"
            >
              <div class="relative aspect-square bg-gray-100">
                <img
                  v-if="watch.images && watch.images.length"
                  :src="watch.images[0]"
                  :alt="watch.name"
                  class="w-full h-full object-cover"
                  loading="lazy"
                />
                <div v-else class="flex items-center justify-center h-full text-xs text-gray-400">
                  Pas d'image
                </div>
                <span
                  class="absolute inset-0 flex items-center justify-center bg-primary/0 group-hover:bg-primary/70 text-white font-medium opacity-0 group-hover:opacity-100 transition"
                >
                  + Ajouter
                </span>
              </div>
              <div class="p-2">
                <p class="text-xs font-medium text-gray-700 truncate">{{ watch.brand }}</p>
                <p class="text-xs text-gray-500 truncate">{{ watch.name }}</p>
              </div>
            </button>
          </div>
          <p v-else class="text-sm text-gray-500 py-4 text-center">
            {{ search ? 'Aucune montre ne correspond à la recherche.' : 'Toutes les montres disponibles sont déjà sélectionnées.' }}
          </p>

          <div
            v-if="availableTotal > 0"
            class="mt-4 pt-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
          >
            <p class="text-sm text-gray-500">
              {{ paginationStart }}-{{ paginationEnd }} sur {{ availableTotal }} montre{{ availableTotal > 1 ? 's' : '' }}
            </p>
            <div v-if="totalPages > 1" class="flex items-center gap-2">
              <button
                type="button"
                :disabled="availablePage === 1"
                :class="[
                  'px-3 py-1 rounded-md text-sm border transition-colors',
                  availablePage === 1
                    ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                    : 'border-gray-300 text-gray-700 hover:bg-cream-100 cursor-pointer',
                ]"
                @click="goToPage(availablePage - 1)"
              >
                Précédent
              </button>
              <span class="text-sm text-gray-600">Page {{ availablePage }} / {{ totalPages }}</span>
              <button
                type="button"
                :disabled="availablePage === totalPages"
                :class="[
                  'px-3 py-1 rounded-md text-sm border transition-colors',
                  availablePage === totalPages
                    ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                    : 'border-gray-300 text-gray-700 hover:bg-cream-100 cursor-pointer',
                ]"
                @click="goToPage(availablePage + 1)"
              >
                Suivant
              </button>
            </div>
          </div>
        </template>
      </section>

      <!-- Aperçu fidèle du carrousel -->
      <section class="bg-white rounded-lg shadow p-4 sm:p-6 mb-6">
        <h2 class="text-sm font-semibold text-gray-700 mb-3">Aperçu du carrousel</h2>
        <div
          v-if="selectedWatches.length > 0"
          class="overflow-x-auto custom-scrollbar-carrousel scroll-smooth -mx-2 px-2"
        >
          <div class="flex items-stretch space-x-4 min-w-full py-2">
            <div
              v-for="watch in selectedWatches"
              :key="`preview-${watch.id}`"
              class="flex-shrink-0 w-40 sm:w-56"
            >
              <WatchCard
                v-bind="WATCH_CARD_CATALOG_PROPS"
                :watch="watch"
                :clickable="false"
                :show-new-badge="true"
              />
            </div>
          </div>
        </div>
        <p v-else class="text-sm text-gray-500 py-6 text-center">
          {{ emptyHint }}
        </p>
      </section>

      <!-- Actions -->
      <div
        class="sticky bottom-0 z-20 mt-6 flex flex-wrap items-center justify-end gap-3 rounded-lg border border-gray-200 bg-white/95 p-4 shadow backdrop-blur"
      >
        <span v-if="isDirty" class="text-xs text-amber-600 mr-auto">Modifications non enregistrées</span>
        <button
          type="button"
          class="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-cream disabled:cursor-not-allowed disabled:opacity-40"
          :disabled="!isDirty || isSaving"
          @click="cancel"
        >
          Annuler
        </button>
        <button
          type="button"
          class="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
          :disabled="!isDirty || isSaving"
          @click="save"
        >
          {{ isSaving ? 'Enregistrement…' : 'Sauvegarder' }}
        </button>
      </div>
    </template>
  </AdminShell>
</template>

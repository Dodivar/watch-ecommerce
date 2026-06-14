<script setup>
import { ref, computed, onMounted } from 'vue'
import { getAllWatchesForAdmin } from '@/services/admin/adminWatchService'
import {
  getFeaturedWatchesForAdmin,
  setFeaturedWatchesForAdmin,
} from '@/services/admin/adminFeaturedService'
import { resetNouvellesWatchesCache } from '@/services/nouvellesWatchesService'
import WatchCard from '@/components/watch/WatchCard.vue'
import { WATCH_CARD_CATALOG_PROPS } from '@/constants/watchCardDefaults.js'
import AdminShell from './AdminShell.vue'

const watchById = ref(new Map())
const originalIds = ref([])
const selectedIds = ref([])
const search = ref('')

const isLoading = ref(true)
const isSaving = ref(false)
const error = ref(null)
const success = ref(null)

const draggedId = ref(null)
const draggedOverIndex = ref(null)

const selectedWatches = computed(() =>
  selectedIds.value.map((id) => watchById.value.get(id)).filter(Boolean),
)

const availableWatches = computed(() => {
  const selectedSet = new Set(selectedIds.value)
  const term = search.value.trim().toLowerCase()
  return Array.from(watchById.value.values())
    .filter((w) => w.is_available !== false && !selectedSet.has(w.id))
    .filter((w) => {
      if (!term) return true
      return `${w.brand || ''} ${w.name || ''}`.toLowerCase().includes(term)
    })
})

const isDirty = computed(
  () => JSON.stringify(selectedIds.value) !== JSON.stringify(originalIds.value),
)

async function load() {
  try {
    isLoading.value = true
    error.value = null
    const [allWatches, featuredRows] = await Promise.all([
      getAllWatchesForAdmin(),
      getFeaturedWatchesForAdmin('nouvelles'),
    ])
    watchById.value = new Map(allWatches.map((w) => [w.id, w]))
    originalIds.value = featuredRows.map((row) => row.watch_id).filter(Boolean)
    selectedIds.value = [...originalIds.value]
  } catch (err) {
    error.value = err.message
  } finally {
    isLoading.value = false
  }
}

function addWatch(id) {
  if (selectedIds.value.includes(id)) return
  selectedIds.value = [...selectedIds.value, id]
  success.value = null
}

function removeWatch(id) {
  selectedIds.value = selectedIds.value.filter((wid) => wid !== id)
  success.value = null
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

function cancel() {
  selectedIds.value = [...originalIds.value]
  success.value = null
  error.value = null
}

async function save() {
  try {
    isSaving.value = true
    error.value = null
    success.value = null
    await setFeaturedWatchesForAdmin('nouvelles', selectedIds.value)
    originalIds.value = [...selectedIds.value]
    resetNouvellesWatchesCache()
    success.value = 'Sélection enregistrée.'
  } catch (err) {
    error.value = err.message
  } finally {
    isSaving.value = false
  }
}

onMounted(load)
</script>

<template>
  <AdminShell title="Sélection accueil — Nouveautés" content-class="max-w-5xl">
    <p class="text-sm text-gray-600 mb-4">
      Si la sélection est vide, le carrousel affiche automatiquement les dernières montres disponibles.
    </p>

    <div v-if="error" class="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-4">{{ error }}</div>
    <div v-if="success" class="bg-green-50 text-green-700 px-4 py-3 rounded-lg mb-4">{{ success }}</div>

    <div v-if="isLoading" class="text-center py-12 text-gray-500">Chargement…</div>

    <template v-else>
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
          Aucune montre sélectionnée — le carrousel affichera automatiquement les dernières montres disponibles.
        </p>
      </section>

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

      <!-- Sélecteur visuel -->
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
      </section>

      <!-- Actions -->
      <div class="sticky bottom-0 bg-cream/95 backdrop-blur py-3 flex items-center justify-end gap-3 border-t border-gray-200">
        <span v-if="isDirty" class="text-xs text-amber-600 mr-auto">Modifications non enregistrées</span>
        <button
          type="button"
          class="px-4 py-2 text-sm text-gray-700 rounded-lg hover:bg-cream-100 disabled:opacity-40"
          :disabled="!isDirty || isSaving"
          @click="cancel"
        >
          Annuler
        </button>
        <button
          type="button"
          class="px-4 py-2 text-sm bg-primary text-white rounded-lg disabled:opacity-40"
          :disabled="!isDirty || isSaving"
          @click="save"
        >
          {{ isSaving ? 'Enregistrement…' : 'Sauvegarder' }}
        </button>
      </div>
    </template>
  </AdminShell>
</template>

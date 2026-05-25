<script setup>
import { ref, onMounted } from 'vue'
import { getAllWatchesForAdmin } from '@/services/admin/adminWatchService'
import { getFeaturedWatchesForAdmin, addFeaturedWatch, removeFeaturedWatch } from '@/services/admin/adminFeaturedService'
import AdminShell from './AdminShell.vue'

const watches = ref([])
const featured = ref([])
const selectedWatchId = ref('')
const isLoading = ref(true)
const error = ref(null)

async function load() {
  try {
    isLoading.value = true
    const [allWatches, featuredRows] = await Promise.all([
      getAllWatchesForAdmin(),
      getFeaturedWatchesForAdmin('nouvelles'),
    ])
    watches.value = allWatches.filter((w) => w.is_available !== false)
    featured.value = featuredRows
  } catch (err) {
    error.value = err.message
  } finally {
    isLoading.value = false
  }
}

async function add() {
  if (!selectedWatchId.value) return
  await addFeaturedWatch('nouvelles', selectedWatchId.value)
  selectedWatchId.value = ''
  await load()
}

async function remove(id) {
  await removeFeaturedWatch(id)
  await load()
}

onMounted(load)
</script>

<template>
  <AdminShell title="Sélection accueil — Nouveautés" content-class="max-w-3xl">
      <p class="text-sm text-gray-600 mb-4">Si vide, le carrousel affiche automatiquement les dernières montres disponibles.</p>
      <div v-if="error" class="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-4">{{ error }}</div>
      <div class="bg-white rounded-lg shadow p-6 mb-6">
        <div class="flex gap-2">
          <select v-model="selectedWatchId" class="flex-1 px-3 py-2 border rounded-lg">
            <option value="">Choisir une montre…</option>
            <option v-for="w in watches" :key="w.id" :value="w.id">{{ w.brand }} — {{ w.name }}</option>
          </select>
          <button type="button" class="px-4 py-2 bg-primary text-white rounded-lg" @click="add">Ajouter</button>
        </div>
      </div>
      <div v-if="isLoading" class="text-center py-8">Chargement…</div>
      <ul v-else class="bg-white rounded-lg shadow divide-y">
        <li v-for="row in featured" :key="row.id" class="p-4 flex justify-between">
          <span>{{ row.watches?.brand }} — {{ row.watches?.name }}</span>
          <button type="button" class="text-red-600 underline" @click="remove(row.id)">Retirer</button>
        </li>
        <li v-if="featured.length === 0" class="p-6 text-center text-gray-500">Aucune sélection manuelle.</li>
      </ul>
  </AdminShell>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Plus, Trash2, ArrowLeft } from '@lucide/vue'
import {
  getSubscribers,
  addSubscriber,
  deleteSubscriber,
} from '@/services/admin/adminNewsletterService'
import { useAdminPermissions } from '@/services/admin/useAdminPermissions'
import AdminShell from './AdminShell.vue'

const { canWrite } = useAdminPermissions()
const subscribers = ref([])
const total = ref(0)
const isLoading = ref(true)
const error = ref(null)
const notice = ref(null)

const statusFilter = ref('')
const search = ref('')

const newEmail = ref('')
const newName = ref('')
const isAdding = ref(false)

const STATUS_LABELS = { subscribed: 'Abonné', unsubscribed: 'Désinscrit' }
const SOURCE_LABELS = { optin: 'Inscription', import: 'Import', manual: 'Ajout manuel' }

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-FR', { dateStyle: 'medium' })
}

async function load() {
  try {
    isLoading.value = true
    error.value = null
    const result = await getSubscribers({
      status: statusFilter.value || undefined,
      search: search.value || undefined,
      limit: 500,
    })
    subscribers.value = result.subscribers
    total.value = result.total
  } catch (err) {
    error.value = err.message
  } finally {
    isLoading.value = false
  }
}

async function add() {
  if (!newEmail.value.trim()) return
  try {
    isAdding.value = true
    error.value = null
    await addSubscriber({ email: newEmail.value, name: newName.value })
    newEmail.value = ''
    newName.value = ''
    notice.value = 'Abonné ajouté'
    await load()
  } catch (err) {
    error.value = err.message
  } finally {
    isAdding.value = false
  }
}

async function remove(sub) {
  if (!window.confirm(`Supprimer ${sub.email} de la liste ?`)) return
  try {
    await deleteSubscriber(sub.id)
    await load()
  } catch (err) {
    error.value = err.message
  }
}

onMounted(load)
</script>

<template>
  <AdminShell title="Abonnés newsletter">
    <RouterLink
      to="/admin/newsletter"
      class="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-text-main mb-4"
    >
      <ArrowLeft class="w-4 h-4" :stroke-width="2" /> Retour aux campagnes
    </RouterLink>

    <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
      {{ error }}
    </div>
    <div v-if="notice" class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
      {{ notice }}
    </div>

    <!-- Ajout manuel -->
    <div v-if="canWrite" class="bg-white border border-gray-200 rounded-lg p-4 mb-6">
      <p class="text-sm font-medium text-gray-700 mb-3">Ajouter un abonné</p>
      <div class="flex flex-col sm:flex-row gap-2">
        <input
          v-model="newEmail"
          type="email"
          placeholder="email@exemple.fr"
          class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
        />
        <input
          v-model="newName"
          type="text"
          placeholder="Nom (facultatif)"
          class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
        />
        <button
          type="button"
          :disabled="isAdding"
          class="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
          @click="add"
        >
          <Plus class="w-4 h-4" :stroke-width="2" /> Ajouter
        </button>
      </div>
      <p class="text-xs text-gray-400 mt-2">
        Les abonnés s'inscrivent d'eux-mêmes via le formulaire du site ou en cochant la case
        « newsletter » lors d'une prise de contact ou d'un achat.
      </p>
    </div>

    <!-- Filtres -->
    <div class="flex flex-wrap gap-3 mb-4">
      <select v-model="statusFilter" class="px-3 py-2 border rounded-lg bg-white text-sm" @change="load">
        <option value="">Tous les statuts</option>
        <option value="subscribed">Abonnés</option>
        <option value="unsubscribed">Désinscrits</option>
      </select>
      <input
        v-model="search"
        type="text"
        placeholder="Rechercher un email ou nom…"
        class="px-3 py-2 border rounded-lg bg-white text-sm flex-1 min-w-[200px]"
        @keyup.enter="load"
      />
      <button type="button" class="px-3 py-2 border rounded-lg bg-white text-sm hover:bg-cream" @click="load">
        Rechercher
      </button>
    </div>

    <div v-if="isLoading" class="text-center py-12 text-gray-500">Chargement…</div>

    <div v-else-if="subscribers.length === 0" class="bg-white rounded-lg shadow p-8 text-center text-gray-500">
      Aucun abonné pour le moment.
    </div>

    <div v-else class="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-cream">
            <tr>
              <th class="px-4 py-3 text-left text-xs uppercase">Email</th>
              <th class="px-4 py-3 text-left text-xs uppercase">Nom</th>
              <th class="px-4 py-3 text-left text-xs uppercase">Statut</th>
              <th class="px-4 py-3 text-left text-xs uppercase">Source</th>
              <th class="px-4 py-3 text-left text-xs uppercase">Ajouté le</th>
              <th class="px-4 py-3 text-right text-xs uppercase">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr v-for="sub in subscribers" :key="sub.id" class="hover:bg-cream/50">
              <td class="px-4 py-3 text-sm font-medium text-text-main">{{ sub.email }}</td>
              <td class="px-4 py-3 text-sm text-gray-600">{{ sub.name || '—' }}</td>
              <td class="px-4 py-3 text-sm">
                <span
                  class="text-xs px-2 py-1 rounded-full font-semibold"
                  :class="sub.status === 'subscribed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'"
                >
                  {{ STATUS_LABELS[sub.status] || sub.status }}
                </span>
              </td>
              <td class="px-4 py-3 text-sm text-gray-600">{{ SOURCE_LABELS[sub.source] || sub.source }}</td>
              <td class="px-4 py-3 text-sm text-gray-600">{{ formatDate(sub.createdAt) }}</td>
              <td class="px-4 py-3 text-sm">
                <div class="flex justify-end">
                  <button
                    v-if="canWrite"
                    type="button"
                    class="p-1.5 rounded-lg text-red-600 hover:text-red-900 hover:bg-cream transition-colors"
                    title="Supprimer"
                    @click="remove(sub)"
                  >
                    <Trash2 class="w-5 h-5" :stroke-width="2" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="px-4 py-3 border-t border-gray-200 text-sm text-gray-500 italic">
        {{ subscribers.length }} affiché(s) sur {{ total }}
      </div>
    </div>
  </AdminShell>
</template>

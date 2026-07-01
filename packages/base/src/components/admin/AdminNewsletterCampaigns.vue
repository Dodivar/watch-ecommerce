<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, Eye, Trash2, Users, Settings, Ban } from '@lucide/vue'
import {
  getCampaigns,
  deleteCampaign,
  createCampaign,
  cancelScheduledCampaign,
} from '@/services/admin/adminNewsletterService'
import AdminShell from './AdminShell.vue'

const router = useRouter()
const campaigns = ref([])
const isLoading = ref(true)
const error = ref(null)
const statusFilter = ref('')

const STATUS_LABELS = {
  draft: 'Brouillon',
  scheduled: 'Programmée',
  sending: 'En cours',
  sent: 'Envoyée',
  failed: 'Échec',
  cancelled: 'Annulée',
}
const STATUS_CLASSES = {
  draft: 'bg-gray-100 text-gray-700',
  scheduled: 'bg-blue-100 text-blue-800',
  sending: 'bg-amber-100 text-amber-800',
  sent: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-500',
}
const FILTER_OPTIONS = [
  { value: '', label: 'Toutes' },
  { value: 'draft', label: 'Brouillons' },
  { value: 'scheduled', label: 'Programmées' },
  { value: 'sent', label: 'Envoyées' },
  { value: 'cancelled', label: 'Annulées' },
  { value: 'failed', label: 'Échecs' },
]

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })
}

async function load() {
  try {
    isLoading.value = true
    error.value = null
    campaigns.value = await getCampaigns(statusFilter.value ? { status: statusFilter.value } : {})
  } catch (err) {
    error.value = err.message
  } finally {
    isLoading.value = false
  }
}

async function cancelSchedule(campaign) {
  if (!window.confirm(`Annuler la programmation de « ${campaign.subject} » ?`)) return
  try {
    await cancelScheduledCampaign(campaign.id)
    await load()
  } catch (err) {
    error.value = err.message
  }
}

async function createNew() {
  try {
    const campaign = await createCampaign({ subject: 'Nouvelle campagne', bodyHtml: '' })
    router.push(`/admin/newsletter/${campaign.id}/edit`)
  } catch (err) {
    error.value = err.message
  }
}

async function remove(campaign) {
  if (!window.confirm(`Supprimer la campagne « ${campaign.subject} » ?`)) return
  try {
    await deleteCampaign(campaign.id)
    await load()
  } catch (err) {
    error.value = err.message
  }
}

onMounted(load)
</script>

<template>
  <AdminShell title="Newsletter">
    <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
      {{ error }}
    </div>

    <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
      <div class="flex flex-wrap items-center gap-2">
        <select
          v-model="statusFilter"
          class="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-primary focus:outline-none"
          @change="load"
        >
          <option v-for="opt in FILTER_OPTIONS" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
        <RouterLink
          to="/admin/newsletter/subscribers"
          class="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm hover:bg-cream transition-colors"
        >
          <Users class="w-4 h-4" :stroke-width="2" /> Abonnés
        </RouterLink>
        <RouterLink
          to="/admin/newsletter/settings"
          class="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm hover:bg-cream transition-colors"
        >
          <Settings class="w-4 h-4" :stroke-width="2" /> En-tête / pied de page
        </RouterLink>
      </div>
      <button
        type="button"
        class="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
        @click="createNew"
      >
        <Plus class="w-4 h-4" :stroke-width="2" /> Nouvelle campagne
      </button>
    </div>

    <div v-if="isLoading" class="text-center py-12 text-gray-500">Chargement…</div>

    <div v-else-if="campaigns.length === 0" class="bg-white rounded-lg shadow p-8 text-center text-gray-500">
      Aucune campagne pour le moment. Créez votre première newsletter.
    </div>

    <div v-else class="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-cream">
            <tr>
              <th class="px-4 py-3 text-left text-xs uppercase">Objet</th>
              <th class="px-4 py-3 text-left text-xs uppercase">Statut</th>
              <th class="px-4 py-3 text-right text-xs uppercase">Destinataires</th>
              <th class="px-4 py-3 text-left text-xs uppercase">Envoi prévu</th>
              <th class="px-4 py-3 text-left text-xs uppercase">Envoyée le</th>
              <th class="px-4 py-3 text-right text-xs uppercase">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr v-for="c in campaigns" :key="c.id" class="hover:bg-cream/50">
              <td class="px-4 py-3 text-sm font-medium text-text-main">{{ c.subject || '(sans objet)' }}</td>
              <td class="px-4 py-3 text-sm">
                <span class="text-xs px-2 py-1 rounded-full font-semibold" :class="STATUS_CLASSES[c.status]">
                  {{ STATUS_LABELS[c.status] || c.status }}
                </span>
              </td>
              <td class="px-4 py-3 text-sm text-right">
                {{ c.status === 'sent' ? `${c.sentCount}/${c.recipientCount}` : (c.recipientCount || '—') }}
              </td>
              <td class="px-4 py-3 text-sm text-gray-600">
                {{ c.status === 'scheduled' ? formatDate(c.scheduledAt) : '—' }}
              </td>
              <td class="px-4 py-3 text-sm text-gray-600">{{ formatDate(c.sentAt) }}</td>
              <td class="px-4 py-3 text-sm">
                <div class="flex justify-end gap-1">
                  <button
                    type="button"
                    class="p-1.5 rounded-lg text-blue-600 hover:text-blue-900 hover:bg-cream transition-colors"
                    :title="c.status === 'draft' ? 'Modifier' : 'Voir'"
                    @click="router.push(`/admin/newsletter/${c.id}/edit`)"
                  >
                    <Eye class="w-5 h-5" :stroke-width="2" />
                  </button>
                  <button
                    v-if="c.status === 'scheduled'"
                    type="button"
                    class="p-1.5 rounded-lg text-amber-600 hover:text-amber-900 hover:bg-cream transition-colors"
                    title="Annuler la programmation"
                    @click="cancelSchedule(c)"
                  >
                    <Ban class="w-5 h-5" :stroke-width="2" />
                  </button>
                  <button
                    v-if="c.status !== 'sending'"
                    type="button"
                    class="p-1.5 rounded-lg text-red-600 hover:text-red-900 hover:bg-cream transition-colors"
                    title="Supprimer"
                    @click="remove(c)"
                  >
                    <Trash2 class="w-5 h-5" :stroke-width="2" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </AdminShell>
</template>

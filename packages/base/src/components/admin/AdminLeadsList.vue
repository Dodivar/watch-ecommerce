<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getLeadsForAdmin, getAppointmentsByDate, LEAD_TYPES } from '@/services/admin/adminLeadService'
import {
  LEAD_TYPE_LABELS,
  LEAD_STATUS_LABELS,
  formatLeadSlot,
  formatLeadDateTime,
  getLeadSummary,
} from '@/utils/leadDisplay'
import AdminShell from './AdminShell.vue'

const router = useRouter()
const leads = ref([])
const appointmentsByDate = ref({})
const isLoading = ref(true)
const error = ref(null)
const typeFilter = ref('')
const statusFilter = ref('new')
const showAppointments = ref(false)

async function load() {
  try {
    isLoading.value = true
    error.value = null
    const [listResult, appts] = await Promise.all([
      getLeadsForAdmin({ type: typeFilter.value || undefined, status: statusFilter.value || undefined }),
      getAppointmentsByDate(),
    ])
    leads.value = listResult.leads
    appointmentsByDate.value = appts
  } catch (err) {
    error.value = err.message
  } finally {
    isLoading.value = false
  }
}

function replyMailto(lead) {
  const email = lead.customerEmail || lead.payload?.email
  if (!email) return
  window.location.href = `mailto:${encodeURIComponent(email)}`
}

onMounted(load)
</script>

<template>
  <AdminShell title="Messages entrants">
    <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">{{ error }}</div>
    <div class="flex flex-wrap gap-3 mb-4">
      <select v-model="typeFilter" class="px-3 py-2 border rounded-lg bg-white" @change="load">
        <option value="">Tous les types</option>
        <option v-for="t in LEAD_TYPES" :key="t" :value="t">{{ LEAD_TYPE_LABELS[t] }}</option>
      </select>
      <select v-model="statusFilter" class="px-3 py-2 border rounded-lg bg-white" @change="load">
        <option value="">Tous les statuts</option>
        <option value="new">Non lus</option>
        <option value="read">Lus</option>
        <option value="archived">Archivés</option>
      </select>
      <button type="button" class="px-3 py-2 border rounded-lg bg-white" @click="showAppointments = !showAppointments">
        {{ showAppointments ? 'Masquer' : 'Voir' }} RDV par date
      </button>
    </div>
    <div v-if="showAppointments && Object.keys(appointmentsByDate).length" class="bg-white rounded-lg shadow p-4 mb-6">
      <h2 class="font-semibold mb-3">Rendez-vous par date</h2>
      <div v-for="(items, date) in appointmentsByDate" :key="date" class="mb-4">
        <h3 class="text-sm font-medium text-gray-700 mb-2">{{ date }}</h3>
        <ul class="space-y-1 text-sm">
          <li v-for="a in items" :key="a.id">
            {{ formatLeadSlot(a.payload?.time_slot) }} — {{ a.customerName }} — {{ a.payload?.watch_name }}
          </li>
        </ul>
      </div>
    </div>
    <div v-if="isLoading" class="text-center py-12">Chargement…</div>
    <div v-else class="bg-white rounded-lg shadow overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-cream">
          <tr>
            <th class="px-4 py-3 text-left text-xs uppercase">Date</th>
            <th class="px-4 py-3 text-left text-xs uppercase">Type</th>
            <th class="px-4 py-3 text-left text-xs uppercase">Contact</th>
            <th class="px-4 py-3 text-left text-xs uppercase">Résumé</th>
            <th class="px-4 py-3 text-left text-xs uppercase">Statut</th>
            <th class="px-4 py-3 text-left text-xs uppercase">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <tr v-for="lead in leads" :key="lead.id" class="hover:bg-cream/50">
            <td class="px-4 py-3 text-sm">{{ formatLeadDateTime(lead.createdAt) }}</td>
            <td class="px-4 py-3 text-sm">{{ LEAD_TYPE_LABELS[lead.type] }}</td>
            <td class="px-4 py-3 text-sm">{{ lead.customerName || lead.customerEmail || '—' }}</td>
            <td class="px-4 py-3 text-sm text-gray-600">{{ getLeadSummary(lead) }}</td>
            <td class="px-4 py-3 text-sm">
              <span :class="lead.status === 'new' ? 'font-semibold text-primary' : ''">
                {{ LEAD_STATUS_LABELS[lead.status] }}
              </span>
            </td>
            <td class="px-4 py-3 text-sm space-x-2">
              <button type="button" class="text-primary underline" @click="router.push(`/admin/leads/${lead.id}`)">Voir</button>
              <button v-if="lead.customerEmail" type="button" class="text-gray-600 underline" @click="replyMailto(lead)">Répondre</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </AdminShell>
</template>

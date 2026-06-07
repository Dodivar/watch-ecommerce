<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ChevronDown, Eye, Mail } from '@lucide/vue'
import {
  getLeadsForAdmin,
  getAppointmentsByDate,
  getUnreadLeadsCountByType,
  LEAD_TYPES,
} from '@/services/admin/adminLeadService'
import {
  LEAD_TYPE_LABELS,
  LEAD_STATUS_LABELS,
  formatLeadSlot,
  formatLeadDateTime,
  getLeadSummary,
} from '@/utils/leadDisplay'
import { getSiteConfig } from '@/site/getSiteConfig.js'
import AdminShell from './AdminShell.vue'

const PAGE_SIZE = 25

const site = getSiteConfig()

const activeLeadTypes = computed(() => {
  const { features } = site
  const isRetail = site.watchCatalog?.isRetail ?? site.watchCatalog?.mode !== 'resale'

  return LEAD_TYPES.filter((type) => {
    switch (type) {
      case 'contact':
        return features.contact
      case 'appointment':
        return isRetail && features.collection
      case 'estimation':
        return features.estimation
      case 'search':
        return features.recherche
      default:
        return false
    }
  })
})

const showAppointmentCalendar = computed(() => activeLeadTypes.value.includes('appointment'))

const router = useRouter()
const leads = ref([])
const appointmentsByDate = ref({})
const unreadByType = ref(Object.fromEntries(LEAD_TYPES.map((t) => [t, 0])))
const isLoading = ref(true)
const error = ref(null)
const statusFilter = ref('new')
const showAppointments = ref(false)
const expandedTypes = ref(new Set())
const pageByType = ref(Object.fromEntries(LEAD_TYPES.map((t) => [t, 1])))

const leadsByType = computed(() => {
  const grouped = Object.fromEntries(activeLeadTypes.value.map((t) => [t, []]))
  for (const lead of leads.value) {
    if (grouped[lead.type]) grouped[lead.type].push(lead)
  }
  return grouped
})

function paginatedLeads(type) {
  const all = leadsByType.value[type] || []
  const page = pageByType.value[type] || 1
  const start = (page - 1) * PAGE_SIZE
  return all.slice(start, start + PAGE_SIZE)
}

function totalPages(type) {
  const count = (leadsByType.value[type] || []).length
  return Math.max(1, Math.ceil(count / PAGE_SIZE))
}

function paginationStart(type) {
  const count = (leadsByType.value[type] || []).length
  if (count === 0) return 0
  const page = pageByType.value[type] || 1
  return (page - 1) * PAGE_SIZE + 1
}

function paginationEnd(type) {
  const count = (leadsByType.value[type] || []).length
  const page = pageByType.value[type] || 1
  return Math.min(page * PAGE_SIZE, count)
}

function isExpanded(type) {
  return expandedTypes.value.has(type)
}

function toggleSection(type) {
  const next = new Set(expandedTypes.value)
  if (next.has(type)) next.delete(type)
  else next.add(type)
  expandedTypes.value = next
}

function goToPage(type, page) {
  const pages = totalPages(type)
  if (page < 1 || page > pages) return
  pageByType.value = { ...pageByType.value, [type]: page }
}

function syncExpandedSections() {
  const next = new Set()
  for (const type of activeLeadTypes.value) {
    if (unreadByType.value[type] > 0) next.add(type)
  }
  if (next.size === 0) {
    for (const type of activeLeadTypes.value) {
      if ((leadsByType.value[type] || []).length > 0) {
        next.add(type)
        break
      }
    }
  }
  expandedTypes.value = next
}

async function load() {
  try {
    isLoading.value = true
    error.value = null
    pageByType.value = Object.fromEntries(activeLeadTypes.value.map((t) => [t, 1]))

    const requests = [
      getLeadsForAdmin({
        status: statusFilter.value || undefined,
        limit: 1000,
      }),
      getUnreadLeadsCountByType(),
    ]
    if (showAppointmentCalendar.value) {
      requests.push(getAppointmentsByDate())
    }

    const [listResult, unreadCounts, appts] = await Promise.all(requests)
    leads.value = listResult.leads
    appointmentsByDate.value = appts || {}
    unreadByType.value = unreadCounts
    syncExpandedSections()
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
    <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
      {{ error }}
    </div>

    <div class="flex flex-wrap gap-3 mb-6">
      <select v-model="statusFilter" class="px-3 py-2 border rounded-lg bg-white" @change="load">
        <option value="">Tous les statuts</option>
        <option value="new">Non lus</option>
        <option value="read">Lus</option>
        <option value="archived">Archivés</option>
      </select>
      <button
        v-if="showAppointmentCalendar"
        type="button"
        class="px-3 py-2 border rounded-lg bg-white"
        @click="showAppointments = !showAppointments"
      >
        {{ showAppointments ? 'Masquer' : 'Voir' }} RDV par date
      </button>
    </div>

    <div
      v-if="showAppointmentCalendar && showAppointments && Object.keys(appointmentsByDate).length"
      class="bg-white rounded-lg shadow p-4 mb-6"
    >
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

    <div v-else-if="activeLeadTypes.length === 0" class="bg-white rounded-lg shadow p-8 text-center text-gray-500">
      Aucun type de message n'est activé pour ce site.
    </div>

    <div v-else class="space-y-3">
      <section
        v-for="type in activeLeadTypes"
        :key="type"
        class="bg-white rounded-lg shadow border border-gray-200 overflow-hidden"
      >
        <button
          type="button"
          class="w-full flex items-center gap-3 px-4 py-4 text-left hover:bg-cream/50 transition-colors"
          :aria-expanded="isExpanded(type)"
          @click="toggleSection(type)"
        >
          <ChevronDown
            class="w-5 h-5 shrink-0 text-gray-500 transition-transform"
            :class="{ 'rotate-180': isExpanded(type) }"
            :stroke-width="2"
          />
          <span class="font-semibold text-text-main flex-1">{{ LEAD_TYPE_LABELS[type] }}</span>
          <span
            v-if="unreadByType[type] > 0"
            class="text-xs bg-primary text-white px-2 py-1 rounded-full font-semibold"
          >
            {{ unreadByType[type] }}
          </span>
          <span class="text-sm text-gray-500">
            {{ (leadsByType[type] || []).length }} message{{ (leadsByType[type] || []).length > 1 ? 's' : '' }}
          </span>
        </button>

        <div v-show="isExpanded(type)" class="border-t border-gray-200">
          <div v-if="(leadsByType[type] || []).length === 0" class="px-4 py-8 text-center text-gray-500 text-sm">
            Aucun message pour ce type.
          </div>

          <template v-else>
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-cream">
                  <tr>
                    <th class="px-4 py-3 text-left text-xs uppercase">Date</th>
                    <th class="px-4 py-3 text-left text-xs uppercase">Contact</th>
                    <th class="px-4 py-3 text-left text-xs uppercase">Résumé</th>
                    <th class="px-4 py-3 text-left text-xs uppercase">Statut</th>
                    <th class="px-4 py-3 text-right text-xs uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
                  <tr v-for="lead in paginatedLeads(type)" :key="lead.id" class="hover:bg-cream/50">
                    <td class="px-4 py-3 text-sm">{{ formatLeadDateTime(lead.createdAt) }}</td>
                    <td class="px-4 py-3 text-sm">{{ lead.customerName || lead.customerEmail || '—' }}</td>
                    <td class="px-4 py-3 text-sm text-gray-600">{{ getLeadSummary(lead) }}</td>
                    <td class="px-4 py-3 text-sm">
                      <span :class="lead.status === 'new' ? 'font-semibold text-primary' : ''">
                        {{ LEAD_STATUS_LABELS[lead.status] }}
                      </span>
                    </td>
                    <td class="px-4 py-3 text-sm">
                      <div class="flex justify-end gap-1">
                        <button
                          type="button"
                          class="p-1.5 rounded-lg text-blue-600 hover:text-blue-900 hover:bg-cream-100 transition-colors"
                          title="Voir"
                          @click="router.push(`/admin/leads/${lead.id}`)"
                        >
                          <Eye class="w-5 h-5" :stroke-width="2" />
                        </button>
                        <button
                          v-if="lead.customerEmail"
                          type="button"
                          class="p-1.5 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-cream-100 transition-colors"
                          title="Répondre"
                          @click="replyMailto(lead)"
                        >
                          <Mail class="w-5 h-5" :stroke-width="2" />
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div
              class="px-4 py-3 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
            >
              <p class="text-sm text-gray-500 italic">
                {{ paginationStart(type) }}-{{ paginationEnd(type) }} sur
                {{ (leadsByType[type] || []).length }} message{{ (leadsByType[type] || []).length > 1 ? 's' : '' }}
              </p>
              <div v-if="totalPages(type) > 1" class="flex items-center gap-2">
                <button
                  type="button"
                  :disabled="pageByType[type] === 1"
                  :class="[
                    'px-3 py-1 rounded-md text-sm border transition-colors',
                    pageByType[type] === 1
                      ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                      : 'border-gray-300 text-gray-700 hover:bg-cream-100 cursor-pointer',
                  ]"
                  @click="goToPage(type, pageByType[type] - 1)"
                >
                  Précédent
                </button>
                <span class="text-sm text-gray-600">Page {{ pageByType[type] }} / {{ totalPages(type) }}</span>
                <button
                  type="button"
                  :disabled="pageByType[type] === totalPages(type)"
                  :class="[
                    'px-3 py-1 rounded-md text-sm border transition-colors',
                    pageByType[type] === totalPages(type)
                      ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                      : 'border-gray-300 text-gray-700 hover:bg-cream-100 cursor-pointer',
                  ]"
                  @click="goToPage(type, pageByType[type] + 1)"
                >
                  Suivant
                </button>
              </div>
            </div>
          </template>
        </div>
      </section>
    </div>
  </AdminShell>
</template>

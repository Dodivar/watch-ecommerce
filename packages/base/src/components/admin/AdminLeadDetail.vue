<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { getLeadByIdForAdmin, updateLeadStatus } from '@/services/admin/adminLeadService'
import {
  LEAD_TYPE_LABELS,
  LEAD_STATUS_LABELS,
  formatLeadSlot,
  formatLeadDate,
  formatLeadDateTime,
  formatLeadPrice,
  formatLeadBudget,
  getLeadWatchLink,
  getUnmappedPayloadKeys,
} from '@/utils/leadDisplay'
import AdminShell from './AdminShell.vue'

const route = useRoute()
const leadId = computed(() => route.params.id)
const lead = ref(null)
const isLoading = ref(true)
const error = ref(null)

const payload = computed(() => lead.value?.payload || {})
const watchLink = computed(() => (lead.value ? getLeadWatchLink(lead.value) : null))
const unmappedKeys = computed(() =>
  lead.value ? getUnmappedPayloadKeys(payload.value) : [],
)

async function load() {
  try {
    isLoading.value = true
    lead.value = await getLeadByIdForAdmin(leadId.value)
    if (!lead.value) error.value = 'Message introuvable'
    else if (lead.value.status === 'new') {
      await updateLeadStatus(leadId.value, 'read')
      lead.value = { ...lead.value, status: 'read' }
    }
  } catch (err) {
    error.value = err.message
  } finally {
    isLoading.value = false
  }
}

async function setStatus(status) {
  await updateLeadStatus(leadId.value, status)
  await load()
}

onMounted(load)
</script>

<template>
  <AdminShell
    title="Message"
    show-back-button
    back-button-route="/admin/leads"
    back-button-text="Messages"
    content-class="max-w-3xl"
  >
    <div v-if="error" class="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-4">{{ error }}</div>
    <div v-if="isLoading" class="text-center py-12">Chargement…</div>

    <template v-else-if="lead">
      <div class="bg-white rounded-lg shadow p-6 mb-6">
        <div class="flex flex-wrap items-center gap-3 mb-2">
          <span class="text-lg font-semibold">{{ LEAD_TYPE_LABELS[lead.type] || lead.type }}</span>
          <span
            class="text-xs uppercase tracking-wide px-2 py-1 rounded-full"
            :class="
              lead.status === 'new'
                ? 'bg-primary/10 text-primary font-semibold'
                : lead.status === 'archived'
                  ? 'bg-gray-100 text-gray-600'
                  : 'bg-cream text-gray-700'
            "
          >
            {{ LEAD_STATUS_LABELS[lead.status] || lead.status }}
          </span>
        </div>
        <p class="text-sm text-gray-600">Reçu le {{ formatLeadDateTime(lead.createdAt) }}</p>
      </div>

      <div class="bg-white rounded-lg shadow p-6 mb-6">
        <h2 class="text-lg font-semibold mb-4">Coordonnées</h2>
        <dl class="space-y-2 text-sm">
          <div v-if="lead.type !== 'contact' && payload.nickname" class="flex gap-2">
            <dt class="font-medium text-gray-600 min-w-[140px]">Prénom</dt>
            <dd>{{ payload.nickname }}</dd>
          </div>
          <div v-if="lead.customerName || payload.name" class="flex gap-2">
            <dt class="font-medium text-gray-600 min-w-[140px]">Nom</dt>
            <dd>{{ lead.customerName || payload.name }}</dd>
          </div>
          <div v-if="lead.customerEmail || payload.email" class="flex gap-2">
            <dt class="font-medium text-gray-600 min-w-[140px]">Email</dt>
            <dd>
              <a
                :href="`mailto:${lead.customerEmail || payload.email}`"
                class="text-primary underline"
              >
                {{ lead.customerEmail || payload.email }}
              </a>
            </dd>
          </div>
          <div v-if="payload.tel" class="flex gap-2">
            <dt class="font-medium text-gray-600 min-w-[140px]">Téléphone</dt>
            <dd>
              <a :href="`tel:${payload.tel}`" class="text-primary underline">{{ payload.tel }}</a>
            </dd>
          </div>
          <div v-if="payload.contact_mode" class="flex gap-2">
            <dt class="font-medium text-gray-600 min-w-[140px]">Préférence de contact</dt>
            <dd>{{ payload.contact_mode }}</dd>
          </div>
        </dl>
      </div>

      <div v-if="lead.type === 'appointment'" class="bg-white rounded-lg shadow p-6 mb-6">
        <h2 class="text-lg font-semibold mb-4">Rendez-vous</h2>
        <dl class="space-y-2 text-sm">
          <div class="flex gap-2">
            <dt class="font-medium text-gray-600 min-w-[140px]">Date</dt>
            <dd>{{ formatLeadDate(payload.date) }}</dd>
          </div>
          <div class="flex gap-2">
            <dt class="font-medium text-gray-600 min-w-[140px]">Créneau</dt>
            <dd>{{ formatLeadSlot(payload.time_slot) }}</dd>
          </div>
        </dl>
      </div>

      <div
        v-if="lead.type === 'appointment' || payload.watch_name"
        class="bg-white rounded-lg shadow p-6 mb-6"
      >
        <h2 class="text-lg font-semibold mb-4">Montre concernée</h2>
        <dl class="space-y-2 text-sm">
          <div v-if="payload.watch_name" class="flex gap-2">
            <dt class="font-medium text-gray-600 min-w-[140px]">Modèle</dt>
            <dd>{{ payload.watch_name }}</dd>
          </div>
          <div v-if="payload.watch_price" class="flex gap-2">
            <dt class="font-medium text-gray-600 min-w-[140px]">Prix affiché</dt>
            <dd>{{ formatLeadPrice(payload.watch_price) }}</dd>
          </div>
          <div v-if="watchLink || lead.watchId" class="flex gap-2">
            <dt class="font-medium text-gray-600 min-w-[140px]">Fiche produit</dt>
            <dd class="space-x-3">
              <a
                v-if="watchLink"
                :href="watchLink"
                target="_blank"
                rel="noopener noreferrer"
                class="text-primary underline"
              >
                Voir la fiche produit
              </a>
              <RouterLink
                v-if="lead.watchId"
                :to="`/admin/watches/${lead.watchId}/edit`"
                class="text-gray-600 underline"
              >
                Modifier en admin
              </RouterLink>
            </dd>
          </div>
        </dl>
      </div>

      <div
        v-if="lead.type === 'estimation' || lead.type === 'search'"
        class="bg-white rounded-lg shadow p-6 mb-6"
      >
        <h2 class="text-lg font-semibold mb-4">
          {{ lead.type === 'estimation' ? 'Détails de la montre' : 'Critères de recherche' }}
        </h2>
        <dl class="space-y-2 text-sm">
          <div v-if="payload.brand" class="flex gap-2">
            <dt class="font-medium text-gray-600 min-w-[140px]">Marque</dt>
            <dd>{{ payload.brand }}</dd>
          </div>
          <div v-if="payload.model" class="flex gap-2">
            <dt class="font-medium text-gray-600 min-w-[140px]">Modèle</dt>
            <dd>{{ payload.model }}</dd>
          </div>
          <template v-if="lead.type === 'estimation'">
            <div v-if="payload.serienumber" class="flex gap-2">
              <dt class="font-medium text-gray-600 min-w-[140px]">Numéro de série</dt>
              <dd>{{ payload.serienumber }}</dd>
            </div>
            <div v-if="payload.year" class="flex gap-2">
              <dt class="font-medium text-gray-600 min-w-[140px]">Année</dt>
              <dd>{{ payload.year }}</dd>
            </div>
            <div v-if="payload.etat || payload.condition" class="flex gap-2">
              <dt class="font-medium text-gray-600 min-w-[140px]">État général</dt>
              <dd>{{ payload.etat || payload.condition }}</dd>
            </div>
            <div v-if="payload.possession" class="flex gap-2">
              <dt class="font-medium text-gray-600 min-w-[140px]">État de possession</dt>
              <dd>{{ payload.possession }}</dd>
            </div>
          </template>
          <template v-else>
            <div
              v-if="payload.budget_min || payload.budget_max"
              class="flex gap-2"
            >
              <dt class="font-medium text-gray-600 min-w-[140px]">Budget</dt>
              <dd>{{ formatLeadBudget(payload.budget_min, payload.budget_max) }}</dd>
            </div>
            <div v-if="payload.condition" class="flex gap-2">
              <dt class="font-medium text-gray-600 min-w-[140px]">État souhaité</dt>
              <dd>{{ payload.condition }}</dd>
            </div>
            <div v-if="payload.delai" class="flex gap-2">
              <dt class="font-medium text-gray-600 min-w-[140px]">Délai souhaité</dt>
              <dd>{{ payload.delai }}</dd>
            </div>
          </template>
        </dl>
      </div>

      <div v-if="payload.message" class="bg-white rounded-lg shadow p-6 mb-6">
        <h2 class="text-lg font-semibold mb-4">Message</h2>
        <p class="text-sm text-gray-700 whitespace-pre-wrap">{{ payload.message }}</p>
      </div>

      <div
        v-if="payload.attachments?.length"
        class="bg-white rounded-lg shadow p-6 mb-6"
      >
        <h2 class="text-lg font-semibold mb-4">Pièces jointes</h2>
        <ul class="list-disc list-inside text-sm space-y-1">
          <li v-for="(file, index) in payload.attachments" :key="index">
            {{ file.name || file }}
          </li>
        </ul>
      </div>

      <details v-if="unmappedKeys.length" class="bg-white rounded-lg shadow p-6 mb-6">
        <summary class="text-sm font-medium text-gray-600 cursor-pointer">Données techniques</summary>
        <dl class="mt-4 space-y-2 text-sm">
          <div v-for="key in unmappedKeys" :key="key" class="flex gap-2">
            <dt class="font-medium text-gray-600 min-w-[140px]">{{ key }}</dt>
            <dd>{{ payload[key] }}</dd>
          </div>
        </dl>
      </details>

      <div class="flex flex-wrap gap-2">
        <button
          v-if="lead.status !== 'read'"
          type="button"
          class="px-4 py-2 border rounded-lg"
          @click="setStatus('read')"
        >
          Marquer lu
        </button>
        <button
          v-if="lead.status !== 'archived'"
          type="button"
          class="px-4 py-2 border rounded-lg"
          @click="setStatus('archived')"
        >
          Archiver
        </button>
        <a
          v-if="lead.customerEmail || payload.email"
          :href="`mailto:${lead.customerEmail || payload.email}`"
          class="px-4 py-2 bg-primary text-white rounded-lg"
        >
          Répondre
        </a>
      </div>
    </template>
  </AdminShell>
</template>

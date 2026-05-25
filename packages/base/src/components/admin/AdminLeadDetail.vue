<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { getLeadByIdForAdmin, updateLeadStatus } from '@/services/admin/adminLeadService'
import AdminShell from './AdminShell.vue'

const route = useRoute()
const leadId = computed(() => route.params.id)
const lead = ref(null)
const isLoading = ref(true)
const error = ref(null)

const typeLabels = { contact: 'Contact', appointment: 'RDV', estimation: 'Estimation', search: 'Recherche' }

async function load() {
  try {
    isLoading.value = true
    lead.value = await getLeadByIdForAdmin(leadId.value)
    if (!lead.value) error.value = 'Message introuvable'
    else if (lead.value.status === 'new') await updateLeadStatus(leadId.value, 'read')
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
      <div v-else-if="lead" class="bg-white rounded-lg shadow p-6 space-y-4">
        <p><strong>Type :</strong> {{ typeLabels[lead.type] }}</p>
        <p v-if="lead.customerName"><strong>Nom :</strong> {{ lead.customerName }}</p>
        <p v-if="lead.customerEmail"><strong>Email :</strong> {{ lead.customerEmail }}</p>
        <div>
          <strong>Détails :</strong>
          <pre class="mt-2 p-3 bg-cream rounded text-sm overflow-x-auto">{{ JSON.stringify(lead.payload, null, 2) }}</pre>
        </div>
        <div class="flex gap-2 pt-4">
          <button type="button" class="px-4 py-2 border rounded-lg" @click="setStatus('read')">Marquer lu</button>
          <button type="button" class="px-4 py-2 border rounded-lg" @click="setStatus('archived')">Archiver</button>
          <a v-if="lead.customerEmail" :href="`mailto:${lead.customerEmail}`" class="px-4 py-2 bg-primary text-white rounded-lg">Répondre</a>
        </div>
      </div>
  </AdminShell>
</template>

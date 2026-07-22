<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Save, Send, Mail, ArrowLeft, CalendarClock, Ban } from '@lucide/vue'
import {
  getCampaign,
  createCampaign,
  updateCampaign,
  sendCampaign,
  sendTestCampaign,
  scheduleCampaign,
  cancelScheduledCampaign,
  getSettings,
  getSubscribedCount,
  getCampaignRecipients,
} from '@/services/admin/adminNewsletterService'
import { buildNewsletterPreview } from '@/utils/newsletterPreview.js'
import AdminShell from './AdminShell.vue'
import NewsletterRichEditor from './NewsletterRichEditor.vue'

const route = useRoute()
const router = useRouter()

const campaignId = ref(route.params.id || null)
const subject = ref('')
const bodyHtml = ref('')
const status = ref('draft')
const scheduledAt = ref(null)
const scheduleInput = ref('')
const settings = ref({})
const subscribedCount = ref(0)

const isLoading = ref(true)
const isSaving = ref(false)
const isSending = ref(false)
const error = ref(null)
const notice = ref(null)

const recipients = ref([])

const isScheduled = computed(() => status.value === 'scheduled')
const isReadOnly = computed(
  () => status.value === 'sent' || status.value === 'sending' || isScheduled.value,
)
const previewHtml = computed(() => buildNewsletterPreview(settings.value, bodyHtml.value))
const hasAudience = computed(() => subscribedCount.value > 0)

// Lecture seule : le corps est rendu dans une iframe sandbox (jamais en v-html
// direct — le HTML stocké n'est assaini que côté serveur à l'envoi).
const readOnlyBodyDoc = computed(
  () => `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"></head>
<body style="font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;line-height:1.6;color:#333;margin:0;padding:16px;">
${bodyHtml.value || '<p style="color:#999;">(Aucun contenu)</p>'}</body></html>`,
)

const deliverySummary = computed(() => {
  const sent = recipients.value.filter((r) => r.status === 'sent').length
  const failed = recipients.value.filter((r) => r.status === 'failed')
  const pending = recipients.value.length - sent - failed.length
  return { sent, failed, pending }
})

async function loadDeliveryReport() {
  if (!campaignId.value || !['sent', 'failed', 'sending'].includes(status.value)) {
    recipients.value = []
    return
  }
  try {
    recipients.value = await getCampaignRecipients(campaignId.value)
  } catch {
    recipients.value = [] // Rapport indisponible : non bloquant.
  }
}

/** Formate une date ISO en valeur `datetime-local` (heure locale). */
function toDatetimeLocal(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** Valeur `datetime-local` par défaut : dans 1 heure. */
function defaultScheduleInput() {
  return toDatetimeLocal(new Date(Date.now() + 60 * 60 * 1000).toISOString())
}

function formatScheduled(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })
}

async function load() {
  try {
    isLoading.value = true
    error.value = null
    const [loadedSettings, count] = await Promise.all([getSettings(), getSubscribedCount()])
    settings.value = loadedSettings
    subscribedCount.value = count

    if (campaignId.value) {
      const campaign = await getCampaign(campaignId.value)
      if (!campaign) {
        error.value = 'Campagne introuvable'
        return
      }
      subject.value = campaign.subject
      bodyHtml.value = campaign.bodyHtml
      status.value = campaign.status
      scheduledAt.value = campaign.scheduledAt || null
      await loadDeliveryReport()
    }
    scheduleInput.value = scheduledAt.value
      ? toDatetimeLocal(scheduledAt.value)
      : defaultScheduleInput()
  } catch (err) {
    error.value = err.message
  } finally {
    isLoading.value = false
  }
}

async function save() {
  if (isReadOnly.value) return null
  try {
    isSaving.value = true
    error.value = null
    notice.value = null
    if (campaignId.value) {
      await updateCampaign(campaignId.value, { subject: subject.value, bodyHtml: bodyHtml.value })
    } else {
      const created = await createCampaign({ subject: subject.value, bodyHtml: bodyHtml.value })
      campaignId.value = created.id
      // Reflète l'id dans l'URL sans recharger.
      router.replace(`/admin/newsletter/${created.id}/edit`)
    }
    notice.value = 'Brouillon enregistré'
    return campaignId.value
  } catch (err) {
    error.value = err.message
    return null
  } finally {
    isSaving.value = false
  }
}

async function sendTest() {
  const id = await save()
  if (!id) return
  const target = window.prompt('Envoyer un test à :', '')
  if (!target) return
  try {
    isSending.value = true
    error.value = null
    await sendTestCampaign(id, target)
    notice.value = `Email de test envoyé à ${target}`
  } catch (err) {
    error.value = err.message
  } finally {
    isSending.value = false
  }
}

async function send() {
  if (!hasAudience.value) {
    error.value = "Aucun abonné à qui envoyer pour le moment."
    return
  }
  if (!subject.value.trim()) {
    error.value = "L'objet est obligatoire."
    return
  }
  const id = await save()
  if (!id) return
  if (
    !window.confirm(
      `Envoyer cette newsletter à ${subscribedCount.value} abonné(s) maintenant ? Cette action est définitive.`,
    )
  ) {
    return
  }
  try {
    isSending.value = true
    error.value = null
    const result = await sendCampaign(id)
    status.value = result.status || 'sent'
    notice.value = `Newsletter envoyée à ${result.sent} destinataire(s).`
    await loadDeliveryReport()
  } catch (err) {
    error.value = err.message
  } finally {
    isSending.value = false
  }
}

async function schedule() {
  if (!hasAudience.value) {
    error.value = 'Aucun abonné à qui envoyer pour le moment.'
    return
  }
  if (!subject.value.trim()) {
    error.value = "L'objet est obligatoire."
    return
  }
  if (!scheduleInput.value) {
    error.value = "Choisissez une date et une heure d'envoi."
    return
  }
  const when = new Date(scheduleInput.value)
  if (Number.isNaN(when.getTime()) || when.getTime() <= Date.now()) {
    error.value = "La date d'envoi doit être dans le futur."
    return
  }
  const id = await save()
  if (!id) return
  try {
    isSending.value = true
    error.value = null
    const updated = await scheduleCampaign(id, when.toISOString())
    status.value = updated.status
    scheduledAt.value = updated.scheduledAt
    notice.value = `Envoi programmé pour le ${formatScheduled(updated.scheduledAt)}.`
  } catch (err) {
    error.value = err.message
  } finally {
    isSending.value = false
  }
}

async function cancelSchedule() {
  if (!campaignId.value) return
  if (!window.confirm('Annuler la programmation de cette newsletter ?')) return
  try {
    isSending.value = true
    error.value = null
    const updated = await cancelScheduledCampaign(campaignId.value)
    status.value = updated.status
    scheduledAt.value = null
    scheduleInput.value = defaultScheduleInput()
    notice.value = 'Programmation annulée.'
  } catch (err) {
    error.value = err.message
  } finally {
    isSending.value = false
  }
}

onMounted(load)
</script>

<template>
  <AdminShell title="Composer une newsletter">
    <button
      type="button"
      class="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-text-main mb-4"
      @click="router.push('/admin/newsletter')"
    >
      <ArrowLeft class="w-4 h-4" :stroke-width="2" /> Retour aux campagnes
    </button>

    <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
      {{ error }}
    </div>
    <div v-if="notice" class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
      {{ notice }}
    </div>
    <div
      v-if="isScheduled"
      class="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg mb-4 text-sm"
    >
      Envoi programmé pour le <strong>{{ formatScheduled(scheduledAt) }}</strong>. La campagne est
      en lecture seule ; annulez la programmation pour la modifier.
    </div>
    <div
      v-else-if="isReadOnly"
      class="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg mb-4 text-sm"
    >
      Cette campagne a déjà été envoyée : elle est en lecture seule.
    </div>

    <div v-if="isLoading" class="text-center py-12 text-gray-500">Chargement…</div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Colonne édition -->
      <div class="space-y-5">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Objet de l'email</label>
          <input
            v-model="subject"
            type="text"
            :disabled="isReadOnly"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none disabled:bg-gray-100"
            placeholder="Ex. Nos nouveautés du mois"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Message</label>
          <NewsletterRichEditor v-if="!isReadOnly" v-model="bodyHtml" />
          <iframe
            v-else
            :srcdoc="readOnlyBodyDoc"
            sandbox=""
            title="Contenu de la campagne"
            class="w-full h-72 border border-gray-200 rounded-lg bg-gray-50"
          />
        </div>

        <!-- Rapport d'envoi (campagnes envoyées / en échec) -->
        <div v-if="recipients.length" class="bg-white border border-gray-200 rounded-lg p-4">
          <p class="text-sm font-medium text-gray-700 mb-1">Rapport d'envoi</p>
          <p class="text-sm text-gray-600">
            <strong class="text-green-700">{{ deliverySummary.sent }}</strong> envoyé(s),
            <strong :class="deliverySummary.failed.length ? 'text-red-700' : 'text-gray-600'">
              {{ deliverySummary.failed.length }}
            </strong>
            en échec<template v-if="deliverySummary.pending">,
              {{ deliverySummary.pending }} en attente</template>.
          </p>
          <ul
            v-if="deliverySummary.failed.length"
            class="mt-2 max-h-40 overflow-y-auto text-xs text-red-700 space-y-1"
          >
            <li v-for="r in deliverySummary.failed" :key="r.email">
              {{ r.email }}<span v-if="r.error" class="text-gray-500"> — {{ r.error }}</span>
            </li>
          </ul>
        </div>

        <div class="bg-white border border-gray-200 rounded-lg p-4">
          <p class="text-sm font-medium text-gray-700 mb-1">Destinataires</p>
          <p class="text-sm text-gray-600">
            La newsletter sera envoyée à
            <strong class="text-text-main">{{ subscribedCount }}</strong>
            abonné(s) ayant explicitement consenti.
          </p>
          <p class="text-xs text-gray-400 mt-2">
            Un lien de désinscription est ajouté automatiquement à chaque email ; toute
            désinscription est respectée sur l'ensemble des envois.
          </p>
        </div>

        <!-- Programmation de l'envoi -->
        <div class="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
          <p class="text-sm font-medium text-gray-700">Programmer l'envoi</p>
          <template v-if="isScheduled">
            <p class="text-sm text-gray-600">
              Envoi prévu le
              <strong class="text-text-main">{{ formatScheduled(scheduledAt) }}</strong>.
            </p>
            <button
              type="button"
              :disabled="isSending"
              class="inline-flex items-center gap-2 px-4 py-2 border border-red-300 text-red-700 rounded-lg text-sm hover:bg-red-50 transition-colors disabled:opacity-50"
              @click="cancelSchedule"
            >
              <Ban class="w-4 h-4" :stroke-width="2" /> Annuler la programmation
            </button>
          </template>
          <template v-else-if="!isReadOnly">
            <div class="flex flex-wrap items-end gap-2">
              <div>
                <label class="block text-xs text-gray-500 mb-1">Date et heure d'envoi</label>
                <input
                  v-model="scheduleInput"
                  type="datetime-local"
                  class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>
              <button
                type="button"
                :disabled="isSending || !hasAudience"
                class="inline-flex items-center gap-2 px-4 py-2 border border-primary text-primary rounded-lg text-sm font-medium hover:bg-cream transition-colors disabled:opacity-50"
                @click="schedule"
              >
                <CalendarClock class="w-4 h-4" :stroke-width="2" /> Programmer l'envoi
              </button>
            </div>
          </template>
        </div>

        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            :disabled="isSaving || isReadOnly"
            class="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-cream transition-colors disabled:opacity-50"
            @click="save"
          >
            <Save class="w-4 h-4" :stroke-width="2" /> {{ isSaving ? 'Enregistrement…' : 'Enregistrer' }}
          </button>
          <button
            type="button"
            :disabled="isSending || isReadOnly"
            class="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-cream transition-colors disabled:opacity-50"
            @click="sendTest"
          >
            <Mail class="w-4 h-4" :stroke-width="2" /> Envoyer un test
          </button>
          <button
            type="button"
            :disabled="isSending || isReadOnly || !hasAudience"
            class="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            @click="send"
          >
            <Send class="w-4 h-4" :stroke-width="2" /> {{ isSending ? 'Envoi…' : 'Envoyer maintenant' }}
          </button>
        </div>
      </div>

      <!-- Colonne aperçu -->
      <div>
        <p class="text-sm font-medium text-gray-700 mb-1">Aperçu</p>
        <iframe
          :srcdoc="previewHtml"
          title="Aperçu de la newsletter"
          sandbox=""
          class="w-full h-[640px] border border-gray-200 rounded-lg bg-white"
        />
      </div>
    </div>
  </AdminShell>
</template>

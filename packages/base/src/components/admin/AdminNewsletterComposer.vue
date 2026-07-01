<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Save, Send, Mail, ArrowLeft } from '@lucide/vue'
import {
  getCampaign,
  createCampaign,
  updateCampaign,
  sendCampaign,
  sendTestCampaign,
  getSettings,
  getSubscribedCount,
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
const settings = ref({})
const subscribedCount = ref(0)

const isLoading = ref(true)
const isSaving = ref(false)
const isSending = ref(false)
const error = ref(null)
const notice = ref(null)

const isReadOnly = computed(() => status.value === 'sent' || status.value === 'sending')
const previewHtml = computed(() => buildNewsletterPreview(settings.value, bodyHtml.value))
const hasAudience = computed(() => subscribedCount.value > 0)

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
    }
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
      v-if="isReadOnly"
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
          <div
            v-else
            class="border border-gray-200 rounded-lg p-4 bg-gray-50 prose max-w-none"
            v-html="bodyHtml"
          />
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
            <Send class="w-4 h-4" :stroke-width="2" /> {{ isSending ? 'Envoi…' : 'Envoyer la newsletter' }}
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

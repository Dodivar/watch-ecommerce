<script setup>
import { ref, computed, onMounted } from 'vue'
import { Save, ArrowLeft } from '@lucide/vue'
import { getSettings, saveSettings } from '@/services/admin/adminNewsletterService'
import { buildNewsletterPreview } from '@/utils/newsletterPreview.js'
import AdminShell from './AdminShell.vue'

const form = ref({
  logoText: '',
  accentColor: '#d4af37',
  headerHtml: '',
  footerHtml: '',
  senderName: '',
  replyTo: '',
})

const isLoading = ref(true)
const isSaving = ref(false)
const error = ref(null)
const notice = ref(null)

const SAMPLE_BODY =
  '<h2>Titre de votre message</h2><p>Voici à quoi ressemblera le contenu de votre newsletter, entouré de votre en-tête et de votre pied de page.</p>'

const previewHtml = computed(() => buildNewsletterPreview(form.value, SAMPLE_BODY))

async function load() {
  try {
    isLoading.value = true
    error.value = null
    const settings = await getSettings()
    form.value = {
      logoText: settings.logoText || '',
      accentColor: settings.accentColor || '#d4af37',
      headerHtml: settings.headerHtml || '',
      footerHtml: settings.footerHtml || '',
      senderName: settings.senderName || '',
      replyTo: settings.replyTo || '',
    }
  } catch (err) {
    error.value = err.message
  } finally {
    isLoading.value = false
  }
}

async function save() {
  try {
    isSaving.value = true
    error.value = null
    notice.value = null
    await saveSettings(form.value)
    notice.value = 'Réglages enregistrés'
  } catch (err) {
    error.value = err.message
  } finally {
    isSaving.value = false
  }
}

onMounted(load)
</script>

<template>
  <AdminShell title="En-tête et pied de page">
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

    <div v-if="isLoading" class="text-center py-12 text-gray-500">Chargement…</div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Texte du logo</label>
            <input
              v-model="form.logoText"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Couleur d'accent</label>
            <div class="flex items-center gap-2">
              <input v-model="form.accentColor" type="color" class="h-10 w-14 border border-gray-300 rounded" />
              <input
                v-model="form.accentColor"
                type="text"
                class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            En-tête personnalisé (HTML, facultatif)
          </label>
          <textarea
            v-model="form.headerHtml"
            rows="3"
            placeholder="Laissez vide pour utiliser le logo par défaut"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-primary focus:outline-none"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Pied de page (HTML, facultatif)
          </label>
          <textarea
            v-model="form.footerHtml"
            rows="4"
            placeholder="Ex. adresse de la boutique, mentions légales…"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-primary focus:outline-none"
          />
          <p class="text-xs text-gray-400 mt-1">
            Le lien de désinscription et le nom de l'expéditeur sont ajoutés automatiquement.
          </p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Nom de l'expéditeur</label>
            <input
              v-model="form.senderName"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Répondre à (facultatif)</label>
            <input
              v-model="form.replyTo"
              type="email"
              placeholder="contact@exemple.fr"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>
        </div>

        <button
          type="button"
          :disabled="isSaving"
          class="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
          @click="save"
        >
          <Save class="w-4 h-4" :stroke-width="2" /> {{ isSaving ? 'Enregistrement…' : 'Enregistrer' }}
        </button>
      </div>

      <div>
        <p class="text-sm font-medium text-gray-700 mb-1">Aperçu</p>
        <iframe
          :srcdoc="previewHtml"
          title="Aperçu du gabarit"
          sandbox=""
          class="w-full h-[560px] border border-gray-200 rounded-lg bg-white"
        />
      </div>
    </div>
  </AdminShell>
</template>

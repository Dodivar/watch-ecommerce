<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { generateArticleFromWatch } from '@/services/n8nService'
import AdminShell from './AdminShell.vue'

const router = useRouter()

// Form state
const watchName = ref('')
const isLoading = ref(false)
const error = ref(null)
const success = ref(null)

const handleSubmit = async (event) => {
  event.preventDefault()
  
  // Validation
  if (!watchName.value.trim()) {
    error.value = 'Le nom de la montre ou de la marque est obligatoire'
    return
  }

  try {
    isLoading.value = true
    error.value = null
    success.value = null

    const result = await generateArticleFromWatch(watchName.value.trim())

    success.value = 'Article généré avec succès ! Le workflow n8n a été déclenché.'
    
    // Réinitialiser le formulaire
    watchName.value = ''

    // Extraire l'ID de l'article depuis la réponse n8n
    // Le workflow n8n peut retourner l'ID dans différentes structures
    let articleId = null
    if (result) {
      // Essayer différentes structures possibles
      articleId = result.id || result.articleId || result.article_id || 
                  (result.data && (result.data.id || result.data.articleId || result.data.article_id)) ||
                  (result.body && (result.body.id || result.body.articleId || result.body.article_id))
    }

    // Rediriger vers l'édition de l'article si l'ID est disponible, sinon vers la liste
    setTimeout(() => {
      if (articleId) {
        router.push(`/admin/articles/${articleId}/edit`)
      } else {
        router.push('/admin/articles')
      }
    }, 2000)
  } catch (err) {
    console.error('Erreur lors de la génération:', err)
    error.value = err.message || 'Une erreur est survenue lors de la génération de l\'article'
  } finally {
    isLoading.value = false
  }
}

const handleCancel = () => {
  router.push('/admin/articles')
}
</script>

<template>
  <AdminShell
    title="Générer un article"
    :show-back-button="true"
    back-button-text="Liste des articles"
    back-button-route="/admin/articles"
    content-class="max-w-4xl"
  >
      <!-- Error State -->
      <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg mb-4 sm:mb-6 text-sm sm:text-base">
        <div class="flex items-start justify-between gap-2">
          <span class="flex-1">{{ error }}</span>
          <button @click="error = null" class="text-red-500 hover:text-red-700 text-xl font-bold leading-none flex-shrink-0">×</button>
        </div>
      </div>

      <!-- Success State -->
      <div v-if="success" class="bg-green-50 border border-green-200 text-green-700 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg mb-4 sm:mb-6 text-sm sm:text-base">
        {{ success }}
      </div>

      <!-- Form -->
      <div class="bg-white rounded-lg shadow p-4 sm:p-6 md:p-8">
        <div class="mb-6">
          <p class="text-gray-600 text-sm sm:text-base">
            Saisissez le nom d'une montre ou d'une marque pour générer automatiquement un article via n8n.
            Le workflow créera l'article dans Supabase avec le contenu généré.
          </p>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4 sm:space-y-6">
          <!-- Watch Name Input -->
          <div>
            <label for="watchName" class="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
              Nom de la montre ou de la marque <span class="text-red-500">*</span>
            </label>
            <input
              id="watchName"
              v-model="watchName"
              type="text"
              required
              :disabled="isLoading"
              class="w-full px-3 sm:px-4 py-2.5 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-cream-100 disabled:cursor-not-allowed"
              placeholder="Ex: Rolex Submariner, Omega, Tag Heuer Monaco..."
            />
            <p class="mt-1.5 sm:mt-2 text-xs sm:text-sm text-gray-500">
              Vous pouvez saisir un modèle spécifique (ex: "Rolex Submariner") ou simplement une marque (ex: "Omega")
            </p>
          </div>

          <!-- Actions -->
          <div class="flex flex-col sm:flex-row sm:justify-end gap-3 sm:gap-4 pt-4 sm:pt-6 border-t border-gray-200">
            <button
              type="button"
              @click="handleCancel"
              :disabled="isLoading"
              class="px-6 py-2.5 sm:py-2 text-gray-700 bg-cream-100 rounded-lg hover:bg-cream-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base font-medium w-full sm:w-auto"
            >
              Annuler
            </button>
            <button
              type="submit"
              :disabled="isLoading || !watchName.trim()"
              class="px-6 py-2.5 sm:py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base w-full sm:w-auto flex items-center justify-center gap-2"
            >
              <svg
                v-if="isLoading"
                class="animate-spin h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span>{{ isLoading ? 'Génération en cours...' : 'Générer l\'article' }}</span>
            </button>
          </div>
        </form>
      </div>
  </AdminShell>
</template>


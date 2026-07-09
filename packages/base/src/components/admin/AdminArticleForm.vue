<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { marked } from 'marked'
import { createArticle, updateArticle, getArticleByIdForAdmin } from '@/services/admin/adminArticleService'
import AdminShell from './AdminShell.vue'

const router = useRouter()
const route = useRoute()

const isEditMode = computed(() => !!route.params.id)
const articleId = computed(() => route.params.id)

// Form state
const formData = ref({
  title: '',
  text: '',
  categories: [],
  is_visible: false,
})

const currentCategory = ref('')
const isLoading = ref(false)
const isSaving = ref(false)
const error = ref(null)
const success = ref(null)
const showPreview = ref(true) // Toggle pour afficher/masquer la prévisualisation

// Computed pour la prévisualisation markdown
const htmlPreview = computed(() => {
  if (!formData.value.text) return ''
  try {
    return marked.parse(formData.value.text)
  } catch {
    return '<p class="text-red-500">Erreur lors du rendu du Markdown</p>'
  }
})

// Methods
const loadArticle = async () => {
  if (!isEditMode.value) return

  try {
    isLoading.value = true
    error.value = null
    const article = await getArticleByIdForAdmin(articleId.value)

    formData.value = {
      title: article.title || '',
      text: article.text || '',
      categories: article.categories && Array.isArray(article.categories) ? [...article.categories] : [],
      is_visible: article.is_visible !== undefined ? article.is_visible : false,
    }
  } catch (err) {
    console.error('Erreur lors du chargement de l\'article:', err)
    error.value = err.message || 'Erreur lors du chargement de l\'article'
  } finally {
    isLoading.value = false
  }
}

const addCategory = () => {
  const category = currentCategory.value.trim()
  if (!category) return

  // Vérifier si la catégorie n'existe pas déjà
  if (!formData.value.categories.includes(category)) {
    formData.value.categories.push(category)
  }

  currentCategory.value = ''
}

const removeCategory = (index) => {
  formData.value.categories.splice(index, 1)
}

const handleCategoryKeyPress = (event) => {
  if (event.key === 'Enter') {
    event.preventDefault()
    addCategory()
  }
}

const handleSubmit = async () => {
  // Validation
  if (!formData.value.title.trim()) {
    error.value = 'Le titre est obligatoire'
    return
  }

  if (!formData.value.text.trim()) {
    error.value = 'Le contenu est obligatoire'
    return
  }

  try {
    isSaving.value = true
    error.value = null
    success.value = null

    const articleData = {
      title: formData.value.title,
      text: formData.value.text,
      categories: formData.value.categories,
      is_visible: formData.value.is_visible,
    }

    let result
    if (isEditMode.value) {
      result = await updateArticle(articleId.value, articleData)
    } else {
      result = await createArticle(articleData)
    }

    if (result.success) {
      success.value = isEditMode.value ? 'Article mis à jour avec succès' : 'Article créé avec succès'
      setTimeout(() => {
        router.push('/admin/articles')
      }, 1500)
    } else {
      error.value = result.error || 'Une erreur est survenue'
    }
  } catch (err) {
    console.error('Erreur lors de la sauvegarde:', err)
    error.value = err.message || 'Une erreur est survenue lors de la sauvegarde'
  } finally {
    isSaving.value = false
  }
}

const handleCancel = () => {
  router.push('/admin/articles')
}

onMounted(async () => {
  await loadArticle()
})
</script>

<template>
  <AdminShell
    :title="isEditMode ? 'Modifier l\'article' : 'Nouvel article'"
    :show-back-button="true"
    back-button-text="Tableau de bord"
    back-button-route="/admin"
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

      <!-- Loading State -->
      <div v-if="isLoading" class="text-center py-12 sm:py-16">
        <div class="inline-block animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-primary mb-4"></div>
        <p class="text-gray-600 text-sm sm:text-base">Chargement de l'article...</p>
      </div>

      <!-- Form -->
      <div v-else class="bg-white rounded-lg shadow p-4 sm:p-6 md:p-8">
        <form @submit.prevent="handleSubmit" class="space-y-4 sm:space-y-6">
          <!-- Title -->
          <div>
            <label for="title" class="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
              Titre <span class="text-red-500">*</span>
            </label>
            <input
              id="title"
              v-model="formData.title"
              type="text"
              required
              class="w-full px-3 sm:px-4 py-2.5 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Titre de l'article"
            />
          </div>

          <!-- Content -->
          <div>
            <label for="text" class="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
              Contenu (Markdown) <span class="text-red-500">*</span>
            </label>
            <textarea
              id="text"
              v-model="formData.text"
              required
              rows="15"
              class="w-full px-3 sm:px-4 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-mono text-sm resize-y"
              placeholder="Écrivez votre article en Markdown..."
            ></textarea>
            <p class="mt-1.5 sm:mt-2 text-xs sm:text-sm text-gray-500">
              Le contenu doit être écrit en Markdown. Vous pouvez utiliser des titres (# ## ###), du texte en gras (**texte**), des listes, etc.
            </p>
          </div>

          <!-- Categories -->
          <div>
            <label for="categories" class="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
              Catégories
            </label>
            <div class="flex flex-col sm:flex-row gap-2 mb-2">
              <input
                id="categories"
                v-model="currentCategory"
                type="text"
                class="flex-1 px-3 sm:px-4 py-2.5 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Ajouter une catégorie"
                @keypress="handleCategoryKeyPress"
              />
              <button
                type="button"
                @click="addCategory"
                class="px-4 sm:px-4 py-2.5 sm:py-2 bg-cream-100 text-gray-700 rounded-lg hover:bg-cream-200 transition-colors text-sm sm:text-sm font-medium whitespace-nowrap"
              >
                Ajouter
              </button>
            </div>
            <div v-if="formData.categories.length > 0" class="flex flex-wrap gap-2">
              <span
                v-for="(category, index) in formData.categories"
                :key="index"
                class="inline-flex items-center px-2.5 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-primary/10 text-primary"
              >
                {{ category }}
                <button
                  type="button"
                  @click="removeCategory(index)"
                  class="ml-1.5 sm:ml-2 text-primary hover:text-green-700 text-base sm:text-lg font-bold leading-none"
                  aria-label="Supprimer la catégorie"
                >
                  ×
                </button>
              </span>
            </div>
            <p v-else class="text-xs sm:text-sm text-gray-500">Aucune catégorie ajoutée</p>
          </div>

          <!-- Visibility -->
          <div>
            <label class="flex items-center gap-3 cursor-pointer">
              <input
                v-model="formData.is_visible"
                type="checkbox"
                class="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary focus:ring-2"
              />
              <div>
                <span class="block text-sm font-medium text-gray-700">
                  Rendre l'article visible par le public
                </span>
                <span class="block text-xs text-gray-500 mt-0.5">
                  Si désactivé, l'article ne sera pas visible sur le site public
                </span>
              </div>
            </label>
          </div>

          <!-- Preview Section -->
          <div v-if="showPreview" class="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-gray-200">
            <div class="mb-3 sm:mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
              <h3 class="text-base sm:text-lg font-medium text-gray-700">Prévisualisation</h3>
              <button
                type="button"
                @click="showPreview = false"
                class="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-cream-100 rounded-lg hover:bg-cream-200 transition-colors flex items-center justify-center gap-1.5 sm:gap-2 w-full sm:w-auto"
              >
                <svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
                <span>Masquer</span>
              </button>
            </div>
            <div class="border border-gray-300 rounded-lg bg-white overflow-hidden">
              <div class="p-3 sm:p-4 md:p-6 prose prose-sm sm:prose-lg max-w-none">
                <div v-if="formData.title" class="mb-3 sm:mb-4">
                  <h1 class="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2 sm:mb-4 border-b-2 border-gray-200 pb-2">{{ formData.title }}</h1>
                </div>
                <div v-if="formData.categories && formData.categories.length > 0" class="mb-3 sm:mb-4 flex flex-wrap gap-1.5 sm:gap-2">
                  <span
                    v-for="(category, index) in formData.categories"
                    :key="index"
                    class="inline-block px-2.5 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm font-semibold rounded-full bg-primary/10 text-primary"
                  >
                    {{ category }}
                  </span>
                </div>
                <div v-html="htmlPreview" class="article-preview"></div>
                <div v-if="!formData.text" class="text-gray-400 italic text-sm sm:text-base">
                  La prévisualisation apparaîtra ici...
                </div>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0 pt-4 sm:pt-6 border-t border-gray-200">
            <button
              v-if="!showPreview"
              type="button"
              @click="showPreview = true"
              class="px-4 py-2.5 sm:py-2 text-sm font-medium text-gray-700 bg-cream-100 rounded-lg hover:bg-cream-200 transition-colors flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span>Afficher la prévisualisation</span>
            </button>
            <div v-else class="hidden sm:block"></div>
            <div class="flex flex-col sm:flex-row gap-2 sm:space-x-4 w-full sm:w-auto">
              <button
                type="button"
                @click="handleCancel"
                class="px-6 py-2.5 sm:py-2 text-gray-700 bg-cream-100 rounded-lg hover:bg-cream-200 transition-colors text-sm sm:text-base font-medium w-full sm:w-auto"
              >
                Annuler
              </button>
              <button
                type="submit"
                :disabled="isSaving"
                class="px-6 py-2.5 sm:py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base w-full sm:w-auto"
              >
                {{ isSaving ? 'Enregistrement...' : isEditMode ? 'Mettre à jour' : 'Créer l\'article' }}
              </button>
            </div>
          </div>
        </form>
      </div>
  </AdminShell>
</template>

<style scoped>
/* Styles pour la prévisualisation markdown (similaires à BlogDetail.vue) */
:deep(.article-preview) {
  color: #374151;
  line-height: 1.75;
}

:deep(.article-preview h1),
:deep(.article-preview h2),
:deep(.article-preview h3),
:deep(.article-preview h4) {
  color: #1f2937;
  font-weight: 700;
  margin-top: 2em;
  margin-bottom: 1em;
}

:deep(.article-preview h1) {
  font-size: 1.75em;
  border-bottom: 2px solid #e5e7eb;
  padding-bottom: 0.5em;
}

@media (min-width: 640px) {
  :deep(.article-preview h1) {
    font-size: 2.25em;
  }
}

:deep(.article-preview h2) {
  font-size: 1.5em;
}

@media (min-width: 640px) {
  :deep(.article-preview h2) {
    font-size: 1.875em;
  }
}

:deep(.article-preview h3) {
  font-size: 1.25em;
}

@media (min-width: 640px) {
  :deep(.article-preview h3) {
    font-size: 1.5em;
  }
}

:deep(.article-preview p) {
  margin-bottom: 1.25em;
}

:deep(.article-preview ul),
:deep(.article-preview ol) {
  margin-bottom: 1.25em;
  padding-left: 1.625em;
}

:deep(.article-preview li) {
  margin-bottom: 0.5em;
}

:deep(.article-preview a) {
  color: #16a34a;
  text-decoration: underline;
}

:deep(.article-preview a:hover) {
  color: #15803d;
}

:deep(.article-preview code) {
  background-color: #f3f4f6;
  padding: 0.125em 0.375em;
  border-radius: 0.25em;
  font-size: 0.875em;
  font-family: 'Courier New', monospace;
}

:deep(.article-preview pre) {
  background-color: #1f2937;
  color: #f9fafb;
  padding: 1em;
  border-radius: 0.5em;
  overflow-x: auto;
  margin-bottom: 1.25em;
}

:deep(.article-preview pre code) {
  background-color: transparent;
  padding: 0;
  color: inherit;
}

:deep(.article-preview blockquote) {
  border-left: 4px solid #16a34a;
  padding-left: 1em;
  margin-left: 0;
  margin-bottom: 1.25em;
  color: #6b7280;
  font-style: italic;
}

:deep(.article-preview img) {
  max-width: 100%;
  height: auto;
  border-radius: 0.5em;
  margin: 1.5em 0;
}

:deep(.article-preview table) {
  width: 100%;
  border-collapse: collapse;
  margin: 1.5em 0;
}

:deep(.article-preview th),
:deep(.article-preview td) {
  border: 1px solid #e5e7eb;
  padding: 0.75em;
  text-align: left;
}

:deep(.article-preview th) {
  background-color: #f9fafb;
  font-weight: 600;
}

:deep(.article-preview hr) {
  border: none;
  border-top: 2px solid #e5e7eb;
  margin: 2em 0;
}
</style>


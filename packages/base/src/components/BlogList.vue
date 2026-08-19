<template>
  <section class="py-10 min-h-screen">
    <div class="max-w-7xl mx-auto px-4">
      <!-- Header -->
      <div class="text-center mb-8">
        <h1 class="text-4xl font-bold text-text-main mb-3">{{ t('blog.title') }}</h1>
        <p class="text-xl text-gray-600 font-light max-w-3xl mx-auto">
          {{ t('blog.intro') }}
        </p>
      </div>

      <!-- Filters Bar -->
      <div class="bg-white rounded-md shadow-lg p-6 mb-8">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div class="flex flex-wrap gap-4">
            <button
              @click="selectedCategory = null"
              :class="[
                'px-4 py-2 rounded-lg font-medium transition-colors',
                selectedCategory === null
                  ? 'bg-primary text-white'
                  : 'bg-cream-100 text-gray-700 hover:bg-cream-200',
              ]"
            >
              {{ t('blog.allCategories') }}
            </button>
            <button
              v-for="category in categories"
              :key="category"
              @click="selectedCategory = category"
              :class="[
                'px-4 py-2 rounded-lg font-medium transition-colors',
                selectedCategory === category
                  ? 'bg-primary text-white'
                  : 'bg-cream-100 text-gray-700 hover:bg-cream-200',
              ]"
            >
              {{ category }}
            </button>
          </div>

          <div class="text-sm text-gray-600 font-light">
            {{ total }} article{{ total > 1 ? 's' : '' }}
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="text-center py-10">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-3"></div>
        <p class="text-gray-600">{{ t('blog.loadingArticles') }}</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="text-center py-10">
        <div class="text-red-500 mb-3">
          <svg class="w-16 h-16 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 class="text-xl text-gray-900 mb-2">{{ t('watch.loadError') }}</h3>
        <p class="text-gray-600 mb-3">{{ error }}</p>
        <button
          @click="loadArticles"
          class="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
        >
          {{ t('common.retry') }}
        </button>
      </div>

      <!-- Articles Grid -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <article
          v-for="article in articles"
          :key="article.id"
          class="bg-white rounded-md shadow-lg overflow-hidden hover:shadow-xl transition-shadow animate-fade-in cursor-pointer"
          @click="handleViewArticle(article.id)"
        >
            <div class="p-6">
              <h2 class="text-xl font-bold text-text-main mb-2 line-clamp-2">{{ article.title }}</h2>
              <p class="text-gray-600 text-sm mb-3 line-clamp-3">
                {{ getExcerpt(article.text) }}
              </p>
              <div v-if="article.categories && article.categories.length > 0" class="mb-3 flex flex-wrap gap-2">
                <span
                  v-for="cat in article.categories"
                  :key="cat"
                  class="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-primary/10 text-primary"
                >
                  {{ cat }}
                </span>
              </div>
              <div class="flex items-center justify-between text-sm text-gray-500">
                <div class="flex items-center gap-4">
                  <span v-if="article.created_at">
                    {{ formatDate(article.created_at) }}
                  </span>
                  <!-- <span v-if="article.view_count !== undefined" class="flex items-center gap-1">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    {{ article.view_count || 0 }}
                  </span> -->
                </div>
                <span class="text-primary font-medium">{{ t('blog.readMore') }}</span>
              </div>
            </div>
          </article>
        </div>

      <!-- Empty State -->
      <div v-if="!isLoading && !error && articles.length === 0" class="text-center py-10">
        <div class="text-gray-400 mb-3">
          <svg class="w-16 h-16 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1"
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 class="text-xl text-gray-600 mb-2">{{ t('blog.noArticles') }}</h3>
        <p class="text-gray-500">{{ t('blog.adjustSearch') }}</p>
      </div>

      <!-- Pagination -->
      <div v-if="!isLoading && !error && totalPages > 1" class="flex justify-center items-center gap-2 mb-8">
        <button
          @click="goToPage(currentPage - 1)"
          :disabled="currentPage === 1"
          :class="[
            'px-4 py-2 rounded-lg font-medium transition-colors',
            currentPage === 1
              ? 'bg-cream-200 text-gray-400 cursor-not-allowed'
              : 'bg-white text-gray-700 hover:bg-cream-100 border border-gray-300',
          ]"
        >
          {{ t('blog.previous') }}
        </button>

        <div class="flex gap-2">
          <button
            v-for="page in visiblePages"
            :key="page"
            @click="goToPage(page)"
            :class="[
              'px-4 py-2 rounded-lg font-medium transition-colors',
              page === currentPage
                ? 'bg-primary text-white'
                : 'bg-white text-gray-700 hover:bg-cream-100 border border-gray-300',
            ]"
          >
            {{ page }}
          </button>
        </div>

        <button
          @click="goToPage(currentPage + 1)"
          :disabled="currentPage === totalPages"
          :class="[
            'px-4 py-2 rounded-lg font-medium transition-colors',
            currentPage === totalPages
              ? 'bg-cream-200 text-gray-400 cursor-not-allowed'
              : 'bg-white text-gray-700 hover:bg-cream-100 border border-gray-300',
          ]"
        >
          Suivant
        </button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useHead } from '@vueuse/head'
import { getAllArticles, getAllCategories } from '@/services/articleService'
import { scrollAnimation } from '@/animation'
import { CANONICAL_BASE_URL } from '@/config'
import { getSiteConfig } from '@/site/getSiteConfig.js'
import { formatDate } from '@/utils/formatters.js'
import { t } from '@/i18n'

const seo = getSiteConfig().seo.blog

// SEO Meta Tags
useHead({
  title: seo.title,
  meta: [
    {
      name: 'description',
      content: seo.metaDescription,
    },
    {
      property: 'og:title',
      content: seo.ogTitle,
    },
    {
      property: 'og:description',
      content: seo.ogDescription,
    },
    {
      property: 'og:url',
        content: `${CANONICAL_BASE_URL}/blog`,
    },
    {
      property: 'og:type',
      content: 'website',
    },
    {
      name: 'twitter:card',
      content: 'summary',
    },
    {
      name: 'twitter:title',
      content: seo.twitterTitle,
    },
    {
      name: 'twitter:description',
      content: seo.twitterDescription,
    },
  ],
  link: [
    {
      rel: 'canonical',
        href: `${CANONICAL_BASE_URL}/blog`,
    },
  ],
})

const router = useRouter()
const route = useRoute()

// State
const articles = ref([])
const categories = ref([])
const isLoading = ref(true)
const error = ref(null)
const currentPage = ref(1)
const total = ref(0)
const totalPages = ref(0)
const selectedCategory = ref(null)
const articlesPerPage = 10

// Computed
const visiblePages = computed(() => {
  const pages = []
  const maxVisible = 5
  let start = Math.max(1, currentPage.value - Math.floor(maxVisible / 2))
  let end = Math.min(totalPages.value, start + maxVisible - 1)

  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1)
  }

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  return pages
})

// Methods
const getExcerpt = (text) => {
  if (!text) return ''
  // Supprimer le markdown basique pour l'extrait
  const plainText = text.replace(/[#*\[\]()]/g, '').replace(/\n/g, ' ')
  return plainText.length > 150 ? plainText.substring(0, 150) + '...' : plainText
}

const handleViewArticle = (articleId) => {
  router.push(`/blog/${articleId}`)
}

const goToPage = (page) => {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
  updateURL()
  loadArticles()
}

const updateURL = () => {
  const query = {}
  if (currentPage.value > 1) {
    query.page = currentPage.value
  }
  if (selectedCategory.value) {
    query.category = selectedCategory.value
  }
  router.replace({ query })
}

const loadArticles = async () => {
  try {
    isLoading.value = true
    error.value = null

    const result = await getAllArticles(
      currentPage.value,
      articlesPerPage,
      selectedCategory.value,
    )

    articles.value = result.articles
    total.value = result.total
    totalPages.value = result.totalPages
  } catch (err) {
    console.error('Erreur lors du chargement des articles:', err)
    error.value = err.message || t('blog.articlesLoadError')
  } finally {
    isLoading.value = false
  }
}

const loadCategories = async () => {
  try {
    const cats = await getAllCategories()
    categories.value = cats
  } catch (err) {
    console.error('Erreur lors du chargement des catégories:', err)
  }
}

// Watch for category changes
watch(selectedCategory, () => {
  currentPage.value = 1
  updateURL()
  loadArticles()
})

// Initialize from URL query params
onMounted(async () => {
  // Récupérer les paramètres de l'URL
  const pageParam = route.query.page
  const categoryParam = route.query.category

  if (pageParam) {
    currentPage.value = parseInt(pageParam) || 1
  }
  if (categoryParam) {
    selectedCategory.value = categoryParam
  }

  await Promise.all([loadCategories(), loadArticles()])
  scrollAnimation()
})
</script>

<style scoped>
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fade-in 0.6s ease-out;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>


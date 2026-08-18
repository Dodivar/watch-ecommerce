<template>
  <section class="py-10 min-h-screen">
    <div class="max-w-4xl mx-auto px-4">
      <!-- Loading State -->
      <div v-if="isLoading" class="text-center py-10">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <p class="text-gray-600">{{ t('blog.loadingArticle') }}</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="text-center py-10">
        <div class="text-red-500 mb-4">
          <svg class="w-16 h-16 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 class="text-xl text-gray-900 mb-2">{{ t('watch.loadError') }}</h3>
        <p class="text-gray-600 mb-4">{{ error }}</p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            @click="loadArticle"
            class="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
          >
            Réessayer
          </button>
          <router-link
            :to="backLink"
            class="px-6 py-2 bg-cream-200 text-gray-700 rounded-lg hover:bg-cream-200 transition-colors inline-flex items-center justify-center"
          >
            {{ backText }}
          </router-link>
        </div>
      </div>

      <!-- Article Content -->
      <article v-else-if="article" class="bg-white rounded-md shadow-lg overflow-hidden">
        <!-- Header -->
        <div class="p-8 border-b border-gray-200">
          <div class="mb-6 flex items-center justify-between">
            <router-link
              :to="backLink"
              class="inline-flex items-center text-primary hover:text-green-700 transition-colors"
            >
              <svg class="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              {{ backText }}
            </router-link>
            
            <!-- Share buttons (discrete in header) -->
            <div class="flex items-center gap-2">
              <button
                @click="shareOnFacebook"
                class="flex items-center justify-center w-8 h-8 rounded-full bg-cream-100 text-gray-600 hover:bg-[#1877F2] hover:text-white transition-colors"
                title="Partager sur Facebook"
                :aria-label="t('watch.shareOnFacebook')"
              >
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </button>
              <button
                @click="shareOnTwitter"
                class="flex items-center justify-center w-8 h-8 rounded-full bg-cream-100 text-gray-600 hover:bg-black hover:text-white transition-colors"
                title="Partager sur X"
                :aria-label="t('watch.shareOnX')"
              >
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </button>
              <button
                @click="shareByEmail"
                class="flex items-center justify-center w-8 h-8 rounded-full bg-cream-100 text-gray-600 hover:bg-gray-600 hover:text-white transition-colors"
                title="Partager par email"
                :aria-label="t('watch.shareByEmail')"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </button>
              <button
                @click="copyUrl"
                class="flex items-center justify-center w-8 h-8 rounded-full bg-cream-100 text-gray-600 hover:bg-primary hover:text-white transition-colors relative"
                :title="urlCopied ? 'URL copiée !' : 'Copier l\'URL'"
                :aria-label="urlCopied ? t('watch.urlCopied') : t('watch.copyUrl')"
              >
                <svg v-if="!urlCopied" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              </button>
            </div>
          </div>

          <h1 class="text-4xl font-bold text-text-main mb-4">{{ article.title }}</h1>

          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">

            <!-- Date -->
            <div v-if="article.created_at" class="flex items-center text-gray-600 text-sm">
              <svg class="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              {{ formatDate(article.created_at) }}
            </div>
            
            <!-- Catégories -->
            <div v-if="article.categories && article.categories.length > 0" class="flex flex-wrap gap-2">
              <span
                v-for="cat in article.categories"
                :key="cat"
                class="inline-block px-4 py-2 text-sm font-semibold rounded-full bg-primary/10 text-primary"
              >
                {{ cat }}
              </span>
            </div>
            <div v-else class="flex-1"></div>
          </div>
        </div>

        <!-- Content -->
        <div class="p-8 prose prose-lg max-w-none">
          <div v-html="htmlContent" class="article-content"></div>
        </div>

        <!-- Footer -->
        <div class="p-8 border-t border-gray-200 bg-white">
          <div class="flex flex-col sm:flex-row justify-between items-center gap-4">
            <router-link
              :to="backLink"
              class="inline-flex items-center text-primary hover:text-green-700 transition-colors"
            >
              <svg class="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              {{ backText }}
            </router-link>

            <div class="flex flex-col items-end gap-4">
              <!-- Share buttons (in footer) -->
              <div class="flex items-center gap-2">
                <button
                  @click="shareOnFacebook"
                  class="flex items-center justify-center w-9 h-9 rounded-full bg-[#1877F2] text-white hover:bg-[#166FE5] transition-colors"
                  title="Partager sur Facebook"
                  :aria-label="t('watch.shareOnFacebook')"
                >
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </button>
                <button
                  @click="shareOnTwitter"
                  class="flex items-center justify-center w-9 h-9 rounded-full bg-black text-white hover:bg-gray-800 transition-colors"
                  title="Partager sur X"
                  :aria-label="t('watch.shareOnX')"
                >
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </button>
                <button
                  @click="shareByEmail"
                  class="flex items-center justify-center w-9 h-9 rounded-full bg-gray-600 text-white hover:bg-gray-700 transition-colors"
                  title="Partager par email"
                  :aria-label="t('watch.shareByEmail')"
                >
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </button>
                <button
                  @click="copyUrl"
                  class="flex items-center justify-center w-9 h-9 rounded-full bg-primary text-white hover:bg-primary-hover transition-colors relative"
                  :title="urlCopied ? 'URL copiée !' : 'Copier l\'URL'"
                  :aria-label="urlCopied ? t('watch.urlCopied') : t('watch.copyUrl')"
                >
                  <svg v-if="!urlCopied" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </button>
              </div>

              <div v-if="article.categories && article.categories.length > 0" class="flex items-center gap-2 flex-wrap justify-end">
                <span class="text-sm text-gray-600">{{ t('blog.categories') }}</span>
                <span
                  v-for="cat in article.categories"
                  :key="cat"
                  class="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-primary/10 text-primary"
                >
                  {{ cat }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useHead } from '@vueuse/head'
import { marked } from 'marked'
import { getArticleById, incrementArticleViewCount } from '@/services/articleService'
import { getArticleByIdForAdmin } from '@/services/admin/adminArticleService'
import { isAdminAuthenticated } from '@/services/admin/adminAuthService'
import { scrollAnimation } from '@/animation'
import { BASE_URL } from '@/config'
import { getSiteConfig } from '@/site/getSiteConfig.js'
import { formatDate } from '@/utils/formatters.js'
import { t } from '@/i18n'

const route = useRoute()
const seoBlog = getSiteConfig().seo.blog

// State
const article = ref(null)
const isLoading = ref(true)
const error = ref(null)
const urlCopied = ref(false)

// Computed
const htmlContent = computed(() => {
  if (!article.value || !article.value.text) return ''
  return marked.parse(article.value.text)
})

// Computed pour le lien de retour (vers la montre si on vient d'une montre, sinon vers le blog)
const backLink = computed(() => {
  const fromWatch = route.query.fromWatch
  if (fromWatch) {
    return `/watch/${fromWatch}`
  }
  return '/blog'
})

const backText = computed(() => {
  const fromWatch = route.query.fromWatch
  if (fromWatch) {
    return 'Retour à la montre'
  }
  return 'Retour au blog'
})

// Share methods
const shareOnFacebook = () => {
  const url = encodeURIComponent(canonicalUrl.value)
  const quote = article.value?.title ? encodeURIComponent(article.value.title) : ''
  // Utiliser quote pour ajouter le titre au partage
  const shareUrl = quote 
    ? `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${quote}`
    : `https://www.facebook.com/sharer/sharer.php?u=${url}`
  window.open(shareUrl, '_blank', 'width=600,height=400')
}

const shareOnTwitter = () => {
  const url = encodeURIComponent(canonicalUrl.value)
  const text = encodeURIComponent(article.value?.title || '')
  window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank', 'width=600,height=400')
}

const shareByEmail = () => {
  const subject = encodeURIComponent(article.value?.title || 'Article intéressant')
  const body = encodeURIComponent(`Je vous partage cet article : ${article.value?.title || ''}\n\n${canonicalUrl.value}`)
  window.location.href = `mailto:?subject=${subject}&body=${body}`
}

const copyUrl = async () => {
  try {
    await navigator.clipboard.writeText(canonicalUrl.value)
    urlCopied.value = true
    setTimeout(() => {
      urlCopied.value = false
    }, 2000)
  } catch (err) {
    console.error('Erreur lors de la copie de l\'URL:', err)
    // Fallback pour les navigateurs qui ne supportent pas l'API Clipboard
    const textArea = document.createElement('textarea')
    textArea.value = canonicalUrl.value
    textArea.style.position = 'fixed'
    textArea.style.opacity = '0'
    document.body.appendChild(textArea)
    textArea.select()
    try {
      document.execCommand('copy')
      urlCopied.value = true
      setTimeout(() => {
        urlCopied.value = false
      }, 2000)
    } catch (fallbackErr) {
      console.error('Erreur lors de la copie (fallback):', fallbackErr)
    }
    document.body.removeChild(textArea)
  }
}

const loadArticle = async () => {
  try {
    isLoading.value = true
    error.value = null

    const articleId = route.params.id
    
    // Vérifier si l'utilisateur est admin pour permettre l'affichage des articles non visibles
    const isAdmin = await isAdminAuthenticated()
    
    // Utiliser le service admin si l'utilisateur est admin, sinon le service public
    const data = isAdmin 
      ? await getArticleByIdForAdmin(articleId)
      : await getArticleById(articleId)
    
    article.value = data

    // Incrémenter le compteur de vues uniquement si l'utilisateur n'est pas admin
    if (!isAdmin) {
      // Appeler de manière asynchrone sans bloquer l'affichage
      incrementArticleViewCount(articleId).then((result) => {
        if (!result.success) {
          console.warn('Erreur lors de l\'incrémentation du compteur de vues:', result.error)
        }
      }).catch((err) => {
        // Gérer les erreurs de promesse (ne devrait normalement pas arriver)
        console.error('Erreur inattendue lors de l\'incrémentation du compteur de vues:', err)
      })
    }
  } catch (err) {
    console.error('Erreur lors du chargement de l\'article:', err)
    error.value = err.message || 'Une erreur est survenue lors du chargement de l\'article'
  } finally {
    isLoading.value = false
  }
}

// SEO Meta Tags and Structured Data
const pageTitle = computed(() => {
  if (!article.value) return seoBlog.articleFallbackTitle
  return `${article.value.title} ${seoBlog.articleTitleBlogSuffix}`
})

const pageDescription = computed(() => {
  if (!article.value) return 'Découvrez cet article sur les montres et l\'horlogerie'
  // Extract first paragraph from markdown or use a default description
  const text = article.value.text || ''
  const firstParagraph = text.split('\n\n')[0]?.replace(/[#*]/g, '').trim() || ''
  return firstParagraph.substring(0, 160) || 'Article sur les montres et l\'horlogerie'
})

/**
 * Canonique volontairement **sans préfixe de langue**.
 *
 * Le contenu de cette page vient de la base et n'est pas traduit : `/en/…` et `/de/…` ne font
 * qu'habiller un texte resté français. Pointer la canonique vers la langue par défaut évite de
 * mettre en concurrence des quasi-doublons ; `useLocaleHead()` n'émet pas non plus d'alternates
 * `hreflang` sur ces routes (voir `i18n.untranslatedRoutes`).
 */
const canonicalUrl = computed(() => {
  return `${BASE_URL}/blog/${route.params.id}`
})

const publishedDate = computed(() => {
  if (!article.value?.created_at) return null
  return new Date(article.value.created_at).toISOString()
})

const modifiedDate = computed(() => {
  if (!article.value?.updated_at) return publishedDate.value
  return new Date(article.value.updated_at).toISOString()
})

const ogImage = computed(() => {
  // Utiliser le logo par défaut pour les articles
  return `${BASE_URL}/logo500x500.png`
})

// Structured Data (JSON-LD) for Article
const structuredData = computed(() => {
  if (!article.value) return null

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.value.title,
    description: pageDescription.value,
    datePublished: publishedDate.value,
    dateModified: modifiedDate.value || publishedDate.value,
    author: {
      '@type': 'Organization',
      name: seoBlog.structuredDataPublisherName,
      url: BASE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: seoBlog.structuredDataPublisherName,
      url: BASE_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${BASE_URL}/logo500x500.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonicalUrl.value,
    },
    image: ogImage.value,
    ...(article.value.categories && article.value.categories.length > 0
      ? { keywords: article.value.categories.join(', ') }
      : {}),
  }
})

// Update head when article data changes
watch([article, pageTitle, pageDescription, canonicalUrl, ogImage], () => {
  if (!article.value) return

  useHead({
    title: pageTitle.value,
    meta: [
      {
        name: 'description',
        content: pageDescription.value,
      },
      {
        property: 'og:title',
        content: pageTitle.value,
      },
      {
        property: 'og:description',
        content: pageDescription.value,
      },
      {
        property: 'og:image',
        content: ogImage.value,
      },
      {
        property: 'og:url',
        content: canonicalUrl.value,
      },
      {
        property: 'og:type',
        content: 'article',
      },
      {
        property: 'og:site_name',
        content: seoBlog.structuredDataPublisherName,
      },
      {
        property: 'article:published_time',
        content: publishedDate.value,
      },
      {
        property: 'article:modified_time',
        content: modifiedDate.value || publishedDate.value,
      },
      ...(article.value.categories && article.value.categories.length > 0
        ? article.value.categories.map((cat) => ({
            property: 'article:tag',
            content: cat,
          }))
        : []),
      {
        name: 'twitter:card',
        content: 'summary_large_image',
      },
      {
        name: 'twitter:title',
        content: pageTitle.value,
      },
      {
        name: 'twitter:description',
        content: pageDescription.value,
      },
      {
        name: 'twitter:image',
        content: ogImage.value,
      },
    ],
    link: [
      {
        rel: 'canonical',
        href: canonicalUrl.value,
      },
    ],
    script: structuredData.value
      ? [
          {
            type: 'application/ld+json',
            children: JSON.stringify(structuredData.value),
          },
        ]
      : [],
  })
}, { immediate: true })

onMounted(async () => {
  await loadArticle()
  scrollAnimation()
})
</script>

<style scoped>

/* Styles pour le contenu markdown */
:deep(.article-content) {
  color: #374151;
  line-height: 1.75;
}

:deep(.article-content h1),
:deep(.article-content h2),
:deep(.article-content h3),
:deep(.article-content h4) {
  color: #1f2937;
  font-weight: 700;
  margin-top: 2em;
  margin-bottom: 1em;
}

:deep(.article-content h1) {
  font-size: 2.25em;
  border-bottom: 2px solid #e5e7eb;
  padding-bottom: 0.5em;
}

:deep(.article-content h2) {
  font-size: 1.875em;
}

:deep(.article-content h3) {
  font-size: 1.5em;
}

:deep(.article-content p) {
  margin-bottom: 1.25em;
}

:deep(.article-content ul),
:deep(.article-content ol) {
  margin-bottom: 1.25em;
  padding-left: 1.625em;
}

:deep(.article-content li) {
  margin-bottom: 0.5em;
}

:deep(.article-content a) {
  color: #16a34a;
  text-decoration: underline;
}

:deep(.article-content a:hover) {
  color: #15803d;
}

:deep(.article-content code) {
  background-color: #f3f4f6;
  padding: 0.125em 0.375em;
  border-radius: 0.25em;
  font-size: 0.875em;
  font-family: 'Courier New', monospace;
}

:deep(.article-content pre) {
  background-color: #1f2937;
  color: #f9fafb;
  padding: 1em;
  border-radius: 0.5em;
  overflow-x: auto;
  margin-bottom: 1.25em;
}

:deep(.article-content pre code) {
  background-color: transparent;
  padding: 0;
  color: inherit;
}

:deep(.article-content blockquote) {
  border-left: 4px solid #16a34a;
  padding-left: 1em;
  margin-left: 0;
  margin-bottom: 1.25em;
  color: #6b7280;
  font-style: italic;
}

:deep(.article-content img) {
  max-width: 100%;
  height: auto;
  border-radius: 0.5em;
  margin: 1.5em 0;
}

:deep(.article-content table) {
  width: 100%;
  border-collapse: collapse;
  margin: 1.5em 0;
}

:deep(.article-content th),
:deep(.article-content td) {
  border: 1px solid #e5e7eb;
  padding: 0.75em;
  text-align: left;
}

:deep(.article-content th) {
  background-color: #f9fafb;
  font-weight: 600;
}

:deep(.article-content hr) {
  border: none;
  border-top: 2px solid #e5e7eb;
  margin: 2em 0;
}
</style>


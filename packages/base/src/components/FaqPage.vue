<template>
  <div class="min-h-screen bg-cream">
    <SeoStructuredData v-if="faqStructuredData" :schemas="faqStructuredData" />
    <FaqSection as-page />
  </div>
</template>

<script setup>
import { t } from '@/i18n'
import { computed } from 'vue'
import { useHead } from '@vueuse/head'
import { CANONICAL_BASE_URL } from '@/config'
import SeoStructuredData from '@/components/seo/SeoStructuredData.vue'
import { buildFaqStructuredData } from '@/site/buildFaqStructuredData.js'
import { getSiteConfig } from '@/site/getSiteConfig.js'
import FaqSection from './Faq.vue'

const site = getSiteConfig()
const brandDisplayName = site.brand.displayName || site.brand.legalName
const faqConfig = site.faq || {}
const seo = site.seo?.faq

const fallbackTitle = computed(
  () => `${faqConfig.heading || t('faq.headingFallback')} — ${brandDisplayName}`,
)
const fallbackDescription = computed(
  () =>
    faqConfig.subheading ||
    `Retrouvez les réponses aux questions les plus fréquentes sur ${brandDisplayName}.`,
)

const faqStructuredData = computed(() => buildFaqStructuredData(site, CANONICAL_BASE_URL))

const pageTitle = computed(() => seo?.title ?? fallbackTitle.value)
const pageDescription = computed(() => seo?.metaDescription ?? fallbackDescription.value)
const ogTitle = computed(() => seo?.ogTitle ?? pageTitle.value)
const ogDescription = computed(() => seo?.ogDescription ?? pageDescription.value)
const twitterTitle = computed(() => seo?.twitterTitle ?? pageTitle.value)
const twitterDescription = computed(() => seo?.twitterDescription ?? pageDescription.value)

useHead({
  title: pageTitle,
  meta: [
    { name: 'description', content: pageDescription },
    { property: 'og:title', content: ogTitle },
    { property: 'og:description', content: ogDescription },
    { property: 'og:url', content: `${CANONICAL_BASE_URL}/faq` },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: twitterTitle },
    { name: 'twitter:description', content: twitterDescription },
  ],
  link: [{ rel: 'canonical', href: `${CANONICAL_BASE_URL}/faq` }],
})
</script>

<script>
export default {
  name: 'FaqPage',
}
</script>

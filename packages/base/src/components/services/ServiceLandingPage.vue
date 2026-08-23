<script setup>
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useHead } from '@vueuse/head'

import { CANONICAL_BASE_URL } from '@/config'
import SeoStructuredData from '@/components/seo/SeoStructuredData.vue'
import RepairRequestForm from '@/components/services/RepairRequestForm.vue'
import { buildBreadcrumbStructuredData } from '@/site/buildBreadcrumbStructuredData.js'
import { buildServiceLandingStructuredData } from '@/site/buildServiceLandingStructuredData.js'
import { getSiteConfig } from '@/site/getSiteConfig.js'
import {
  findServiceLanding,
  listRelatedServiceLandings,
} from '@/site/serviceLandings.js'
import { t } from '@/i18n'

/**
 * Page prestation (`/services/:slug`) — une prestation de l'atelier, avec ses tarifs, sa FAQ et
 * le formulaire de prise en charge pré-rempli.
 *
 * Elle existe pour la recherche locale : « changement pile montre Strasbourg » a besoin d'une page
 * qui ne parle que de ça. `/services` reste la page-mère qui les relie toutes.
 */
const site = getSiteConfig()
const features = site.features
const landings = site.servicesPage?.landings || []

const route = useRoute()
const router = useRouter()

const landing = computed(() => findServiceLanding(landings, route.params.serviceSlug))
const related = computed(() =>
  landing.value ? listRelatedServiceLandings(landings, landing.value.slug) : [],
)

/** Slug inconnu (lien mort, prestation retirée du manifest) : renvoyer vers la page-mère. */
watch(
  landing,
  (value) => {
    if (!value) router.replace('/services')
  },
  { immediate: true },
)

const canonicalUrl = computed(() =>
  landing.value ? `${CANONICAL_BASE_URL}${landing.value.path}` : `${CANONICAL_BASE_URL}/services`,
)

const seo = computed(() => landing.value?.seo || {})
const pageTitle = computed(() => seo.value.title || landing.value?.hero.title || '')
const pageDescription = computed(() => seo.value.metaDescription || landing.value?.hero.lead || '')

useHead({
  title: pageTitle,
  meta: computed(() => [
    { name: 'description', content: pageDescription.value },
    { property: 'og:title', content: seo.value.ogTitle || pageTitle.value },
    { property: 'og:description', content: seo.value.ogDescription || pageDescription.value },
    { property: 'og:url', content: canonicalUrl.value },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: seo.value.twitterTitle || pageTitle.value },
    {
      name: 'twitter:description',
      content: seo.value.twitterDescription || pageDescription.value,
    },
  ]),
  link: computed(() => [{ rel: 'canonical', href: canonicalUrl.value }]),
})

const structuredData = computed(() => {
  if (!landing.value) return []
  return [
    ...buildServiceLandingStructuredData(site, landing.value, CANONICAL_BASE_URL, {
      areaServed: site.servicesPage?.areaServed,
    }),
    buildBreadcrumbStructuredData(CANONICAL_BASE_URL, [
      { name: t('common.home'), path: '/' },
      { name: t('services.ourServices'), path: '/services' },
      { name: landing.value.navLabel, path: landing.value.path },
    ]),
  ].filter(Boolean)
})
</script>

<template>
  <div v-if="landing" class="min-h-screen bg-cream">
    <SeoStructuredData :schemas="structuredData" />

    <!-- Hero -->
    <section class="border-b border-cream-300 bg-cream py-12 lg:py-16">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav class="mb-6 text-sm text-gray-500" :aria-label="t('services.ourServices')">
          <RouterLink to="/services" class="hover:text-primary transition-colors">
            {{ t('services.ourServices') }}
          </RouterLink>
          <span class="mx-2" aria-hidden="true">/</span>
          <span class="text-text-main">{{ landing.navLabel }}</span>
        </nav>

        <p
          v-if="landing.hero.eyebrow"
          class="text-sm font-semibold uppercase tracking-[0.2em] text-primary mb-4"
        >
          {{ landing.hero.eyebrow }}
        </p>
        <h1 class="text-4xl lg:text-5xl font-bold text-text-main leading-tight mb-5">
          {{ landing.hero.title }}
        </h1>
        <p v-if="landing.hero.lead" class="text-lg lg:text-xl text-gray-600 leading-relaxed max-w-3xl">
          {{ landing.hero.lead }}
        </p>

        <div class="mt-8 flex flex-col sm:flex-row gap-3">
          <a
            v-if="features.repairRequest"
            href="#devis"
            class="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 font-semibold text-white shadow-lg hover:bg-primaryHover transition-colors"
          >
            {{ t('repair.cta') }}
          </a>
          <a
            v-if="site.contact?.phoneDisplay"
            :href="'tel:' + (site.contact.phoneE164 || site.contact.phoneDisplay)"
            class="inline-flex items-center justify-center rounded-lg border-2 border-primary px-6 py-3 font-semibold text-primary hover:bg-primary/5 transition-colors"
          >
            {{ site.contact.phoneDisplay }}
          </a>
        </div>

        <dl v-if="landing.highlights.length" class="mt-10 grid gap-4 sm:grid-cols-3">
          <div
            v-for="(highlight, index) in landing.highlights"
            :key="index"
            class="rounded-xl bg-white px-5 py-4 shadow-sm ring-1 ring-black/5"
          >
            <dt class="text-xs font-semibold uppercase tracking-wide text-gray-500">
              {{ highlight.label }}
            </dt>
            <dd class="mt-1 text-xl font-bold text-text-main">{{ highlight.value }}</dd>
            <p v-if="highlight.detail" class="mt-1 text-sm text-gray-600">{{ highlight.detail }}</p>
          </div>
        </dl>
      </div>
    </section>

    <!-- Contenu éditorial -->
    <section v-if="landing.body.length" class="py-12 lg:py-16">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid gap-8 lg:grid-cols-2">
          <article
            v-for="(block, index) in landing.body"
            :key="index"
            class="rounded-2xl bg-white p-6 lg:p-8 shadow-lg ring-1 ring-black/5"
          >
            <h2 v-if="block.title" class="text-xl lg:text-2xl font-bold text-text-main mb-3">
              {{ block.title }}
            </h2>
            <!-- Texte du manifest client : le HTML y est volontaire (liens internes, mises en avant). -->
            <p class="text-gray-600 leading-relaxed" v-html="block.text" />
          </article>
        </div>
      </div>
    </section>

    <!-- Tarifs -->
    <section v-if="landing.pricing?.items.length" class="pb-12 lg:pb-16">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="rounded-2xl bg-white p-6 lg:p-8 shadow-lg ring-1 ring-black/5">
          <h2 class="text-2xl font-bold text-text-main mb-1">
            {{ landing.pricing.title || t('serviceLanding.pricingTitle') }}
          </h2>
          <p v-if="landing.pricing.note" class="text-sm text-gray-500 mb-5">
            {{ landing.pricing.note }}
          </p>
          <ul class="divide-y divide-cream-200">
            <li
              v-for="(item, index) in landing.pricing.items"
              :key="index"
              class="flex flex-wrap items-baseline justify-between gap-2 py-3"
            >
              <div class="min-w-0">
                <p class="font-semibold text-text-main">{{ item.label }}</p>
                <p v-if="item.detail" class="text-sm text-gray-600">{{ item.detail }}</p>
              </div>
              <span v-if="item.price" class="font-bold text-primary whitespace-nowrap">
                {{ item.price }}
              </span>
            </li>
          </ul>
        </div>
      </div>
    </section>

    <!-- FAQ prestation -->
    <section v-if="landing.faq.length" class="pb-12 lg:pb-16">
      <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 class="text-2xl lg:text-3xl font-bold text-text-main mb-6">
          {{ t('faq.headingFallback') }}
        </h2>
        <div class="space-y-3">
          <details
            v-for="(entry, index) in landing.faq"
            :key="index"
            class="rounded-xl bg-white px-5 py-4 shadow-sm ring-1 ring-black/5"
          >
            <summary class="cursor-pointer font-semibold text-text-main">
              {{ entry.question }}
            </summary>
            <!-- Réponse rédigée dans le manifest : liens et mises en gras attendus. -->
            <p class="mt-3 text-gray-600 leading-relaxed" v-html="entry.answer" />
          </details>
        </div>
      </div>
    </section>

    <RepairRequestForm
      v-if="features.repairRequest"
      :default-service="landing.repairService"
      :source="landing.slug"
    />

    <!-- Maillage interne -->
    <section class="py-12 lg:py-16 bg-white">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 v-if="related.length" class="text-2xl font-bold text-text-main mb-6">
          {{ t('serviceLanding.otherServices') }}
        </h2>
        <ul v-if="related.length" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <li v-for="item in related" :key="item.slug">
            <RouterLink
              :to="item.path"
              class="block h-full rounded-xl border border-cream-200 bg-cream/50 px-5 py-4 hover:border-primary transition-colors"
            >
              <span class="font-semibold text-text-main">{{ item.navLabel }}</span>
              <p v-if="item.navDescription" class="mt-1 text-sm text-gray-600">
                {{ item.navDescription }}
              </p>
            </RouterLink>
          </li>
        </ul>
        <RouterLink
          to="/services"
          class="mt-6 inline-flex items-center gap-1 font-semibold text-primary hover:text-primaryHover transition-colors"
        >
          {{ t('serviceLanding.allServices') }}
          <span aria-hidden="true">→</span>
        </RouterLink>
      </div>
    </section>
  </div>
</template>

<script>
export default {
  name: 'ServiceLandingPage',
}
</script>

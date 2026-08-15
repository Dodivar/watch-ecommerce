<template>
  <div class="min-h-screen bg-cream">
    <!-- Hero -->
    <section class="relative overflow-hidden bg-cream border-b border-cream-300 py-16 lg:py-24">
      <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          class="grid items-center gap-10 lg:gap-12"
          :class="heroGridClass"
        >
          <div>
            <p class="text-sm font-semibold uppercase tracking-[0.2em] text-primary mb-4">
              {{ about.hero.eyebrow }}
            </p>
            <h1 class="text-4xl lg:text-5xl xl:text-6xl font-bold text-text-main leading-tight mb-5">
              {{ about.hero.title }}
            </h1>
            <p class="text-lg lg:text-xl text-gray-600 leading-relaxed mb-8 max-w-xl">
              {{ about.hero.lead }}
            </p>

            <div
              v-if="about.hero.sinceYear"
              class="inline-flex items-center gap-4 rounded-xl border border-primary/20 bg-white/70 px-5 py-4 shadow-sm backdrop-blur-sm"
            >
              <span
                class="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary text-xl font-bold text-white"
                aria-hidden="true"
              >
                {{ about.hero.sinceYear }}
              </span>
              <div>
                <p class="text-sm font-semibold uppercase tracking-wide text-primary">
                  Spécialiste de la montre
                </p>
                <p class="text-text-main font-medium">Une expertise forgée au fil des décennies</p>
              </div>
            </div>
          </div>

          <div class="relative w-full" :class="heroImageWrapClass">
            <div class="relative overflow-hidden rounded-2xl shadow-2xl ring-1 ring-black/5" :class="heroImageFrameClass">
              <img
                :src="heroImageSrc"
                :alt="`${brandDisplayName} — horlogerie à Strasbourg`"
                class="h-full w-full object-cover object-center"
                loading="eager"
              />
              <p
                class="absolute bottom-5 left-5 right-5 text-sm font-medium text-white"
              >
                <span class="inline-block rounded-lg bg-text-main/75 px-3 py-1.5 shadow-sm">
                  Centre commercial Place des Halles — Strasbourg
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Stats -->
    <section v-if="about.stats?.length" class="relative z-10 -mt-6 pb-4">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div
            v-for="(stat, index) in about.stats"
            :key="index"
            class="rounded-xl bg-white p-6 text-center shadow-lg transition-transform hover:-translate-y-0.5"
          >
            <p class="text-3xl lg:text-4xl font-bold text-primary mb-1">{{ stat.value }}</p>
            <p class="text-base font-semibold text-text-main">{{ stat.label }}</p>
            <p v-if="stat.detail" class="mt-1 text-sm text-gray-500">{{ stat.detail }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Story -->
    <section v-if="about.story" class="py-16 lg:py-20 bg-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid gap-12 lg:grid-cols-12 lg:gap-16 items-start">
          <div class="lg:col-span-7">
            <h2 class="text-3xl lg:text-4xl font-bold text-text-main mb-8">
              {{ about.story.title }}
            </h2>
            <div class="space-y-5 text-gray-600 text-lg leading-relaxed">
              <p v-for="(paragraph, index) in about.story.paragraphs" :key="index">
                {{ paragraph }}
              </p>
            </div>
          </div>

          <blockquote
            v-if="about.story.pullQuote"
            class="lg:col-span-5 relative rounded-2xl bg-primary/10 p-8 lg:p-10 border-l-4 border-primary"
          >
            <svg
              class="absolute top-6 right-6 h-10 w-10 text-primary/20"
              fill="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.016 3.016 0 01-3.016 3.016c-1.518 0-2.74-1.243-2.993-2.785l-.523-.008zm9.834 0c-1.03-1.094-1.583-2.321-1.583-4.31 0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.016 3.016 0 01-3.016 3.016c-1.518 0-2.74-1.243-2.993-2.785l-.523-.008z"
              />
            </svg>
            <p class="text-xl lg:text-2xl font-medium text-text-main leading-snug italic relative z-10">
              « {{ about.story.pullQuote }} »
            </p>
          </blockquote>
        </div>
      </div>
    </section>

    <!-- Styles -->
    <section v-if="about.styles?.length" class="py-16 lg:py-20 bg-cream">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12 max-w-3xl mx-auto">
          <h2 class="text-3xl lg:text-4xl font-bold text-text-main mb-4">
            Un style pour chaque moment
          </h2>
          <p class="text-lg text-gray-600">
            Que vous rêviez d'une montre sport, d'une montre élégante ou d'une mécanique à contempler,
            nous saurons vous guider.
          </p>
        </div>

        <div class="grid gap-6 md:grid-cols-3">
          <article
            v-for="(style, index) in about.styles"
            :key="index"
            class="group relative overflow-hidden rounded-2xl bg-white p-8 shadow-lg transition-all hover:shadow-xl"
          >
            <div
              class="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white transition-transform group-hover:scale-110"
            >
              <StyleIcon :name="style.icon" />
            </div>
            <h3 class="text-xl font-semibold text-text-main mb-3">{{ style.title }}</h3>
            <p class="text-gray-600 leading-relaxed">{{ style.description }}</p>
          </article>
        </div>
      </div>
    </section>

    <!-- Brands -->
    <section v-if="about.brands" class="py-16 lg:py-20 bg-white overflow-hidden">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-10 max-w-3xl mx-auto">
          <h2 class="text-3xl lg:text-4xl font-bold text-text-main mb-4">
            {{ about.brands.title }}
          </h2>
          <p v-if="about.brands.intro" class="text-lg text-gray-600 leading-relaxed">
            {{ about.brands.intro }}
          </p>
        </div>

        <div
          v-if="about.brands.names?.length"
          class="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto"
        >
          <span
            v-for="(name, index) in about.brands.names"
            :key="index"
            class="inline-flex items-center rounded-full border border-cream-300 bg-cream px-4 py-2 text-sm font-medium text-text-main transition-colors hover:border-primary/40 hover:bg-primary/5"
          >
            {{ name }}
          </span>
        </div>
      </div>
    </section>

    <!-- Experience -->
    <section v-if="about.experience?.items?.length" class="py-16 lg:py-20 bg-primary text-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 class="text-3xl lg:text-4xl font-bold text-center mb-12">
          {{ about.experience.title }}
        </h2>

        <div class="grid gap-8 md:grid-cols-3">
          <div
            v-for="(item, index) in about.experience.items"
            :key="index"
            class="rounded-xl bg-white/10 p-8 backdrop-blur-sm ring-1 ring-white/15"
          >
            <span
              class="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-lg font-bold"
              aria-hidden="true"
            >
              {{ index + 1 }}
            </span>
            <h3 class="text-xl font-semibold mb-3">{{ item.title }}</h3>
            <p class="text-white/90 leading-relaxed">{{ item.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Map -->
    <section
      v-if="showStoreMap"
      class="py-16 lg:py-20 bg-cream"
    >
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-10">
          <h2 class="text-3xl lg:text-4xl font-bold text-text-main mb-3">Venez nous rencontrer</h2>
        </div>
        <StoreLocationMap class="rounded-xl shadow-lg" />
      </div>
    </section>

    <!-- Guide promo -->
    <section
      v-if="showGuidePromo"
      class="py-12 lg:py-14 bg-cream border-t border-cream-300"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          class="flex flex-col gap-6 rounded-2xl bg-white p-6 lg:p-8 shadow-lg ring-1 ring-black/5 sm:flex-row sm:items-center sm:justify-between"
        >
          <div class="max-w-2xl">
            <h2 class="text-xl lg:text-2xl font-bold text-text-main mb-2">
              {{ about.guidePromo.title }}
            </h2>
            <p class="text-gray-600 leading-relaxed">
              {{ about.guidePromo.description }}
            </p>
          </div>
          <RouterLink
            :to="about.guidePromo.to || '/guide-horloger'"
            class="inline-flex shrink-0 items-center justify-center bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primaryHover transition-colors shadow-md"
          >
            {{ about.guidePromo.linkLabel || 'Consulter le guide' }}
          </RouterLink>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section v-if="about.cta" class="py-16 bg-white border-t border-cream-300">
      <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 class="text-3xl lg:text-4xl font-bold text-text-main mb-4">
          {{ about.cta.title }}
        </h2>
        <p v-if="about.cta.subtitle" class="text-lg text-gray-600 mb-8 leading-relaxed">
          {{ about.cta.subtitle }}
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <RouterLink
            v-if="features.collection && about.cta.collectionLabel"
            to="/collection"
            class="inline-flex items-center justify-center bg-primary text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-primaryHover transition-all shadow-lg"
          >
            {{ about.cta.collectionLabel }}
          </RouterLink>
          <RouterLink
            to="/contact"
            class="inline-flex items-center justify-center border-2 border-primary text-primary px-8 py-4 rounded-lg text-lg font-semibold hover:bg-primary/5 transition-all"
          >
            {{ about.cta.contactLabel || 'Nous contacter' }}
          </RouterLink>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useHead } from '@vueuse/head'
import { BASE_URL } from '@/config'
import { getSiteConfig } from '@/site/getSiteConfig.js'
import StoreLocationMap from '@/components/StoreLocationMap.vue'
import StyleIcon from '@/components/about/StyleIcon.vue'

const site = getSiteConfig()
const about = site.about
const brandDisplayName = site.brand.displayName
const seo = site.seo.aPropos
const features = site.features
const storeMap = site.storeMap

const heroImageSrc = about.hero?.image || '/brand-logo.jpg'
const isLandscapeHero = about.hero?.imageLayout === 'landscape'

const heroGridClass = computed(() =>
  isLandscapeHero ? 'lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]' : 'lg:grid-cols-2',
)

const heroImageWrapClass = computed(() =>
  isLandscapeHero ? 'lg:justify-self-stretch' : 'flex justify-center lg:justify-end',
)

const heroImageFrameClass = computed(() =>
  isLandscapeHero ? 'aspect-[16/10] w-full' : 'aspect-[4/5] w-full max-w-md mx-auto lg:mx-0 lg:ml-auto',
)

const showStoreMap = computed(() => {
  const center = storeMap?.center
  return (
    Boolean(storeMap?.enabled) &&
    center != null &&
    typeof center.lat === 'number' &&
    typeof center.lng === 'number'
  )
})

const showGuidePromo = computed(
  () => Boolean(features.guidePage && about.guidePromo?.title),
)

useHead({
  title: seo.title,
  meta: [
    { name: 'description', content: seo.metaDescription },
    { property: 'og:title', content: seo.ogTitle },
    { property: 'og:description', content: seo.ogDescription },
    { property: 'og:url', content: `${BASE_URL}/a-propos` },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: seo.twitterTitle },
    { name: 'twitter:description', content: seo.twitterDescription },
  ],
  link: [{ rel: 'canonical', href: `${BASE_URL}/a-propos` }],
})
</script>

<script>
export default {
  name: 'AProposRetail',
}
</script>

<template>
  <div class="min-h-screen bg-cream">
    <!-- Hero -->
    <section class="relative overflow-hidden bg-gradient-to-br from-cream via-cream-100 to-cream-200 py-14 lg:py-20">
      <div
        class="pointer-events-none absolute -right-20 top-0 hidden h-80 w-80 rounded-full bg-primary/10 blur-3xl lg:block"
        aria-hidden="true"
      />
      <div
        class="pointer-events-none absolute -left-16 bottom-0 h-64 w-64 rounded-full bg-primary/5 blur-3xl"
        aria-hidden="true"
      />

      <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="max-w-3xl">
          <p class="text-sm font-semibold uppercase tracking-[0.2em] text-primary mb-4">
            {{ content.hero.eyebrow }}
          </p>
          <h1 class="text-4xl lg:text-5xl font-bold text-text-main leading-tight mb-5">
            {{ content.hero.title }}
          </h1>
          <p class="text-lg lg:text-xl text-gray-600 leading-relaxed">
            {{ content.hero.lead }}
          </p>
        </div>
      </div>
    </section>

    <!-- Grille services -->
    <section class="relative z-10 -mt-8 pb-6 lg:pb-10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid gap-8 lg:grid-cols-2">
          <article
            v-for="section in content.sections"
            :key="section.id"
            class="rounded-2xl bg-white p-6 lg:p-8 shadow-lg ring-1 ring-black/5"
          >
            <div class="flex items-start gap-4 mb-6">
              <span
                class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"
                aria-hidden="true"
              >
                <ServiceIcon :name="section.icon || section.id" />
              </span>
              <div>
                <h2 class="text-xl lg:text-2xl font-bold text-text-main">{{ section.title }}</h2>
                <p v-if="section.intro" class="mt-1 text-gray-600">{{ section.intro }}</p>
              </div>
            </div>

            <ul class="space-y-4">
              <li
                v-for="(item, itemIndex) in section.items"
                :key="itemIndex"
                class="flex gap-3 rounded-xl border border-cream-200 bg-cream/50 px-4 py-3"
              >
                <span
                  class="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary"
                  aria-hidden="true"
                />
                <div class="min-w-0 flex-1">
                  <div class="flex flex-wrap items-center gap-2 mb-0.5">
                    <h3 class="font-semibold text-text-main">{{ item.title }}</h3>
                    <span
                      v-if="item.badge"
                      class="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-primary"
                    >
                      {{ item.badge }}
                    </span>
                    <span
                      v-if="item.price"
                      class="rounded-full bg-primary px-2.5 py-0.5 text-xs font-bold text-white"
                    >
                      {{ item.price }}
                    </span>
                  </div>
                  <p class="text-sm text-gray-600 leading-relaxed">{{ item.description }}</p>
                  <a
                    v-if="item.link?.href"
                    :href="item.link.href"
                    :target="item.link.external === false ? undefined : '_blank'"
                    :rel="item.link.external === false ? undefined : 'noopener noreferrer'"
                    class="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-primaryHover transition-colors"
                  >
                    {{ item.link.label || 'En savoir plus' }}
                    <span aria-hidden="true">→</span>
                  </a>
                </div>
              </li>
            </ul>
          </article>
        </div>
      </div>
    </section>

    <!-- Atelier sur place -->
    <section v-if="content.workshop" class="py-8 lg:py-10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          class="relative overflow-hidden rounded-2xl bg-primary px-6 py-8 lg:px-10 lg:py-10 text-white shadow-xl"
        >
          <div
            class="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl"
            aria-hidden="true"
          />
          <div class="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div class="flex items-start gap-4">
              <span
                class="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/15"
                aria-hidden="true"
              >
                <svg class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="1.75"
                    d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M9.879 16.122A3 3 0 1012.015 3.015L3 12v4h4l8.879-8.879z"
                  />
                </svg>
              </span>
              <div>
                <h2 class="text-2xl font-bold mb-2">{{ content.workshop.title }}</h2>
                <p class="text-white/90 leading-relaxed max-w-2xl">{{ content.workshop.description }}</p>
              </div>
            </div>
            <a
              v-if="site.contact?.phoneDisplay"
              :href="'tel:' + (site.contact.phoneE164 || site.contact.phoneDisplay)"
              class="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-white px-6 py-3 font-semibold text-primary hover:bg-cream transition-colors"
            >
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
              {{ site.contact.phoneDisplay }}
            </a>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section v-if="content.cta" class="py-14 lg:py-16 bg-gradient-to-br from-cream-100 to-cream-200">
      <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 class="text-3xl lg:text-4xl font-bold text-text-main mb-4">{{ content.cta.title }}</h2>
        <p class="text-lg text-gray-600 mb-8">{{ content.cta.subtitle }}</p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <RouterLink
            to="/contact"
            class="inline-flex items-center justify-center bg-primary text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-primaryHover transition-all shadow-lg"
          >
            {{ content.cta.contactLabel || 'Nous contacter' }}
          </RouterLink>
          <a
            v-if="site.contact?.phoneDisplay"
            :href="'tel:' + (site.contact.phoneE164 || site.contact.phoneDisplay)"
            class="inline-flex items-center justify-center border-2 border-primary text-primary px-8 py-4 rounded-lg text-lg font-semibold hover:bg-primary/5 transition-all"
          >
            {{ content.cta.phoneLabel || site.contact.phoneDisplay }}
          </a>
        </div>
        <div
          v-if="(features.guidePage && content.cta.guideLabel) || content.cta.documentHref"
          class="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-6"
        >
          <RouterLink
            v-if="features.guidePage && content.cta.guideLabel"
            :to="content.cta.guideTo || '/guide-horloger'"
            class="inline-flex items-center gap-1 text-primary font-semibold hover:text-primaryHover transition-colors"
          >
            {{ content.cta.guideLabel }}
            <span aria-hidden="true">→</span>
          </RouterLink>
          <a
            v-if="content.cta.documentHref"
            :href="content.cta.documentHref"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1 text-primary font-semibold hover:text-primaryHover transition-colors"
          >
            {{ content.cta.documentLabel || 'Télécharger le guide (PDF)' }}
            <span aria-hidden="true">→</span>
          </a>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { useHead } from '@vueuse/head'
import { BASE_URL } from '@/config'
import { getSiteConfig } from '@/site/getSiteConfig.js'
import ServiceIcon from '@/components/services/ServiceIcon.vue'

const site = getSiteConfig()
const content = site.servicesPage
const features = site.features
const seo = site.seo?.servicesPage

if (seo) {
  useHead({
    title: seo.title,
    meta: [
      { name: 'description', content: seo.metaDescription },
      { property: 'og:title', content: seo.ogTitle },
      { property: 'og:description', content: seo.ogDescription },
      { property: 'og:url', content: `${BASE_URL}/services` },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: seo.twitterTitle },
      { name: 'twitter:description', content: seo.twitterDescription },
    ],
    link: [{ rel: 'canonical', href: `${BASE_URL}/services` }],
  })
}
</script>

<script>
export default {
  name: 'ServicesPage',
}
</script>

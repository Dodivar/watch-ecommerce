<template>
  <div class="min-h-screen bg-cream">
    <!-- Breadcrumb -->
    <nav
      class="border-b border-cream-300 bg-white/80 backdrop-blur-sm"
      aria-label="Fil d'Ariane"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <ol class="flex flex-wrap items-center gap-1.5 text-sm text-subtle">
          <li>
            <RouterLink to="/" class="hover:text-primary transition-colors">Accueil</RouterLink>
          </li>
          <li aria-hidden="true" class="text-gray-300">›</li>
          <li class="font-medium text-text-main" aria-current="page">
            {{ content.hero.title }}
          </li>
        </ol>
      </div>
    </nav>

    <!-- Hero -->
    <section class="relative overflow-hidden bg-gradient-to-br from-cream via-cream-100 to-cream-200 py-12 lg:py-16">
      <div
        class="pointer-events-none absolute -right-20 top-0 hidden h-80 w-80 rounded-full bg-primary/10 blur-3xl lg:block"
        aria-hidden="true"
      />
      <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid items-center gap-10 lg:grid-cols-2 lg:gap-12">
          <div>
            <p class="text-sm font-semibold uppercase tracking-[0.2em] text-primary mb-4">
              {{ content.hero.eyebrow }}
            </p>
            <h1 class="text-4xl lg:text-5xl font-bold text-text-main leading-tight mb-5">
              {{ content.hero.title }}
            </h1>
            <p class="text-lg lg:text-xl text-muted leading-relaxed">
              {{ content.hero.lead }}
            </p>
          </div>
          <GuideImageSlot v-if="content.hero.image" :image="content.hero.image" />
        </div>
      </div>
    </section>

    <!-- Sommaire horizontal -->
    <section class="border-b border-cream-300 bg-white py-8 lg:py-10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p class="text-xs font-semibold uppercase tracking-[0.15em] text-subtle mb-4">
          Sommaire
        </p>
        <nav aria-label="Sommaire du guide">
          <ol class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <li v-for="(entry, index) in content.toc" :key="entry.id">
              <a
                :href="`#${entry.id}`"
                class="group flex h-full flex-col gap-2 rounded-xl border border-cream-200 bg-white px-3 py-4 text-left transition-all hover:border-cream-300 hover:bg-cream/40 hover:shadow-sm"
              >
                <span class="flex items-center gap-2">
                  <span
                    class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cream-200 text-xs font-bold text-muted"
                  >
                    {{ index + 1 }}
                  </span>
                  <AppIcon
                    :name="entry.icon"
                    class="h-4 w-4 shrink-0 text-subtle"
                  />
                </span>
                <span class="text-sm font-medium leading-snug text-text-main">
                  {{ entry.label }}
                </span>
              </a>
            </li>
          </ol>
        </nav>
      </div>
    </section>

    <!-- Sections pleine largeur -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14 space-y-16 lg:space-y-24">
      <article
        v-for="section in content.sections"
        :id="section.id"
        :key="section.id"
        class="scroll-mt-24"
      >
        <!-- Illustration en tête de section -->
        <GuideImageSlot
          v-if="section.image"
          :image="section.image"
          variant="banner"
          class="mb-8"
        />

        <!-- En-tête section -->
        <div class="flex items-start gap-4 mb-8">
          <span
            class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"
            aria-hidden="true"
          >
            <AppIcon :name="section.icon || section.id" class="h-6 w-6" />
          </span>
          <div>
            <h2 class="text-2xl lg:text-3xl font-bold text-text-main">{{ section.title }}</h2>
            <p v-if="section.intro" class="mt-2 text-muted leading-relaxed max-w-4xl">
              {{ section.intro }}
            </p>
          </div>
        </div>

        <!-- FAQ -->
        <div
          v-if="section.layout === 'faq'"
          class="grid gap-4"
          :class="isLongSection(section) ? 'lg:grid-cols-2 lg:gap-5' : 'max-w-3xl'"
        >
          <div
            v-for="(item, idx) in section.items"
            :key="idx"
            class="rounded-xl border border-cream-200 bg-white px-5 py-4 shadow-sm"
          >
            <h3 class="font-semibold text-text-main mb-2">{{ item.question }}</h3>
            <p class="text-sm text-muted leading-relaxed">{{ item.answer }}</p>
          </div>
        </div>

        <!-- Mixed (table + FAQ) -->
        <div v-else-if="section.layout === 'mixed'" class="space-y-6">
          <div
            v-if="section.referenceTable?.length"
            class="overflow-hidden rounded-xl border border-cream-200 bg-white shadow-sm"
          >
            <div class="overflow-x-auto">
              <table class="min-w-full text-sm">
                <thead>
                  <tr class="border-b border-cream-200 bg-cream/50">
                    <th scope="col" class="px-4 py-3 text-left font-semibold text-text-main w-2/5">
                      Marquage
                    </th>
                    <th scope="col" class="px-4 py-3 text-left font-semibold text-text-main">
                      Usage recommandé
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-cream-200">
                  <tr v-for="(row, idx) in section.referenceTable" :key="idx">
                    <td class="px-4 py-3 font-medium text-text-main align-top">
                      {{ row.marking }}
                    </td>
                    <td class="px-4 py-3 text-muted align-top">{{ row.usage }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="grid gap-4 lg:grid-cols-2 lg:gap-5">
            <div
              v-for="(item, idx) in section.items"
              :key="idx"
              class="rounded-xl border border-cream-200 bg-white px-5 py-4 shadow-sm"
            >
              <h3 class="font-semibold text-text-main mb-2">{{ item.question }}</h3>
              <p class="text-sm text-muted leading-relaxed">{{ item.answer }}</p>
            </div>
          </div>
        </div>

        <!-- Definitions -->
        <div v-else-if="section.layout === 'definitions'" class="space-y-6">
          <div class="grid gap-4 sm:grid-cols-3">
            <div
              v-for="(def, idx) in section.definitions"
              :key="idx"
              class="rounded-xl border border-cream-200 bg-white p-5 shadow-sm"
            >
              <h3 class="font-semibold text-text-main mb-2">{{ def.title }}</h3>
              <p class="text-sm text-muted leading-relaxed">{{ def.description }}</p>
            </div>
          </div>

          <div
            v-if="section.precision"
            class="rounded-xl bg-primary/5 border border-primary/15 p-5 lg:p-6 max-w-3xl"
          >
            <h3 class="font-semibold text-text-main mb-4">{{ section.precision.title }}</h3>
            <div class="grid gap-3 sm:grid-cols-2 mb-4">
              <div
                v-for="(row, idx) in section.precision.rows"
                :key="idx"
                class="rounded-lg bg-white px-4 py-3 shadow-sm"
              >
                <p class="text-xs font-semibold uppercase tracking-wide text-primary mb-1">
                  {{ row.type }}
                </p>
                <p class="text-sm font-medium text-text-main">{{ row.value }}</p>
              </div>
            </div>
            <p v-if="section.precision.note" class="text-sm text-muted italic">
              {{ section.precision.note }}
            </p>
          </div>
        </div>

        <!-- Cards -->
        <div
          v-else-if="section.layout === 'cards'"
          class="grid gap-4"
          :class="section.cards?.length === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'"
        >
          <div
            v-for="(card, idx) in section.cards"
            :key="idx"
            class="rounded-xl border border-cream-200 bg-white p-5 shadow-sm"
          >
            <h3 class="font-semibold text-text-main mb-2">{{ card.title }}</h3>
            <p class="text-sm text-muted leading-relaxed">{{ card.description }}</p>
          </div>
        </div>

        <!-- Features -->
        <div
          v-else-if="section.layout === 'features'"
          class="grid gap-8 lg:grid-cols-2 lg:gap-x-10 lg:gap-y-8"
        >
          <div v-for="(group, gIdx) in section.groups" :key="gIdx">
            <h3 class="text-sm font-semibold uppercase tracking-[0.12em] text-primary mb-4">
              {{ group.label }}
            </h3>
            <dl class="space-y-3">
              <div
                v-for="(item, iIdx) in group.items"
                :key="iIdx"
                class="rounded-xl border border-cream-200 bg-white px-5 py-4 shadow-sm"
              >
                <dt class="font-semibold text-text-main mb-1">{{ item.term }}</dt>
                <dd class="text-sm text-muted leading-relaxed">{{ item.description }}</dd>
              </div>
            </dl>
          </div>
        </div>
      </article>
    </div>

    <!-- CTA -->
    <section
      v-if="content.cta"
      class="py-14 lg:py-16 bg-gradient-to-br from-cream-100 to-cream-200 border-t border-cream-300"
    >
      <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 class="text-3xl lg:text-4xl font-bold text-text-main mb-4">{{ content.cta.title }}</h2>
        <p class="text-lg text-muted mb-8">{{ content.cta.subtitle }}</p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <RouterLink
            v-if="features.servicesPage"
            to="/services"
            class="inline-flex items-center justify-center bg-primary text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-primaryHover transition-all shadow-lg"
          >
            {{ content.cta.servicesLabel || 'Nos services' }}
          </RouterLink>
          <RouterLink
            to="/contact"
            class="inline-flex items-center justify-center border-2 border-primary text-primary px-8 py-4 rounded-lg text-lg font-semibold hover:bg-primary/5 transition-all"
          >
            {{ content.cta.contactLabel || 'Nous contacter' }}
          </RouterLink>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { useHead } from '@vueuse/head'
import { BASE_URL } from '@/config'
import { getSiteConfig } from '@/site/getSiteConfig.js'
import AppIcon from '@/components/ui/AppIcon.vue'
import GuideImageSlot from '@/components/guide/GuideImageSlot.vue'

const site = getSiteConfig()
const content = site.guidePage
const features = site.features
const seo = site.seo?.guidePage

function isLongSection(section) {
  if (section.fullWidth != null) return section.fullWidth
  if (section.layout === 'mixed' || section.layout === 'features') return true
  return (section.items?.length ?? 0) > 4
}

if (seo) {
  useHead({
    title: seo.title,
    meta: [
      { name: 'description', content: seo.metaDescription },
      { property: 'og:title', content: seo.ogTitle },
      { property: 'og:description', content: seo.ogDescription },
      { property: 'og:url', content: `${BASE_URL}/guide-horloger` },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: seo.twitterTitle },
      { name: 'twitter:description', content: seo.twitterDescription },
    ],
    link: [{ rel: 'canonical', href: `${BASE_URL}/guide-horloger` }],
  })
}
</script>

<script>
export default {
  name: 'GuidePage',
}
</script>

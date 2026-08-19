<template>
  <div class="min-h-screen bg-white">
    <section class="py-12 border-b border-gray-100">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 class="text-3xl lg:text-4xl font-bold text-text-main mb-3">
          {{ t('legal.mentions') }}
        </h1>
        <p class="text-gray-600 text-sm">
          {{ t('legal.lastUpdated', { date: t('legal.updateDate') }) }}
        </p>
        <!-- `v-html` : la traduction porte un <strong> sur la raison sociale. Contenu
             entièrement issu du catalogue et du manifest, jamais d'une saisie utilisateur. -->
        <p
          class="mt-6 text-gray-700 leading-relaxed [&_strong]:text-text-main"
          v-html="t('legal.mentionsIntro', { company: LEGAL_COMPANY_NAME })"
        ></p>
      </div>
    </section>

    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 text-gray-700 leading-relaxed">
      <section>
        <h2 class="text-xl font-bold text-text-main mb-4">{{ t('legal.publisherTitle') }}</h2>
        <p
          class="[&_strong]:text-text-main"
          v-html="t('legal.publisherText', { company: LEGAL_COMPANY_NAME })"
        ></p>
        <ul v-if="hasLegalDetails" class="mt-3 list-disc pl-5 space-y-1">
          <li v-if="LEGAL_ADDRESS">{{ LEGAL_ADDRESS }}</li>
          <li v-if="LEGAL_SIRET">{{ t('legal.siretLabel', { siret: LEGAL_SIRET }) }}</li>
        </ul>
        <p v-else class="mt-3 text-sm text-gray-600">
          {{ t('legal.registrationFallback') }}
        </p>
        <p class="mt-3">
          {{ t('legal.contactLabel') }}
          <a
            :href="'mailto:' + EMAIL_CONTACT"
            class="font-medium text-primary underline decoration-primary/40 hover:text-primary-hover"
          >{{ EMAIL_CONTACT }}</a
          >.
        </p>
      </section>

      <section>
        <h2 class="text-xl font-bold text-text-main mb-4">{{ t('legal.publicationDirectorTitle') }}</h2>
        <p>
          <span
            class="[&_strong]:text-text-main"
            v-html="t('legal.publicationDirectorText', { company: LEGAL_COMPANY_NAME })"
          ></span>
          <!-- Espace explicite : Vue supprime les blancs entre deux elements. -->
          {{ ' ' }}<a
            :href="'mailto:' + EMAIL_CONTACT"
            class="font-medium text-primary underline decoration-primary/40 hover:text-primary-hover"
          >{{ EMAIL_CONTACT }}</a
          >.
        </p>
      </section>

      <section>
        <h2 class="text-xl font-bold text-text-main mb-4">{{ t('legal.hostingTitle') }}</h2>
        <p class="[&_strong]:text-text-main" v-html="t('legal.hostingText')"></p>
        <p class="mt-2">
          {{ t('legal.providerSite') }}
          <a
            href="https://vercel.com"
            class="font-medium text-primary underline decoration-primary/40 hover:text-primary-hover"
            rel="noopener noreferrer"
            target="_blank"
          >vercel.com</a
          >.
        </p>
      </section>

      <section>
        <h2 class="text-xl font-bold text-text-main mb-4">{{ t('legal.ipTitle') }}</h2>
        <p>
          {{ t('legal.ipText', { company: LEGAL_COMPANY_NAME }) }}
        </p>
        <p class="mt-3">
          {{ t('legal.ipBrandsText') }}
        </p>
      </section>

      <section>
        <h2 class="text-xl font-bold text-text-main mb-4">{{ t('legal.personalDataTitle') }}</h2>
        <p>
          {{ t('legal.personalDataBefore') }}
          <RouterLink
            to="/politique-confidentialite"
            class="font-medium text-primary underline decoration-primary/40 hover:text-primary-hover"
          >{{ t('legal.privacyPolicyLink') }}</RouterLink
          >.
        </p>
      </section>

      <section>
        <h2 class="text-xl font-bold text-text-main mb-4">{{ t('legal.mediationTitle') }}</h2>
        <p>
          {{ t('legal.mediationContactText') }}
          <a
            :href="'mailto:' + EMAIL_CONTACT"
            class="font-medium text-primary underline decoration-primary/40 hover:text-primary-hover"
          >{{ EMAIL_CONTACT }}</a
          >.
        </p>
        <p class="mt-3">
          {{ t('legal.mediationText', { company: LEGAL_COMPANY_NAME }) }}
        </p>
      </section>
    </div>
  </div>
</template>

<script setup>
import { t } from '@/i18n'
import { computed } from 'vue'
import { useHead } from '@vueuse/head'
import {
  EMAIL_CONTACT,
  LEGAL_ADDRESS,
  LEGAL_COMPANY_NAME,
  LEGAL_SIRET,
  CANONICAL_BASE_URL,
} from '@/config'
import { getSiteConfig } from '@/site/getSiteConfig.js'

const hasLegalDetails = computed(() => Boolean(LEGAL_ADDRESS || LEGAL_SIRET))

const seo = getSiteConfig().seo.mentions

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
      content: `${CANONICAL_BASE_URL}/mentions-legales`,
    },
    {
      property: 'og:type',
      content: 'website',
    },
    {
      name: 'twitter:card',
      content: 'summary_large_image',
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
      href: `${CANONICAL_BASE_URL}/mentions-legales`,
    },
  ],
})
</script>

<script>
export default {
  name: 'MentionsLegales',
}
</script>

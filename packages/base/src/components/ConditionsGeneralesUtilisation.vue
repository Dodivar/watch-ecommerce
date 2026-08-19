<template>
  <div class="min-h-screen bg-white">
    <section class="py-12 border-b border-gray-100">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 class="text-3xl lg:text-4xl font-bold text-text-main mb-3">
          {{ t('legal.cguTitle') }}
        </h1>
        <p class="text-gray-600 text-sm">
          {{ t('legal.lastUpdated', { date: t('legal.updateDate') }) }}
        </p>
        <!-- `v-html` : la traduction porte un <strong> interne. Contenu issu du catalogue
             et du manifest, jamais d'une saisie utilisateur. -->
        <p
          class="mt-6 text-gray-700 leading-relaxed [&_strong]:text-text-main"
          v-html="t('legal.cguIntro', { company: LEGAL_COMPANY_NAME })"
        ></p>
      </div>
    </section>

    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 text-gray-700 leading-relaxed">
      <section>
        <h2 class="text-xl font-bold text-text-main mb-4">{{ t('legal.cguPurposeTitle') }}</h2>
        <p>{{ t('legal.cguPurposeText') }}</p>
      </section>

      <section>
        <h2 class="text-xl font-bold text-text-main mb-4">{{ t('legal.cguAccessTitle') }}</h2>
        <p>{{ t('legal.cguAccessText', { company: LEGAL_COMPANY_NAME }) }}</p>
        <p class="mt-3">{{ t('legal.cguAccessText2') }}</p>
      </section>

      <section>
        <h2 class="text-xl font-bold text-text-main mb-4">{{ t('legal.cguServicesTitle') }}</h2>
        <p>{{ t('legal.cguServicesText', { company: LEGAL_COMPANY_NAME }) }}</p>
      </section>

      <section>
        <h2 class="text-xl font-bold text-text-main mb-4">{{ t('legal.cguOrderTitle') }}</h2>
        <p
          v-if="PURCHASE_ENABLED"
          class="[&_strong]:text-text-main"
          v-html="t('legal.cguOrderEnabled')"
        ></p>
        <p
          v-else
          class="[&_strong]:text-text-main"
          v-html="t('legal.cguOrderDisabled', { company: LEGAL_COMPANY_NAME })"
        ></p>
      </section>

      <section>
        <h2 class="text-xl font-bold text-text-main mb-4">{{ t('legal.cguConductTitle') }}</h2>
        <p>{{ t('legal.cguConductText', { company: LEGAL_COMPANY_NAME }) }}</p>
      </section>

      <section>
        <h2 class="text-xl font-bold text-text-main mb-4">{{ t('legal.cguIpTitle') }}</h2>
        <p>{{ t('legal.cguIpText', { company: LEGAL_COMPANY_NAME }) }}</p>
      </section>

      <section>
        <h2 class="text-xl font-bold text-text-main mb-4">{{ t('legal.cguLiabilityTitle') }}</h2>
        <p>{{ t('legal.cguLiabilityText', { company: LEGAL_COMPANY_NAME }) }}</p>
      </section>

      <section>
        <h2 class="text-xl font-bold text-text-main mb-4">{{ t('legal.cguLinksTitle') }}</h2>
        <p>{{ t('legal.cguLinksText', { company: LEGAL_COMPANY_NAME }) }}</p>
      </section>

      <section>
        <h2 class="text-xl font-bold text-text-main mb-4">{{ t('legal.cguChangesTitle') }}</h2>
        <p>{{ t('legal.cguChangesText', { company: LEGAL_COMPANY_NAME }) }}</p>
      </section>

      <section>
        <h2 class="text-xl font-bold text-text-main mb-4">{{ t('legal.cguDataTitle') }}</h2>
        <p>
          {{ t('legal.cguDataBefore') }}
          <RouterLink
            to="/politique-confidentialite"
            class="font-medium text-primary underline decoration-primary/40 hover:text-primary-hover"
          >{{ t('legal.privacyPolicyLink') }}</RouterLink
          >.
        </p>
        <p class="mt-3 [&_strong]:text-text-main" v-html="t('legal.cguLawText')"></p>
        <p class="mt-3">
          {{ t('legal.cguQuestionsText') }}
          <a
            :href="'mailto:' + EMAIL_CONTACT"
            class="font-medium text-primary underline decoration-primary/40 hover:text-primary-hover"
          >{{ EMAIL_CONTACT }}</a
          >.
        </p>
      </section>
    </div>
  </div>
</template>

<script setup>
import { t } from '@/i18n'
import { useHead } from '@vueuse/head'
import { EMAIL_CONTACT, LEGAL_COMPANY_NAME, PURCHASE_ENABLED, CANONICAL_BASE_URL } from '@/config'
import { getSiteConfig } from '@/site/getSiteConfig.js'

const seo = getSiteConfig().seo.cgu

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
      content: `${CANONICAL_BASE_URL}/conditions-generales-utilisation`,
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
      href: `${CANONICAL_BASE_URL}/conditions-generales-utilisation`,
    },
  ],
})
</script>

<script>
export default {
  name: 'ConditionsGeneralesUtilisation',
}
</script>

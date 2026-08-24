<template>
  <div class="min-h-screen bg-white">
    <section class="py-12 border-b border-gray-100">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 class="text-3xl lg:text-4xl font-bold text-text-main mb-3">
          {{ t('legal.privacy') }}
        </h1>
        <p class="text-gray-600 text-sm">
          {{ t('legal.lastUpdated', { date: t('legal.privacyUpdateDate') }) }}
        </p>
        <p class="mt-6 text-gray-700 leading-relaxed">
          {{ t('legal.privacyIntro', { company: LEGAL_COMPANY_NAME }) }}
        </p>
      </div>
    </section>

    <!-- `v-html` : les traductions portent les <strong> internes (bases juridiques, noms de
         prestataires). Contenu issu du catalogue et du manifest, jamais d'une saisie utilisateur. -->
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 text-gray-700 leading-relaxed [&_strong]:text-text-main">
      <section>
        <h2 class="text-xl font-bold text-text-main mb-4">{{ t('legal.controllerTitle') }}</h2>
        <p v-html="t('legal.controllerText', { company: LEGAL_COMPANY_NAME })"></p>
        <ul v-if="hasLegalDetails" class="mt-3 list-disc pl-5 space-y-1">
          <li v-if="LEGAL_ADDRESS">{{ LEGAL_ADDRESS }}</li>
          <li v-if="LEGAL_SIRET">{{ t('legal.siretLabel', { siret: LEGAL_SIRET }) }}</li>
        </ul>
        <p class="mt-3">
          {{ t('legal.privacyContactText') }}
          <a
            :href="'mailto:' + EMAIL_CONTACT"
            class="font-medium text-primary underline decoration-primary/40 hover:text-primary-hover"
          >{{ EMAIL_CONTACT }}</a
          >.
        </p>
      </section>

      <section>
        <h2 class="text-xl font-bold text-text-main mb-4">{{ t('legal.dataCollectedTitle') }}</h2>

        <h3 class="text-lg font-semibold text-text-main mt-6 mb-2">{{ t('legal.analyticsTitle') }}</h3>
        <p v-html="t('legal.analyticsText')"></p>
        <p class="mt-2" v-html="t('legal.legalBasisConsent')"></p>

        <h3 class="text-lg font-semibold text-text-main mt-6 mb-2">{{ t('legal.advertisingTitle') }}</h3>
        <p v-html="t('legal.advertisingText')"></p>
        <p class="mt-2" v-html="t('legal.legalBasisConsent')"></p>

        <h3 class="text-lg font-semibold text-text-main mt-6 mb-2">{{ t('legal.formsTitle') }}</h3>
        <p v-html="t('legal.formsText')"></p>
        <p class="mt-2" v-html="t('legal.formsLegalBasis')"></p>

        <h3 class="text-lg font-semibold text-text-main mt-6 mb-2">{{ t('legal.paymentTitle') }}</h3>
        <p v-html="t('legal.paymentText')"></p>
        <p class="mt-2" v-html="t('legal.legalBasisContract')"></p>

        <h3 class="text-lg font-semibold text-text-main mt-6 mb-2">{{ t('legal.mapTitle') }}</h3>
        <p v-html="t('legal.mapText')"></p>
        <p class="mt-2" v-html="t('legal.mapLegalBasis')"></p>

        <template v-if="features.newsletter">
          <h3 class="text-lg font-semibold text-text-main mt-6 mb-2">{{ t('legal.newsletterTitle') }}</h3>
          <p v-html="t('legal.newsletterText')"></p>
          <p class="mt-2" v-html="t('legal.newsletterLegalBasis')"></p>
        </template>
      </section>

      <section>
        <h2 class="text-xl font-bold text-text-main mb-4">{{ t('legal.recipientsTitle') }}</h2>
        <p class="mb-3">{{ t('legal.recipientsIntro') }}</p>
        <ul class="list-disc pl-5 space-y-2">
          <li>
            <span v-html="t('legal.recipientGoogle')"></span>
            {{ ' ' }}<a
              href="https://policies.google.com/privacy"
              class="font-medium text-primary underline decoration-primary/40 hover:text-primary-hover"
              rel="noopener noreferrer"
              target="_blank"
            >{{ t('legal.googlePrivacyLink') }}</a
            > ;
          </li>
          <li>
            <span v-html="t('legal.recipientStripe')"></span>
            {{ ' ' }}<a
              href="https://stripe.com/fr/privacy"
              class="font-medium text-primary underline decoration-primary/40 hover:text-primary-hover"
              rel="noopener noreferrer"
              target="_blank"
            >{{ t('legal.stripePrivacyLink') }}</a
            > ;
          </li>
          <li>
            <span v-html="t('legal.recipientMeta')"></span>
            {{ ' ' }}<a
              href="https://www.facebook.com/privacy/policy"
              class="font-medium text-primary underline decoration-primary/40 hover:text-primary-hover"
              rel="noopener noreferrer"
              target="_blank"
            >{{ t('legal.metaPrivacyLink') }}</a
            > ;
          </li>
          <li v-if="features.newsletter">
            <span v-html="t('legal.recipientMailjet')"></span>
            {{ ' ' }}<a
              href="https://www.mailjet.com/legal/privacy-policy/"
              class="font-medium text-primary underline decoration-primary/40 hover:text-primary-hover"
              rel="noopener noreferrer"
              target="_blank"
            >{{ t('legal.mailjetPrivacyLink') }}</a
            > ;
          </li>
          <li v-html="t('legal.recipientHosting')"></li>
          <li v-html="t('legal.recipientStaff', { company: LEGAL_COMPANY_NAME })"></li>
        </ul>
      </section>

      <section>
        <h2 class="text-xl font-bold text-text-main mb-4">{{ t('legal.transfersTitle') }}</h2>
        <p v-html="t('legal.transfersText')"></p>
      </section>

      <section>
        <h2 class="text-xl font-bold text-text-main mb-4">{{ t('legal.retentionTitle') }}</h2>
        <ul class="list-disc pl-5 space-y-2">
          <li v-html="t('legal.retentionForms')"></li>
          <li v-html="t('legal.retentionPayment')"></li>
          <li v-html="t('legal.retentionAnalytics')"></li>
          <li v-html="t('legal.retentionMarketing')"></li>
          <li v-if="features.newsletter" v-html="t('legal.retentionNewsletter')"></li>
        </ul>
      </section>

      <section>
        <h2 class="text-xl font-bold text-text-main mb-4">{{ t('legal.rightsTitle') }}</h2>
        <p class="mb-3">{{ t('legal.rightsIntro') }}</p>
        <ul class="list-disc pl-5 space-y-2 mb-4">
          <li v-html="t('legal.rightAccess')"></li>
          <li v-html="t('legal.rightErasure')"></li>
          <li v-html="t('legal.rightObject')"></li>
          <li v-html="t('legal.rightPortability')"></li>
          <li v-html="t('legal.rightPostMortem')"></li>
        </ul>
        <p>
          {{ t('legal.rightsExerciseBefore') }}
          <a
            :href="'mailto:' + EMAIL_CONTACT"
            class="font-medium text-primary underline decoration-primary/40 hover:text-primary-hover"
          >{{ EMAIL_CONTACT }}</a
          >. {{ t('legal.rightsExerciseAfter') }}
        </p>
        <p class="mt-3">
          {{ t('legal.complaintBefore') }}
          <a
            href="https://www.cnil.fr"
            class="font-medium text-primary underline decoration-primary/40 hover:text-primary-hover"
            rel="noopener noreferrer"
            target="_blank"
          >CNIL</a
          > {{ t('legal.complaintAfter') }}
        </p>
      </section>

      <section>
        <h2 class="text-xl font-bold text-text-main mb-4">{{ t('legal.securityTitle') }}</h2>
        <p>{{ t('legal.securityText') }}</p>
      </section>

      <section>
        <h2 class="text-xl font-bold text-text-main mb-4">{{ t('legal.privacyChangesTitle') }}</h2>
        <p>{{ t('legal.privacyChangesText') }}</p>
      </section>
    </div>
  </div>
</template>

<script setup>
import { t } from '@/i18n'
import { computed } from 'vue'
import { useHead } from '@vueuse/head'
import {
  BASE_URL,
  EMAIL_CONTACT,
  LEGAL_ADDRESS,
  LEGAL_COMPANY_NAME,
  LEGAL_SIRET,
} from '@/config'
import { getSiteConfig } from '@/site/getSiteConfig.js'

const hasLegalDetails = computed(() => Boolean(LEGAL_ADDRESS || LEGAL_SIRET))

const features = getSiteConfig().features

const seo = getSiteConfig().seo.politique

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
      content: `${BASE_URL}/politique-confidentialite`,
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
      href: `${BASE_URL}/politique-confidentialite`,
    },
  ],
})
</script>

<script>
export default {
  name: 'PolitiqueConfidentialite',
}
</script>

<script setup>
import { getSiteConfig } from '@/site/getSiteConfig.js'
import { t } from '@/i18n'

const features = getSiteConfig().features
</script>

<template>
  <label
    v-if="features.newsletter"
    class="flex items-start gap-2 text-sm text-gray-600 cursor-pointer"
  >
    <!-- Non cochée par défaut : le consentement doit être un acte positif (RGPD/CNIL). -->
    <input
      type="checkbox"
      name="newsletter_opt_in"
      value="true"
      class="mt-1 shrink-0"
    />
    <span>
      {{ t('newsletter.optIn') }}
    </span>
  </label>
</template>

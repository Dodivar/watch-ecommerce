<script setup>
import { getSiteConfig } from '@/site/getSiteConfig.js'

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
      Je souhaite recevoir la newsletter (nouveautés et offres par email). Désinscription possible à
      tout moment.
    </span>
  </label>
</template>

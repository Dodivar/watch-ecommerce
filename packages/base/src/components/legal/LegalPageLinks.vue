<script setup>
import { computed } from 'vue'
import { getSiteConfig } from '@/site/getSiteConfig.js'
import { LEGAL_NAV_LINKS } from '@/site/legalPages.js'
import { t } from '@/i18n'

const props = defineProps({
  /** `checkout` : discret sous le paiement ; `footer` : barre du pied de page */
  variant: {
    type: String,
    default: 'checkout',
    validator: (v) => ['checkout', 'footer'].includes(v),
  },
})

const { features } = getSiteConfig()
const show = computed(() => features.legal)
const isCheckout = computed(() => props.variant === 'checkout')
</script>

<template>
  <nav
    v-if="show"
    :class="isCheckout ? 'pt-3 mt-1 border-t border-gray-100' : 'contents'"
    :aria-label="t('footer.legalLinks')"
  >
    <ul
      :class="
        isCheckout
          ? 'flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs text-gray-400'
          : 'contents list-none'
      "
    >
      <li v-for="link in LEGAL_NAV_LINKS" :key="link.path">
        <RouterLink
          :to="link.path"
          :class="
            isCheckout
              ? 'hover:text-gray-600 transition-colors'
              : 'text-white/90 hover:text-white text-sm transition-colors'
          "
          :target="isCheckout ? '_blank' : undefined"
          :rel="isCheckout ? 'noopener noreferrer' : undefined"
        >
          {{ t(link.labelKey) }}
        </RouterLink>
      </li>
    </ul>
  </nav>
</template>

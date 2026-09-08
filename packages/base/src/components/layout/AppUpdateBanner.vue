<script setup>
/**
 * Bandeau « une nouvelle version est disponible ».
 *
 * Volontairement discret et jamais bloquant : le visiteur n'a rien demandé, et la page
 * qu'il lit reste parfaitement utilisable. Il est posé en bas à gauche pour laisser à la
 * bannière cookies (bas à droite, `z-50`) sa place et sa priorité.
 */
import { computed } from 'vue'
import { RefreshCw, X } from '@lucide/vue'

import { t } from '@/i18n'
import { useAppUpdate } from '@/composables/useAppUpdate.js'

const { isUpdateAvailable, isDismissed, dismiss, reload } = useAppUpdate()

const isVisible = computed(() => isUpdateAvailable.value && !isDismissed.value)
</script>

<template>
  <div
    v-if="isVisible"
    role="status"
    aria-live="polite"
    class="fixed bottom-4 left-4 right-4 z-40 mx-auto max-w-md rounded-lg bg-primary px-4 py-3 text-white shadow-lg sm:right-auto sm:mx-0"
  >
    <div class="flex items-center gap-3">
      <p class="flex-1 text-sm leading-snug">{{ t('update.available') }}</p>
      <button
        type="button"
        class="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-white/15 px-3 py-1.5 text-sm font-semibold transition-colors hover:bg-white/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
        @click="reload"
      >
        <RefreshCw class="h-4 w-4" :stroke-width="2" />
        {{ t('update.reload') }}
      </button>
      <button
        type="button"
        class="shrink-0 rounded-md p-1 text-white/70 transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
        :aria-label="t('update.dismiss')"
        @click="dismiss"
      >
        <X class="h-4 w-4" :stroke-width="2" />
      </button>
    </div>
  </div>
</template>

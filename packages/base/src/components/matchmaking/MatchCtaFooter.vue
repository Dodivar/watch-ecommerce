<template>
  <aside v-if="features.watchMatchAlerts || features.recherche" class="grid gap-4 sm:grid-cols-2">
    <!-- CTA 1 — alerte nouvelle montre (phase 2, drapeau `watchMatchAlerts`) -->
    <form
      v-if="features.watchMatchAlerts"
      class="rounded-2xl border border-gray-200 bg-white p-5"
      @submit.prevent="submitAlert"
    >
      <div class="flex items-start gap-3">
        <Bell class="mt-0.5 h-5 w-5 shrink-0 text-gray-500" :stroke-width="1.75" />
        <div class="min-w-0 flex-1">
          <h2 class="text-sm font-semibold text-text-main">
            {{ t('matchmaking.cta.alert.title') }}
          </h2>
          <p class="mt-1 text-xs text-gray-600">{{ t('matchmaking.cta.alert.text') }}</p>
          <label class="mt-3 block">
            <span class="sr-only">{{ t('matchmaking.cta.alert.emailLabel') }}</span>
            <input
              v-model="email"
              type="email"
              name="email"
              required
              autocomplete="email"
              :placeholder="t('matchmaking.cta.alert.emailLabel')"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-primary"
            />
          </label>
          <!-- Pot de miel : invisible pour un humain, rempli par les robots. -->
          <input
            v-model="website"
            type="text"
            name="website"
            tabindex="-1"
            autocomplete="off"
            aria-hidden="true"
            class="matchmaking-honeypot"
          />
          <button
            type="submit"
            class="mt-3 rounded-lg border border-primary bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-primary hover:bg-cream-100 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            :disabled="status === 'loading'"
          >
            {{ status === 'loading' ? t('common.sending') : t('matchmaking.cta.alert.button') }}
          </button>
          <p v-if="statusMessage" class="mt-2 text-xs text-gray-600" role="status">
            {{ statusMessage }}
          </p>
        </div>
      </div>
    </form>

    <!-- CTA 2 — recherche personnalisée (service existant) -->
    <div v-if="features.recherche" class="rounded-2xl border border-gray-200 bg-white p-5">
      <div class="flex items-start gap-3">
        <Search class="mt-0.5 h-5 w-5 shrink-0 text-gray-500" :stroke-width="1.75" />
        <div class="min-w-0 flex-1">
          <h2 class="text-sm font-semibold text-text-main">
            {{ t('matchmaking.cta.sourcing.title') }}
          </h2>
          <p class="mt-1 text-xs text-gray-600">{{ t('matchmaking.cta.sourcing.text') }}</p>
          <RouterLink
            to="/recherche"
            class="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-primary bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-primary hover:bg-cream-100 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {{ t('matchmaking.cta.sourcing.button') }}
            <ArrowRight class="h-4 w-4" :stroke-width="2" />
          </RouterLink>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { ref } from 'vue'
import { ArrowRight, Bell, Search } from '@lucide/vue'

import { t } from '@/i18n'
import { getSiteConfig } from '@/site/getSiteConfig.js'
import { saveMatchAlert } from '@/services/watchMatchAlertService.js'

const props = defineProps({
  /** Préférences courantes (`MatchPreferences`) — la seule donnée qui accompagne l'e-mail. */
  preferences: { type: Object, default: null },
})

const features = getSiteConfig().features

const email = ref('')
const website = ref('')
const status = ref('idle')
const statusMessage = ref('')

async function submitAlert() {
  status.value = 'loading'
  statusMessage.value = ''
  try {
    await saveMatchAlert({
      email: email.value,
      criteria: props.preferences,
      website: website.value,
    })
    status.value = 'success'
  } catch (err) {
    status.value = 'error'
    statusMessage.value =
      err?.code === 'NOT_IMPLEMENTED'
        ? t('matchmaking.cta.alert.unavailable')
        : err?.message || t('form.submitError')
  }
}
</script>

<style scoped>
/* Hors écran plutôt que `display: none`, que certains robots ignorent. */
.matchmaking-honeypot {
  position: absolute;
  left: -9999px;
  width: 1px;
  height: 1px;
  opacity: 0;
}
</style>

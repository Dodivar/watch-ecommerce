<template>
  <div class="mx-auto flex w-full max-w-3xl justify-center px-4 pb-24 pt-10 sm:px-6 lg:px-8">
    <!-- Lecture de l'alerte -->
    <div
      v-if="state === 'checking'"
      class="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center"
      role="status"
    >
      <div class="alert-unsub-pulse h-16 w-16 rounded-full border-2 border-current opacity-60" />
      <p class="text-sm text-gray-600">{{ t('matchmaking.alertUnsubscribe.checking') }}</p>
    </div>

    <section
      v-else
      class="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl"
      aria-live="polite"
      data-testid="alert-unsubscribe"
      :data-state="state"
    >
      <component
        :is="screen.icon"
        class="mx-auto h-10 w-10"
        :class="screen.iconClass"
        :stroke-width="1.5"
      />
      <h1 class="mt-4 text-xl font-bold text-text-main">{{ screen.title }}</h1>
      <p class="mt-3 text-sm text-gray-600">{{ screen.text }}</p>
      <p
        v-if="email && (state === 'confirm' || state === 'working')"
        class="mt-4 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-1.5 text-xs font-medium text-gray-700 shadow-sm"
      >
        <Mail class="h-3.5 w-3.5 text-gray-500" :stroke-width="2" />
        {{ t('matchmaking.alertPrefs.recipient', { email }) }}
      </p>

      <!-- Confirmation : la désinscription part au clic, jamais au chargement. -->
      <div v-if="state === 'confirm' || state === 'working' || state === 'error'" class="mt-6">
        <button
          type="button"
          class="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="state === 'working'"
          @click="confirm"
        >
          {{
            state === 'working'
              ? t('matchmaking.alertUnsubscribe.working')
              : t('matchmaking.alertUnsubscribe.confirmButton')
          }}
        </button>
        <RouterLink
          v-if="canManagePreferences"
          :to="MATCH_ALERT_PREFERENCES_PATH"
          class="mt-4 inline-block text-sm text-gray-600 underline-offset-4 hover:text-text-main hover:underline"
        >
          {{ t('matchmaking.alertUnsubscribe.managePrefs') }}
        </RouterLink>
      </div>

      <div
        v-else
        class="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-6"
      >
        <RouterLink
          to="/collection"
          class="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          {{ t('matchmaking.alertUnsubscribe.browse') }}
          <ArrowRight class="h-4 w-4" :stroke-width="2" />
        </RouterLink>
        <RouterLink
          to="/coup-de-foudre"
          class="text-sm text-gray-600 underline-offset-4 hover:text-text-main hover:underline"
        >
          {{ t('matchmaking.alertPrefs.restart') }}
        </RouterLink>
      </div>
    </section>
  </div>
</template>

<script>
import { readAlertTokenFromHash, rememberAlertToken } from '@/services/watchMatchAlertService.js'

export default {
  /**
   * Comme « mes préférences » : le jeton du lien d'e-mail est retiré de l'URL avant que la
   * navigation aboutisse, pour que la mesure d'audience ne le voie jamais.
   */
  beforeRouteEnter(to) {
    const token = readAlertTokenFromHash(to.hash)
    if (!token) return true
    rememberAlertToken(token)
    return { path: to.path, query: to.query, hash: '', replace: true }
  },
}
</script>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useHead } from '@vueuse/head'
import {
  AlertTriangle,
  ArrowRight,
  BellOff,
  CheckCircle2,
  CloudOff,
  Link2Off,
  Mail,
} from '@lucide/vue'

import { t } from '@/i18n'
import { getSiteConfig } from '@/site/getSiteConfig.js'
import {
  MATCH_ALERT_PREFERENCES_PATH,
  fetchMatchAlertPreferences,
  recallAlertToken,
  unsubscribeMatchAlert,
} from '@/services/watchMatchAlertService.js'

defineOptions({ name: 'MatchAlertUnsubscribePage' })

const site = getSiteConfig()
const brandDisplayName = site.brand?.displayName || site.brand?.legalName || ''

/**
 * @type {import('vue').Ref<'checking' | 'confirm' | 'working' | 'done' | 'already' | 'invalid'
 *   | 'unavailable' | 'error'>}
 */
const state = ref('checking')
const token = ref('')
const email = ref('')
/** La lecture a abouti sur une alerte active : la page « mes préférences » a de quoi s'ouvrir. */
const canManagePreferences = ref(false)

const SCREENS = {
  confirm: { icon: BellOff, iconClass: 'text-gray-400', key: 'confirm' },
  working: { icon: BellOff, iconClass: 'text-gray-400', key: 'confirm' },
  done: { icon: CheckCircle2, iconClass: 'text-green-700', key: 'done' },
  already: { icon: CheckCircle2, iconClass: 'text-green-700', key: 'already' },
  invalid: { icon: Link2Off, iconClass: 'text-gray-400', key: 'unknown' },
  unavailable: { icon: CloudOff, iconClass: 'text-gray-400', key: 'unavailable' },
  error: { icon: AlertTriangle, iconClass: 'text-red-600', key: 'error' },
}

const screen = computed(() => {
  const s = SCREENS[state.value] || SCREENS.confirm
  return {
    icon: s.icon,
    iconClass: s.iconClass,
    title: t(`matchmaking.alertUnsubscribe.${s.key}Title`),
    text: t(`matchmaking.alertUnsubscribe.${s.key}Text`),
  }
})

async function load() {
  token.value = recallAlertToken()
  if (!token.value) {
    state.value = 'invalid'
    return
  }
  try {
    const alert = await fetchMatchAlertPreferences(token.value)
    if (alert.status !== 'active') {
      state.value = 'already'
      return
    }
    email.value = alert.email || ''
    canManagePreferences.value = true
  } catch (err) {
    if (err?.code === 'INVALID_TOKEN' || err?.code === 'UNKNOWN_TOKEN') {
      state.value = 'invalid'
      return
    }
    // Lecture impossible (service, fonctionnalité éteinte) : la désinscription, elle, reste
    // possible — le bouton tente sa chance et dira ce qu'il en est.
  }
  state.value = 'confirm'
}

async function confirm() {
  state.value = 'working'
  try {
    const result = await unsubscribeMatchAlert(token.value)
    state.value = result.alreadyUnsubscribed ? 'already' : 'done'
  } catch (err) {
    if (err?.code === 'INVALID_TOKEN' || err?.code === 'UNKNOWN_TOKEN') state.value = 'invalid'
    else if (err?.code === 'UNAVAILABLE') state.value = 'unavailable'
    else state.value = 'error'
  }
}

// Page personnelle, atteinte par un lien d'e-mail : ni indexée, ni partagée.
useHead({
  title: computed(() =>
    brandDisplayName
      ? `${t('matchmaking.alertUnsubscribe.pageTitle')} — ${brandDisplayName}`
      : t('matchmaking.alertUnsubscribe.pageTitle'),
  ),
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
})

onMounted(load)
</script>

<style scoped>
.alert-unsub-pulse {
  animation: alert-unsub-pulse 1.4s ease-in-out infinite;
}

@keyframes alert-unsub-pulse {
  0%,
  100% {
    transform: scale(0.9);
    opacity: 0.35;
  }
  50% {
    transform: scale(1);
    opacity: 0.8;
  }
}

@media (prefers-reduced-motion: reduce) {
  .alert-unsub-pulse {
    animation: none;
  }
}
</style>

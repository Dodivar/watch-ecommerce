<template>
  <div class="mx-auto w-full max-w-3xl px-4 pb-36 pt-6 sm:px-6 sm:pb-40 lg:px-8">
    <!-- Chargement -->
    <div
      v-if="state === 'loading'"
      class="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center"
      role="status"
    >
      <div class="alert-prefs-pulse h-16 w-16 rounded-full border-2 border-current opacity-60" />
      <p class="text-sm text-gray-600">{{ t('matchmaking.alertPrefs.loading') }}</p>
    </div>

    <!-- Lien invalide, alerte éteinte, service indisponible -->
    <div
      v-else-if="message"
      class="mx-auto mt-10 max-w-md rounded-2xl bg-white p-8 text-center shadow-xl"
      data-testid="alert-prefs-message"
    >
      <component :is="message.icon" class="mx-auto h-10 w-10 text-gray-400" :stroke-width="1.5" />
      <h1 class="mt-4 text-xl font-bold text-text-main">{{ message.title }}</h1>
      <p class="mt-3 text-sm text-gray-600">{{ message.text }}</p>
      <button
        v-if="state === 'unavailable'"
        type="button"
        class="mt-6 rounded-lg bg-primary px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        @click="load"
      >
        {{ t('common.retry') }}
      </button>
      <RouterLink
        v-else
        to="/coup-de-foudre"
        class="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      >
        {{ t('matchmaking.alertPrefs.restart') }}
        <ArrowRight class="h-4 w-4" :stroke-width="2" />
      </RouterLink>
    </div>

    <!-- Préférences -->
    <section v-else aria-labelledby="alert-prefs-title">
      <header class="text-center">
        <p class="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
          {{ t('matchmaking.eyebrow') }}
        </p>
        <h1
          id="alert-prefs-title"
          class="mt-2 text-2xl font-bold text-text-main sm:mt-3 sm:text-3xl"
        >
          {{ t('matchmaking.alertPrefs.title') }}
        </h1>
        <p class="mx-auto mt-2 max-w-xl text-sm text-gray-600 sm:text-base">
          {{ t('matchmaking.alertPrefs.lede') }}
        </p>
        <p
          v-if="email"
          class="mt-4 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-1.5 text-xs font-medium text-gray-700 shadow-sm"
        >
          <Mail class="h-3.5 w-3.5 text-gray-500" :stroke-width="2" />
          {{ t('matchmaking.alertPrefs.recipient', { email }) }}
        </p>
      </header>

      <!-- La règle, dite une fois : c'est elle qui rend honnête ce que la page affiche. -->
      <aside
        class="mt-6 flex gap-3 rounded-2xl bg-white p-4 text-sm text-gray-700 shadow-md sm:mt-8 sm:p-5"
      >
        <Info class="mt-0.5 h-5 w-5 shrink-0 text-gray-500" :stroke-width="1.75" />
        <div>
          <p class="font-semibold text-text-main">{{ t('matchmaking.alertPrefs.ruleTitle') }}</p>
          <p class="mt-1 text-gray-600">{{ t('matchmaking.alertPrefs.ruleText') }}</p>
        </div>
      </aside>

      <div class="mt-6 flex flex-col gap-5 sm:mt-8 sm:gap-6">
        <div
          v-for="id in facets.activeCriteria"
          :key="id"
          class="rounded-2xl bg-white p-5 shadow-xl sm:p-8"
          :data-testid="`alert-prefs-${id}`"
        >
          <MatchPreferenceStep
            :criterion="getMatchCriterion(id)"
            :facet="facets[id]"
            :model-value="preferences[id]"
            @update:model-value="(value) => setCriterion(id, value)"
          />
          <!--
            « Peu importe » vide le critère. Sous les options et non dans le coin de la carte :
            sur téléphone, les titres sur deux lignes l'auraient chevauché.
          -->
          <div v-if="hasValue(id)" class="mt-4 flex justify-end">
            <button
              type="button"
              class="rounded-md px-2 py-1 text-xs font-medium text-gray-500 underline-offset-4 hover:text-text-main hover:underline focus:outline-none focus:ring-2 focus:ring-primary"
              @click="clearCriterion(id)"
            >
              {{ t('matchmaking.onboarding.skip') }}
            </button>
          </div>
        </div>
      </div>

      <p v-if="!hasAnyListPreference" class="mt-5 text-center text-sm text-gray-600">
        {{ t('matchmaking.alertPrefs.noCriteria') }}
      </p>

      <nav
        class="mt-10 flex flex-col items-center gap-3 text-sm sm:flex-row sm:justify-center sm:gap-6"
      >
        <RouterLink
          to="/coup-de-foudre"
          class="inline-flex items-center gap-1.5 font-medium text-gray-700 underline-offset-4 hover:text-text-main hover:underline"
        >
          <RotateCcw class="h-4 w-4" :stroke-width="2" />
          {{ t('matchmaking.alertPrefs.restart') }}
        </RouterLink>
        <a
          :href="unsubscribeUrl"
          class="text-gray-500 underline-offset-4 hover:text-text-main hover:underline"
        >
          {{ t('matchmaking.alertPrefs.unsubscribe') }}
        </a>
      </nav>

      <!--
        Barre d'enregistrement ancrée : la page est longue (un bloc par critère, le budget en
        tête), et le bouton doit rester à portée sans redescendre après chaque retouche.
      -->
      <div
        class="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white/95 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] backdrop-blur"
      >
        <div
          class="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8"
        >
          <p
            class="min-w-0 flex-1 text-xs sm:text-sm"
            :class="saveState === 'error' ? 'text-red-600' : 'text-gray-600'"
            role="status"
          >
            <span v-if="saveState === 'saved'" class="inline-flex items-center gap-1.5">
              <Check class="h-4 w-4 shrink-0 text-green-700" :stroke-width="2.5" />
              {{ t('matchmaking.alertPrefs.saved') }}
            </span>
            <template v-else-if="saveState === 'error'">
              {{ t('matchmaking.alertPrefs.saveError') }}
            </template>
          </p>
          <button
            type="button"
            class="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold uppercase tracking-wide text-white hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:px-6"
            :disabled="!isDirty || saveState === 'saving'"
            @click="save"
          >
            {{
              saveState === 'saving'
                ? t('matchmaking.alertPrefs.saving')
                : t('matchmaking.alertPrefs.save')
            }}
          </button>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import { readAlertTokenFromHash, rememberAlertToken } from '@/services/watchMatchAlertService.js'

export default {
  /**
   * Le lien d'e-mail porte le jeton dans l'ancre. Il en est retiré **avant** que la navigation
   * aboutisse : la mesure d'audience (`router.afterEach` → `trackPageView`, pixel Meta) lit
   * l'URL finale, qui ne doit pas contenir de quoi modifier l'alerte de quelqu'un.
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
import { ArrowRight, BellOff, Check, CloudOff, Info, Link2Off, Mail, RotateCcw } from '@lucide/vue'

import { t } from '@/i18n'
import { getSiteConfig } from '@/site/getSiteConfig.js'
import { getAllWatchesForListing } from '@/services/watchService'
import { getActiveCampaignWatchPricingPublic } from '@/services/watchPromotionCampaignService.js'
import { getBackendApiUrl } from '@/services/backendApiUrl.js'
import {
  fetchMatchAlertPreferences,
  recallAlertToken,
  updateMatchAlertPreferences,
} from '@/services/watchMatchAlertService.js'
import { enrichWatchesWithActiveCampaignPricing } from '@/utils/watchPromotionCampaign.js'
import {
  MATCH_CRITERIA,
  buildAlertPreferenceFacets,
  buildOfferedOptions,
  createEmptyPreferences,
  getMatchCriterion,
  sanitizePreferences,
} from '@/utils/watchMatchmaking.js'

import MatchPreferenceStep from './MatchPreferenceStep.vue'

defineOptions({ name: 'MatchAlertPreferencesPage' })

const site = getSiteConfig()
const brandDisplayName = site.brand?.displayName || site.brand?.legalName || ''

/** @type {import('vue').Ref<'loading' | 'ready' | 'invalid' | 'inactive' | 'unavailable'>} */
const state = ref('loading')
/** @type {import('vue').Ref<'idle' | 'saving' | 'saved' | 'error'>} */
const saveState = ref('idle')
const token = ref('')
const email = ref('')
const pool = ref([])
/** Préférences telles qu'enregistrées : elles fixent les options affichées (voir `facets`). */
const savedPreferences = ref(createEmptyPreferences())
/** Préférences en cours d'édition. */
const preferences = ref(createEmptyPreferences())

/**
 * Calculées sur les préférences **enregistrées**, pas sur celles en cours d'édition : une
 * maison sortie du stock que l'on décoche doit rester à l'écran — sinon elle disparaîtrait au
 * clic, et avec elle toute chance de la recocher.
 */
const facets = computed(() => buildAlertPreferenceFacets(pool.value, savedPreferences.value))

/** Ce que l'alerte gardera : les préférences, et les options que cette page a affichées. */
function criteriaToSave() {
  return { ...preferences.value, offered: buildOfferedOptions(facets.value) }
}

/** Empreinte comparable des seules préférences (sans `offered`, qui suit le stock). */
function fingerprint(prefs) {
  const clean = sanitizePreferences(prefs)
  delete clean.offered
  return JSON.stringify(clean)
}

const isDirty = computed(
  () => fingerprint(preferences.value) !== fingerprint(savedPreferences.value),
)

const hasAnyListPreference = computed(() =>
  MATCH_CRITERIA.some((c) => c.kind === 'multi' && preferences.value[c.id]?.length > 0),
)

function hasValue(id) {
  const value = preferences.value[id]
  return Array.isArray(value) ? value.length > 0 : Boolean(value)
}

function setCriterion(id, value) {
  preferences.value = { ...preferences.value, [id]: value }
  if (saveState.value !== 'saving') saveState.value = 'idle'
}

function clearCriterion(id) {
  setCriterion(id, id === 'budget' ? null : [])
}

const unsubscribeUrl = computed(
  () =>
    `${getBackendApiUrl()}/api/watch-match-alerts/unsubscribe?token=${encodeURIComponent(token.value)}`,
)

const message = computed(() => {
  if (state.value === 'invalid') {
    return {
      icon: Link2Off,
      title: t('matchmaking.alertPrefs.invalidTitle'),
      text: t('matchmaking.alertPrefs.invalidText'),
    }
  }
  if (state.value === 'inactive') {
    return {
      icon: BellOff,
      title: t('matchmaking.alertPrefs.inactiveTitle'),
      text: t('matchmaking.alertPrefs.inactiveText'),
    }
  }
  if (state.value === 'unavailable') {
    return {
      icon: CloudOff,
      title: t('matchmaking.alertPrefs.unavailableTitle'),
      text: t('matchmaking.alertPrefs.unavailableText'),
    }
  }
  return null
})

/** Code d'erreur backend → écran. */
function stateForError(err) {
  if (err?.code === 'INACTIVE') return 'inactive'
  if (err?.code === 'INVALID_TOKEN' || err?.code === 'UNKNOWN_TOKEN') return 'invalid'
  return 'unavailable'
}

/**
 * Tout le stock avant d'afficher : les options montrées sont ce que `offered` enregistrera,
 * elles ne peuvent pas dépendre de la page de catalogue arrivée la première.
 */
async function loadPool() {
  const campaignPricing = getActiveCampaignWatchPricingPublic()
  const watches = []
  await getAllWatchesForListing({
    onPage: async (page) => {
      const pricing = await campaignPricing
      watches.push(...enrichWatchesWithActiveCampaignPricing(page, pricing))
    },
  })
  return watches.filter((w) => w.isAvailable !== false && !w.isSold)
}

async function load() {
  state.value = 'loading'
  token.value = recallAlertToken()
  if (!token.value) {
    state.value = 'invalid'
    return
  }
  try {
    const [alert, watches] = await Promise.all([
      fetchMatchAlertPreferences(token.value),
      loadPool(),
    ])
    if (alert.status !== 'active') {
      state.value = 'inactive'
      return
    }
    email.value = alert.email || ''
    pool.value = watches
    const loaded = sanitizePreferences(alert.criteria)
    delete loaded.offered
    savedPreferences.value = loaded
    preferences.value = { ...loaded }
    state.value = 'ready'
  } catch (err) {
    state.value = stateForError(err)
  }
}

async function save() {
  saveState.value = 'saving'
  try {
    await updateMatchAlertPreferences(token.value, criteriaToSave())
    savedPreferences.value = { ...preferences.value }
    saveState.value = 'saved'
  } catch (err) {
    const next = stateForError(err)
    if (next === 'unavailable') {
      saveState.value = 'error'
    } else {
      state.value = next
    }
  }
}

/* --------------------------------------------------------------------- SEO */

// Page personnelle, atteinte par un lien d'e-mail : ni indexée, ni partagée.
useHead({
  title: computed(() =>
    brandDisplayName
      ? `${t('matchmaking.alertPrefs.pageTitle')} — ${brandDisplayName}`
      : t('matchmaking.alertPrefs.pageTitle'),
  ),
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
})

onMounted(load)
</script>

<style scoped>
.alert-prefs-pulse {
  animation: alert-prefs-pulse 1.4s ease-in-out infinite;
}

@keyframes alert-prefs-pulse {
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
  .alert-prefs-pulse {
    animation: none;
  }
}
</style>

<template>
  <div class="matchmaking-page mx-auto w-full max-w-5xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
    <!-- Chargement -->
    <div
      v-if="mm.phase === 'loading'"
      class="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center"
      role="status"
    >
      <div class="matchmaking-pulse h-16 w-16 rounded-full border-2 border-current opacity-60" />
      <p class="text-sm text-gray-600">{{ t('matchmaking.loading') }}</p>
    </div>

    <!-- Erreur -->
    <div
      v-else-if="mm.phase === 'error'"
      class="mx-auto mt-10 max-w-md rounded-2xl bg-white p-8 text-center shadow-xl"
    >
      <p class="text-lg font-semibold text-text-main">{{ t('matchmaking.loadError') }}</p>
      <button
        type="button"
        class="mt-6 rounded-lg bg-primary px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        @click="mm.load()"
      >
        {{ t('common.retry') }}
      </button>
    </div>

    <!-- Catalogue vide -->
    <div v-else-if="mm.phase === 'empty'" class="mx-auto mt-6 max-w-2xl">
      <div class="rounded-2xl bg-white p-8 text-center shadow-xl sm:p-12">
        <p class="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
          {{ t('matchmaking.eyebrow') }}
        </p>
        <h1 class="mt-3 text-2xl font-bold text-text-main sm:text-3xl">
          {{ t('matchmaking.empty.title') }}
        </h1>
        <p class="mt-4 text-gray-600">{{ t('matchmaking.empty.text') }}</p>
      </div>
      <MatchCtaFooter :preferences="mm.session.preferences" class="mt-8" />
    </div>

    <MatchOnboarding v-else-if="mm.phase === 'onboarding'" :mm="mm" />

    <MatchSwipeDeck
      v-else-if="mm.phase === 'swipe'"
      :mm="mm"
      :keyboard-disabled="detailWatch !== null"
      @open-details="openDetails"
    />

    <MatchEndScreen v-else-if="mm.phase === 'end'" :mm="mm" />

    <MatchShortlist v-else-if="mm.phase === 'shortlist'" :mm="mm" @open-details="openDetails" />

    <MatchWatchLightbox
      :open="detailWatch !== null"
      :watch="detailWatch"
      :mode="mm.phase === 'shortlist' ? 'shortlist' : 'deck'"
      @like="onLightboxLike"
      @pass="onLightboxPass"
      @remove="onLightboxRemove"
      @close="closeDetails"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useHead } from '@vueuse/head'

import { CANONICAL_BASE_URL } from '@/config'
import { t } from '@/i18n'
import { getSiteConfig } from '@/site/getSiteConfig.js'
import { useWatchMatchmaking } from '@/composables/useWatchMatchmaking.js'

import MatchOnboarding from './MatchOnboarding.vue'
import MatchSwipeDeck from './MatchSwipeDeck.vue'
import MatchEndScreen from './MatchEndScreen.vue'
import MatchShortlist from './MatchShortlist.vue'
import MatchWatchLightbox from './MatchWatchLightbox.vue'
import MatchCtaFooter from './MatchCtaFooter.vue'

defineOptions({ name: 'WatchMatchmakingPage' })

const site = getSiteConfig()
const brandDisplayName = site.brand?.displayName || site.brand?.legalName || ''
const seo = site.seo?.matchmaking

const mm = useWatchMatchmaking()

/* ------------------------------------------------------------------ Détail */

const detailWatch = ref(null)

function openDetails(watch) {
  detailWatch.value = watch || null
}

function closeDetails() {
  detailWatch.value = null
}

/** Les décisions prises dans la lightbox passent par la même porte que celles du deck. */
function onLightboxLike(watch) {
  mm.like(watch?.id)
  closeDetails()
}

function onLightboxPass(watch) {
  mm.pass(watch?.id)
  closeDetails()
}

function onLightboxRemove(watch) {
  mm.removeLiked(watch?.id)
  closeDetails()
}

/* --------------------------------------------------------------------- SEO */

const fallbackTitle = computed(() =>
  brandDisplayName
    ? `${t('matchmaking.pageTitle')} — ${brandDisplayName}`
    : t('matchmaking.pageTitle'),
)
const pageTitle = computed(() => seo?.title ?? fallbackTitle.value)
const pageDescription = computed(() => seo?.metaDescription ?? t('matchmaking.metaDescription'))
const ogTitle = computed(() => seo?.ogTitle ?? pageTitle.value)
const ogDescription = computed(() => seo?.ogDescription ?? pageDescription.value)

useHead({
  title: pageTitle,
  meta: [
    { name: 'description', content: pageDescription },
    { property: 'og:title', content: ogTitle },
    { property: 'og:description', content: ogDescription },
    { property: 'og:url', content: `${CANONICAL_BASE_URL}/coup-de-foudre` },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: ogTitle },
    { name: 'twitter:description', content: ogDescription },
  ],
  link: [{ rel: 'canonical', href: `${CANONICAL_BASE_URL}/coup-de-foudre` }],
})

onMounted(() => {
  mm.load()
})
</script>

<style scoped>
.matchmaking-pulse {
  animation: matchmaking-pulse 1.4s ease-in-out infinite;
}

@keyframes matchmaking-pulse {
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
  .matchmaking-pulse {
    animation: none;
  }
}
</style>

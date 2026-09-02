<template>
  <section class="mx-auto max-w-2xl" aria-labelledby="matchmaking-end-title">
    <div class="rounded-2xl bg-white p-8 text-center shadow-xl sm:p-12">
      <p class="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
        {{ t('matchmaking.eyebrow') }}
      </p>

      <!-- Budget qui vide le pool -->
      <template v-if="isBudgetEmpty">
        <h1 id="matchmaking-end-title" class="mt-3 text-2xl font-bold text-text-main sm:text-3xl">
          {{ t('matchmaking.end.noBudgetTitle') }}
        </h1>
        <p class="mt-4 text-gray-600">{{ t('matchmaking.end.noBudgetText') }}</p>
        <div class="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button type="button" :class="primaryClass" @click="widenBudget">
            {{ t('matchmaking.end.widenBudget') }}
          </button>
          <button type="button" :class="secondaryClass" @click="mm.editPreferences()">
            {{ t('matchmaking.end.editPreferences') }}
          </button>
        </div>
      </template>

      <!-- Tout vu, au moins un coup de cœur -->
      <template v-else-if="likedCount > 0">
        <Heart class="mx-auto mt-4 h-10 w-10 text-primary" :stroke-width="1.5" />
        <h1 id="matchmaking-end-title" class="mt-3 text-2xl font-bold text-text-main sm:text-3xl">
          {{ t('matchmaking.end.title') }}
        </h1>
        <p class="mt-4 text-gray-600">{{ tc('matchmaking.end.likedText', likedCount) }}</p>
        <div class="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button type="button" :class="primaryClass" @click="mm.showShortlist()">
            {{ t('matchmaking.end.viewMatches') }}
            <span class="ml-1 opacity-80">({{ likedCount }})</span>
          </button>
          <button type="button" :class="secondaryClass" @click="mm.editPreferences()">
            {{ t('matchmaking.end.editPreferences') }}
          </button>
        </div>
      </template>

      <!-- Tout vu, aucun coup de cœur -->
      <template v-else>
        <h1 id="matchmaking-end-title" class="mt-3 text-2xl font-bold text-text-main sm:text-3xl">
          {{ t('matchmaking.end.noLikesTitle') }}
        </h1>
        <p class="mt-4 text-gray-600">{{ t('matchmaking.end.noLikesText') }}</p>
        <div class="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button type="button" :class="primaryClass" @click="mm.editPreferences()">
            {{ t('matchmaking.end.editPreferences') }}
          </button>
        </div>
      </template>

      <button
        type="button"
        class="mt-6 inline-flex items-center gap-1.5 text-sm text-gray-500 underline-offset-4 hover:underline focus:outline-none focus:ring-2 focus:ring-primary"
        @click="mm.restart()"
      >
        <RotateCcw class="h-4 w-4" :stroke-width="2" />
        {{ t('matchmaking.end.restart') }}
      </button>
    </div>

    <MatchCtaFooter :preferences="mm.session.preferences" class="mt-8" />
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { Heart, RotateCcw } from '@lucide/vue'

import { t, tc } from '@/i18n'

import MatchCtaFooter from './MatchCtaFooter.vue'

const props = defineProps({
  /** Objet réactif de `useWatchMatchmaking()`. */
  mm: { type: Object, required: true },
})

const likedCount = computed(() => props.mm.session.liked.length)

/** Aucune montre dans le budget alors qu'il en existe : le budget est le seul filtre dur. */
const isBudgetEmpty = computed(() => props.mm.totalInBudget === 0 && props.mm.excludedByBudget > 0)

function widenBudget() {
  props.mm.clearPreference('budget')
  props.mm.resumeDiscovery()
}

const primaryClass =
  'inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'
const secondaryClass =
  'inline-flex items-center justify-center rounded-lg border border-primary bg-white px-6 py-3 text-sm font-semibold uppercase tracking-wide text-primary hover:bg-cream-100 focus:outline-none focus:ring-2 focus:ring-primary'
</script>

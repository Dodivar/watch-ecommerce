<template>
  <section class="mx-auto max-w-2xl" aria-labelledby="matchmaking-onboarding-title">
    <header class="text-center">
      <p class="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
        {{ t('matchmaking.eyebrow') }}
      </p>
      <h1
        id="matchmaking-onboarding-title"
        class="mt-3 text-2xl font-bold text-text-main sm:text-3xl"
      >
        {{ t('matchmaking.onboarding.title') }}
      </h1>
      <p class="mt-2 text-gray-600">{{ t('matchmaking.onboarding.subtitle') }}</p>
    </header>

    <!-- Progression -->
    <div class="mt-8" role="group" :aria-label="progressLabel">
      <div class="flex gap-1.5">
        <span
          v-for="(id, index) in mm.activeCriteria"
          :key="id"
          class="h-1 flex-1 rounded-full bg-current transition-opacity duration-300"
          :class="index <= mm.currentStepIndex ? 'opacity-100' : 'opacity-25'"
        />
      </div>
      <p class="mt-2 text-xs text-gray-500">{{ progressLabel }}</p>
    </div>

    <!-- Écran courant -->
    <div class="relative mt-6 overflow-hidden">
      <Transition :name="transitionName" mode="out-in">
        <div :key="criterion.id" class="rounded-2xl bg-white p-6 shadow-xl sm:p-8">
          <MatchPreferenceStep
            :criterion="criterion"
            :facet="facet"
            :model-value="value"
            @update:model-value="onUpdate"
          />
        </div>
      </Transition>
    </div>

    <!-- Aperçu du pool -->
    <p
      class="mt-4 text-center text-sm"
      :class="mm.totalInBudget > 0 ? 'text-gray-600' : 'text-red-600'"
    >
      <template v-if="mm.totalInBudget > 0">
        {{ tc('matchmaking.onboarding.poolCount', mm.totalInBudget) }}
      </template>
      <template v-else>{{ t('matchmaking.onboarding.poolEmpty') }}</template>
    </p>

    <!-- Navigation -->
    <div class="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex items-center justify-between gap-3 sm:justify-start">
        <button
          v-if="mm.currentStepIndex > 0"
          type="button"
          class="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:text-text-main focus:outline-none focus:ring-2 focus:ring-primary"
          @click="goBack"
        >
          <ArrowLeft class="h-4 w-4" :stroke-width="2" />
          {{ t('matchmaking.onboarding.back') }}
        </button>
        <button
          type="button"
          class="rounded-lg px-3 py-2 text-sm font-medium text-gray-500 underline-offset-4 hover:underline focus:outline-none focus:ring-2 focus:ring-primary"
          @click="skip"
        >
          {{ t('matchmaking.onboarding.skip') }}
        </button>
      </div>
      <button
        type="button"
        class="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        :disabled="mm.totalInBudget === 0"
        @click="goNext"
      >
        {{ isLast ? t('matchmaking.onboarding.start') : t('matchmaking.onboarding.next') }}
        <ArrowRight class="h-4 w-4" :stroke-width="2" />
      </button>
    </div>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import { ArrowLeft, ArrowRight } from '@lucide/vue'

import { t, tc } from '@/i18n'
import { getMatchCriterion } from '@/utils/watchMatchmaking.js'

import MatchPreferenceStep from './MatchPreferenceStep.vue'

const props = defineProps({
  /** Objet réactif de `useWatchMatchmaking()`. */
  mm: { type: Object, required: true },
})

const direction = ref('forward')

const criterion = computed(() => {
  const id = props.mm.activeCriteria[props.mm.currentStepIndex] ?? props.mm.activeCriteria[0]
  return getMatchCriterion(id) ?? getMatchCriterion('budget')
})

const facet = computed(() => props.mm.facets[criterion.value.id])

const value = computed(() => props.mm.session.preferences[criterion.value.id])

const isLast = computed(() => props.mm.currentStepIndex >= props.mm.activeCriteria.length - 1)

const progressLabel = computed(() =>
  t('matchmaking.progress', {
    current: props.mm.currentStepIndex + 1,
    total: props.mm.activeCriteria.length,
  }),
)

const transitionName = computed(() => `mm-step-${direction.value}`)

function onUpdate(next) {
  props.mm.setPreference(criterion.value.id, next)
}

function goNext() {
  direction.value = 'forward'
  props.mm.nextStep()
}

function goBack() {
  direction.value = 'backward'
  props.mm.previousStep()
}

function skip() {
  props.mm.clearPreference(criterion.value.id)
  goNext()
}
</script>

<style scoped>
.mm-step-forward-enter-active,
.mm-step-forward-leave-active,
.mm-step-backward-enter-active,
.mm-step-backward-leave-active {
  transition:
    opacity 0.24s ease,
    transform 0.24s ease;
}

.mm-step-forward-enter-from {
  opacity: 0;
  transform: translateX(24px);
}
.mm-step-forward-leave-to {
  opacity: 0;
  transform: translateX(-24px);
}
.mm-step-backward-enter-from {
  opacity: 0;
  transform: translateX(-24px);
}
.mm-step-backward-leave-to {
  opacity: 0;
  transform: translateX(24px);
}

@media (prefers-reduced-motion: reduce) {
  .mm-step-forward-enter-from,
  .mm-step-forward-leave-to,
  .mm-step-backward-enter-from,
  .mm-step-backward-leave-to {
    transform: none;
  }
}
</style>

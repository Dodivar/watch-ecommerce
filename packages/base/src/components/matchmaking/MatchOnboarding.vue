<template>
  <section
    ref="root"
    class="matchmaking-onboarding mx-auto flex max-w-2xl flex-col"
    aria-labelledby="matchmaking-onboarding-title"
  >
    <header class="text-center">
      <p class="matchmaking-eyebrow text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
        {{ t('matchmaking.eyebrow') }}
      </p>
      <h1
        id="matchmaking-onboarding-title"
        class="matchmaking-title mt-2 text-xl font-bold text-text-main sm:mt-3 sm:text-3xl"
      >
        {{ t('matchmaking.onboarding.title') }}
      </h1>
      <p class="matchmaking-lede mt-2 text-sm text-gray-600 sm:text-base">
        {{ t('matchmaking.onboarding.subtitle') }}
      </p>
    </header>

    <!-- Progression -->
    <div class="mt-5 sm:mt-8" role="group" :aria-label="progressLabel">
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
    <div
      ref="stepRegion"
      class="matchmaking-step-region relative mt-5 flex flex-col overflow-hidden sm:mt-6"
    >
      <Transition :name="transitionName" mode="out-in">
        <div
          :key="criterion.id"
          class="matchmaking-step-card rounded-2xl bg-white p-5 shadow-xl sm:p-8"
        >
          <MatchPreferenceStep
            :criterion="criterion"
            :facet="facet"
            :model-value="value"
            @update:model-value="onUpdate"
          />
        </div>
      </Transition>
    </div>

    <!--
      Barre d'action. Les écrans n'ont pas la même hauteur — celui du budget (tranches,
      curseur, champs min/max) dépasse largement un écran de téléphone : « Continuer »
      demandait de défiler pour être atteint, et changeait de place d'une étape à l'autre.
      Sur écran étroit ou peu haut, elle est donc ancrée en bas (voir la feuille de style),
      ce qui garde aussi l'aperçu du pool sous les yeux pendant qu'on règle le budget.
    -->
    <div class="matchmaking-actions mt-5 border-gray-200 sm:mt-6">
      <!-- Aperçu du pool -->
      <p
        class="text-center text-xs sm:text-sm"
        :class="mm.totalInBudget > 0 ? 'text-gray-600' : 'text-red-600'"
      >
        <template v-if="mm.totalInBudget > 0">
          {{ tc('matchmaking.onboarding.poolCount', mm.totalInBudget) }}
        </template>
        <template v-else>{{ t('matchmaking.onboarding.poolEmpty') }}</template>
      </p>

      <!-- Navigation -->
      <div class="mt-2 flex items-center gap-2 sm:mt-4 sm:justify-between sm:gap-3">
        <div class="flex shrink-0 items-center gap-1 sm:gap-3">
          <button
            v-if="mm.currentStepIndex > 0"
            type="button"
            class="inline-flex items-center gap-1.5 rounded-lg px-2 py-2 text-sm font-medium text-gray-600 hover:text-text-main focus:outline-none focus:ring-2 focus:ring-primary sm:px-3"
            @click="goBack"
          >
            <ArrowLeft class="h-4 w-4" :stroke-width="2" />
            {{ t('matchmaking.onboarding.back') }}
          </button>
          <button
            type="button"
            class="rounded-lg px-2 py-2 text-sm font-medium text-gray-500 underline-offset-4 hover:underline focus:outline-none focus:ring-2 focus:ring-primary sm:px-3"
            @click="skip"
          >
            {{ t('matchmaking.onboarding.skip') }}
          </button>
        </div>
        <button
          type="button"
          class="ml-auto inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold uppercase tracking-wide text-white hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none sm:px-6"
          :disabled="mm.totalInBudget === 0"
          @click="goNext"
        >
          {{ isLast ? t('matchmaking.onboarding.start') : t('matchmaking.onboarding.next') }}
          <ArrowRight class="h-4 w-4 shrink-0" :stroke-width="2" />
        </button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { ArrowLeft, ArrowRight } from '@lucide/vue'

import { t, tc } from '@/i18n'
import { getMatchCriterion } from '@/utils/watchMatchmaking.js'

import MatchPreferenceStep from './MatchPreferenceStep.vue'

const props = defineProps({
  /** Objet réactif de `useWatchMatchmaking()`. */
  mm: { type: Object, required: true },
})

const direction = ref('forward')
const root = ref(null)
const stepRegion = ref(null)

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

/**
 * `--mm-fill` : hauteur entre le haut du parcours et le bas de l'écran. Mesurée plutôt que
 * calculée en CSS, la barre de navigation du site n'ayant pas la même hauteur d'une vitrine
 * à l'autre. La zone d'étape absorbe l'espace restant, ce qui pose la barre d'action pile en
 * bas de l'écran quelle que soit la hauteur de l'étape.
 */
function measureFill() {
  const el = root.value
  if (!el) return
  const top = el.getBoundingClientRect().top + window.scrollY
  el.style.setProperty('--mm-fill', `${Math.max(0, Math.round(window.innerHeight - top))}px`)
}

onMounted(() => {
  measureFill()
  window.addEventListener('resize', measureFill)
  window.addEventListener('orientationchange', measureFill)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', measureFill)
  window.removeEventListener('orientationchange', measureFill)
})

/**
 * Ramène la question en haut de l'écran au changement d'étape, mais seulement si on l'avait
 * défilée (le budget invite à descendre jusqu'aux champs min/max) : sinon une étape courte
 * ferait défiler la page sans raison.
 */
async function realignStep() {
  await nextTick()
  const el = stepRegion.value
  if (!el) return
  const top = Math.max(0, el.getBoundingClientRect().top + window.scrollY - 12)
  if (window.scrollY <= top) return
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  window.scrollTo({ top, behavior: reduceMotion ? 'auto' : 'smooth' })
}

function goNext() {
  direction.value = 'forward'
  props.mm.nextStep()
  realignStep()
}

function goBack() {
  direction.value = 'backward'
  props.mm.previousStep()
  realignStep()
}

function skip() {
  props.mm.clearPreference(criterion.value.id)
  goNext()
}
</script>

<style scoped>
/*
 * Écran étroit (téléphone) ou peu haut (téléphone en paysage) : le parcours occupe la
 * hauteur d'écran disponible et la barre d'action est ancrée en bas, toujours au même
 * endroit, sur un fond de page opaque puisque le contenu défile dessous. La marge basse
 * respecte l'indicateur d'accueil iOS.
 */
@media (max-width: 639px), (max-height: 699px) {
  .matchmaking-onboarding {
    min-height: var(--mm-fill, auto);
  }

  /* La carte prend la place laissée libre : même panneau d'une question à l'autre. */
  .matchmaking-step-region,
  .matchmaking-step-card {
    flex: 1 1 0%;
  }

  .matchmaking-actions {
    position: sticky;
    bottom: 0;
    z-index: 10;
    margin-inline: -1rem;
    border-top-width: 1px;
    padding: 0.75rem 1rem max(0.75rem, env(safe-area-inset-bottom));
    background-color: var(--color-page);
  }
}

/*
 * Écran vraiment bas (téléphone en paysage) : la place va à la question, pas au chapeau.
 * Sélecteurs à deux classes, pour passer devant les utilitaires Tailwind de l'élément.
 */
@media (max-height: 560px) {
  .matchmaking-onboarding .matchmaking-eyebrow,
  .matchmaking-onboarding .matchmaking-lede {
    display: none;
  }

  .matchmaking-onboarding .matchmaking-title {
    margin-top: 0;
    font-size: 1.25rem;
    line-height: 1.75rem;
  }
}

/*
 * Écran confortable : la barre reste dans le flux, et la carte réserve la hauteur de
 * l'étape la plus longue (le budget) pour que « Continuer » ne saute pas d'une question
 * à l'autre.
 */
@media (min-width: 640px) and (min-height: 700px) {
  .matchmaking-step-card {
    min-height: 24rem;
  }
}

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

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
    <div ref="stepRegion" class="matchmaking-step-region relative mt-5 flex flex-col sm:mt-6">
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

      Trois règles y tiennent les boutons immobiles d'une étape à l'autre (voir le style) :
      la grille place chacun dans sa case, « Retour » garde sa place au premier écran au lieu
      d'apparaître et de tout décaler, et le bouton principal réserve la largeur du plus long
      de ses deux libellés — « Voir les montres » au dernier écran est plus large que
      « Continuer », et le laisser grandir déplaçait les deux autres.
    -->
    <div class="matchmaking-actions mt-3 border-gray-200 sm:mt-6">
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
      <div class="matchmaking-nav mt-2 sm:mt-4">
        <!--
          Au premier écran, « Retour » n'a nulle part où revenir : masqué par `visibility`
          (donc hors tabulation et hors lecture d'écran), il garde sa case et « Peu importe »
          ne bouge pas quand il réapparaît.
        -->
        <button
          type="button"
          class="matchmaking-nav-back inline-flex items-center gap-1.5 rounded-lg px-2 py-2 text-sm font-medium text-gray-600 hover:text-text-main focus:outline-none focus:ring-2 focus:ring-primary sm:px-3"
          :class="{ invisible: isFirst }"
          :disabled="isFirst"
          @click="goBack"
        >
          <ArrowLeft class="h-4 w-4" :stroke-width="2" />
          {{ t('matchmaking.onboarding.back') }}
        </button>
        <button
          type="button"
          class="matchmaking-nav-skip rounded-lg px-2 py-2 text-sm font-medium text-gray-500 underline-offset-4 hover:underline focus:outline-none focus:ring-2 focus:ring-primary sm:px-3"
          @click="skip"
        >
          {{ t('matchmaking.onboarding.skip') }}
        </button>
        <button
          type="button"
          class="matchmaking-nav-next inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold uppercase tracking-wide text-white hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:px-6"
          :disabled="mm.totalInBudget === 0"
          @click="goNext"
        >
          <span class="matchmaking-cta-label">
            <span aria-hidden="true" class="matchmaking-cta-ghost">
              {{ t('matchmaking.onboarding.next') }}
            </span>
            <span aria-hidden="true" class="matchmaking-cta-ghost">
              {{ t('matchmaking.onboarding.start') }}
            </span>
            <span>
              {{ isLast ? t('matchmaking.onboarding.start') : t('matchmaking.onboarding.next') }}
            </span>
          </span>
          <ArrowRight class="h-4 w-4 shrink-0" :stroke-width="2" />
        </button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, nextTick, ref } from 'vue'
import { ArrowLeft, ArrowRight } from '@lucide/vue'

import { t, tc } from '@/i18n'
import { useViewportFill } from '@/composables/useViewportFill.js'
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

const isFirst = computed(() => props.mm.currentStepIndex <= 0)

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
 * `--mm-fill` : hauteur entre le haut du parcours et le bas de l'écran. La zone d'étape
 * absorbe l'espace restant, ce qui pose la barre d'action pile en bas de l'écran quelle que
 * soit la hauteur de l'étape.
 */
useViewportFill(root)

/**
 * Ramène la question en haut de l'écran au changement d'étape, mais seulement si on l'avait
 * défilée (le budget invite à descendre jusqu'aux champs min/max) : sinon une étape courte
 * ferait défiler la page sans raison.
 */
async function realignStep() {
  await nextTick()
  const el = stepRegion.value
  if (!el) return
  // La question précédente pouvait avoir été défilée dans sa carte : la nouvelle commence
  // par son titre, pas au milieu.
  el.scrollTop = 0
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
 * Navigation : une grille plutôt qu'une rangée souple, pour que chaque bouton ait sa case
 * et n'hérite pas de la largeur des autres.
 *
 * Sur téléphone, le bouton principal occupe sa propre ligne, sous les deux liens : à 320 px
 * les trois ne tiennent pas côte à côte, et « Voir les montres » passait sur deux lignes en
 * poussant tout le reste. Pleine largeur, il est aussi le plus facile à atteindre au pouce.
 */
.matchmaking-nav {
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: center;
  gap: 0.5rem;
}

.matchmaking-nav-back {
  grid-area: 1 / 1;
  justify-self: start;
}

.matchmaking-nav-skip {
  grid-area: 1 / 2;
  justify-self: end;
}

.matchmaking-nav-next {
  grid-area: 2 / 1 / auto / -1;
}

@media (min-width: 640px) {
  .matchmaking-nav {
    grid-template-columns: auto auto 1fr;
    gap: 0.75rem;
  }

  .matchmaking-nav-skip {
    grid-area: 1 / 2;
    justify-self: start;
  }

  .matchmaking-nav-next {
    grid-area: 1 / 3;
    justify-self: end;
  }
}

/*
 * Largeur du bouton principal : ses deux libellés possibles sont empilés dans la même case
 * de grille, les inutilisés masqués. La case prend la largeur du plus long, si bien que
 * passer de « Continuer » à « Voir les montres » ne change ni la taille du bouton ni la
 * place des deux autres.
 */
.matchmaking-cta-label {
  display: grid;
  justify-items: center;
  white-space: nowrap;
}

.matchmaking-cta-label > * {
  grid-area: 1 / 1;
}

.matchmaking-cta-ghost {
  visibility: hidden;
}

/* Le débordement horizontal est coupé : c'est lui qui cache la carte entrante pendant la
   transition. Déclaré ici, et non en utilitaire, pour que la règle d'écran étroit plus bas
   puisse rouvrir l'axe vertical sans dépendre de l'ordre des feuilles de style. */
.matchmaking-step-region {
  overflow: hidden;
}

/*
 * Écran étroit (téléphone) ou peu haut (téléphone en paysage) : la barre d'action est ancrée
 * en bas, toujours au même endroit, sur un fond de page opaque puisque le contenu défile
 * dessous. La marge basse respecte l'indicateur d'accueil iOS.
 */
@media (max-width: 639px), (max-height: 699px) {
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
 * Téléphone : le chapeau du parcours cède la place à la question. L'accroche et le
 * sous-titre ne disent rien que la question ne dise déjà, et coûtaient à eux deux le tiers
 * d'un écran de 568 px. Sélecteurs à deux classes, pour passer devant les utilitaires
 * Tailwind de l'élément.
 */
@media (max-width: 639px) {
  .matchmaking-onboarding .matchmaking-eyebrow,
  .matchmaking-onboarding .matchmaking-lede {
    display: none;
  }

  .matchmaking-onboarding .matchmaking-title {
    margin-top: 0;
    font-size: 1.125rem;
    line-height: 1.5rem;
  }
}

/*
 * Le parcours occupe exactement la hauteur d'écran disponible, la zone d'étape absorbant le
 * reste : les boutons se posent au même pixel d'une question à l'autre. Hauteur arrêtée et
 * non minimale — avec un simple minimum, une question un peu haute repoussait la barre de
 * quelques dizaines de pixels.
 *
 * Réservé aux écrans d'au moins 520 px de haut : en dessous (téléphone en paysage), consigne
 * + question + barre ne tiennent pas ensemble, et mieux vaut laisser la page défiler sous une
 * barre ancrée que d'écraser la question à quelques pixels.
 */
@media (max-width: 639px) and (min-height: 520px), (max-height: 699px) and (min-height: 520px) {
  .matchmaking-onboarding {
    height: var(--mm-fill, auto);
  }

  /*
   * La carte prend la place laissée libre : même panneau d'une question à l'autre. Quand la
   * question est plus haute que cette place — le budget sur un écran de téléphone —, elle
   * défile dans la carte : sans cela, les champs min/max étaient rognés et devenaient
   * inatteignables.
   */
  .matchmaking-step-region {
    flex: 1 1 0%;
    min-height: 0;
    overflow-x: hidden;
    overflow-y: auto;
  }

  .matchmaking-step-card {
    min-height: 100%;
  }
}

/*
 * Écran vraiment bas (téléphone en paysage) : la place va à la question, pas au chapeau.
 * Le titre du parcours est retiré de l'œil mais pas de la page — la question elle-même,
 * juste dessous, dit déjà où l'on est. Sélecteurs à deux classes, pour passer devant les
 * utilitaires Tailwind de l'élément.
 */
@media (max-height: 560px) {
  .matchmaking-onboarding .matchmaking-eyebrow,
  .matchmaking-onboarding .matchmaking-lede {
    display: none;
  }

  .matchmaking-onboarding .matchmaking-title {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: 0;
    padding: 0;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
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

<template>
  <!--
    Sur téléphone, l'écran entier tient dans la hauteur disponible (`--mm-fill`) : consigne,
    carte et boutons, sans défilement. C'est la pile de cartes qui absorbe la différence d'un
    format à l'autre — la photo se règle donc sur l'écran plutôt que l'inverse, et les trois
    boutons de décision restent atteignables au pouce, toujours au même endroit.
  -->
  <section
    ref="root"
    class="matchmaking-deck mx-auto flex max-w-md flex-col"
    aria-labelledby="matchmaking-deck-title"
  >
    <header class="flex shrink-0 items-baseline justify-between gap-3">
      <div class="min-w-0">
        <p class="hidden text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 sm:block">
          {{ t('matchmaking.eyebrow') }}
        </p>
        <h1 id="matchmaking-deck-title" class="text-sm font-bold text-text-main sm:mt-1 sm:text-lg">
          {{ t('matchmaking.deck.instruction') }}
        </h1>
      </div>
      <p class="shrink-0 text-xs tabular-nums text-gray-500 sm:text-sm" aria-live="off">
        {{ t('matchmaking.deck.counter', { seen: mm.seenInBudget + 1, total: mm.totalInBudget }) }}
      </p>
    </header>

    <!-- Pile de cartes : une seule liste clé par id, pour que la carte suivante soit le même
         nœud DOM quand elle passe devant et que sa montée soit interpolée. -->
    <div
      ref="stackRef"
      class="matchmaking-stack relative mt-4 sm:mt-5"
      role="group"
      :aria-roledescription="t('matchmaking.deck.instruction')"
    >
      <!-- `touch-none` sur la carte du dessus : elle prend le geste dans toutes les
           directions, y compris vers le haut. Sans cela le défilement de la page happe
           l'amorce verticale et le glissement n'a jamais lieu ; la page se fait donc
           défiler à côté de la carte, pas au travers. `matchmaking-card` ajoute ce que
           Safari iOS exige en plus pour ne pas confisquer le geste (voir le style).
           Le clic de fin de glissement est étouffé en phase de capture : un objet
           `v-on` ne sait pas déclarer cette phase, il lui faut sa propre directive. -->
      <div
        v-for="(watch, index) in stack"
        :key="watch.id"
        :data-testid="index === 0 ? 'match-current-card' : undefined"
        class="absolute inset-0 origin-bottom"
        :class="
          index === 0
            ? 'matchmaking-card cursor-grab touch-none select-none active:cursor-grabbing'
            : 'pointer-events-none'
        "
        :style="index === 0 ? cardStyle : depthStyle(index)"
        :aria-hidden="index === 0 ? undefined : 'true'"
        v-on="index === 0 ? topCardHandlers : {}"
        @click.capture="index === 0 && onClickCapture($event)"
      >
        <MatchWatchCard
          :watch="watch"
          image-loading="eager"
          :fetch-priority="index === 0 ? 'high' : 'low'"
        />

        <!-- Voiles de décision -->
        <template v-if="index === 0">
          <div
            class="pointer-events-none absolute left-4 top-4 rounded-lg border-2 border-emerald-500 px-3 py-1 text-lg font-bold uppercase tracking-widest text-emerald-500"
            :style="{ opacity: likeOpacity, transform: 'rotate(-12deg)' }"
            aria-hidden="true"
          >
            {{ t('matchmaking.deck.like') }}
          </div>
          <div
            class="pointer-events-none absolute right-4 top-4 rounded-lg border-2 border-red-500 px-3 py-1 text-lg font-bold uppercase tracking-widest text-red-500"
            :style="{ opacity: passOpacity, transform: 'rotate(12deg)' }"
            aria-hidden="true"
          >
            {{ t('matchmaking.deck.pass') }}
          </div>
        </template>
      </div>
    </div>

    <!-- Contrôles -->
    <div class="mt-4 flex shrink-0 items-center justify-center gap-5 sm:mt-6">
      <button
        type="button"
        class="matchmaking-action flex h-14 w-14 items-center justify-center rounded-full border-2 border-red-500 bg-white text-red-500 shadow-lg transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-40"
        :title="t('matchmaking.deck.passHint')"
        :aria-label="t('matchmaking.deck.pass')"
        :disabled="isLeaving || !mm.currentWatch"
        @click="decide(-1)"
      >
        <X class="h-7 w-7" :stroke-width="2.5" />
      </button>
      <button
        type="button"
        class="flex h-11 w-11 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-700 shadow transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-40"
        :aria-label="t('matchmaking.deck.details')"
        :title="t('matchmaking.deck.details')"
        :disabled="!mm.currentWatch"
        @click="emit('open-details', mm.currentWatch)"
      >
        <Info class="h-5 w-5" :stroke-width="2" />
      </button>
      <button
        type="button"
        class="matchmaking-action flex h-14 w-14 items-center justify-center rounded-full border-2 border-emerald-500 bg-white text-emerald-500 shadow-lg transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-40"
        :title="t('matchmaking.deck.likeHint')"
        :aria-label="t('matchmaking.deck.like')"
        :disabled="isLeaving || !mm.currentWatch"
        @click="decide(1)"
      >
        <Heart class="h-7 w-7" :stroke-width="2.5" />
      </button>
    </div>

    <p class="mt-3 hidden text-center text-xs text-gray-500 md:block">
      {{ t('matchmaking.deck.keyboardHint') }}
    </p>

    <p class="sr-only" role="status" aria-live="polite">{{ announcement }}</p>

    <footer
      class="mt-4 flex shrink-0 flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs sm:mt-8 sm:gap-x-6 sm:text-sm"
    >
      <button
        type="button"
        class="inline-flex items-center gap-1.5 font-medium text-text-main underline-offset-4 hover:underline focus:outline-none focus:ring-2 focus:ring-primary"
        @click="mm.showShortlist()"
      >
        <Heart class="h-4 w-4" :stroke-width="2" />
        {{ t('matchmaking.deck.viewMatches') }}
        <span
          v-if="mm.session.liked.length"
          class="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-text-main px-1.5 py-0.5 text-xs font-semibold text-white"
        >
          {{ mm.session.liked.length }}
        </span>
      </button>
      <button
        type="button"
        class="inline-flex items-center gap-1.5 text-gray-600 underline-offset-4 hover:underline focus:outline-none focus:ring-2 focus:ring-primary"
        @click="mm.editPreferences()"
      >
        <SlidersHorizontal class="h-4 w-4" :stroke-width="2" />
        {{ t('matchmaking.deck.editPreferences') }}
      </button>
    </footer>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Heart, Info, SlidersHorizontal, X } from '@lucide/vue'

import { t } from '@/i18n'
import { useSwipeDeck } from '@/composables/useSwipeDeck.js'
import { useViewportFill } from '@/composables/useViewportFill.js'
import { canPreloadWatchImages, watchCardImageUrl } from '@/utils/watchImageUrl.js'

import MatchWatchCard from './MatchWatchCard.vue'

const props = defineProps({
  /** Objet réactif de `useWatchMatchmaking()`. */
  mm: { type: Object, required: true },
  /** Vrai quand une modale a le clavier (lightbox ouverte). */
  keyboardDisabled: { type: Boolean, default: false },
})

const emit = defineEmits(['open-details'])

const root = ref(null)
const stackRef = ref(null)
const announcement = ref('')

/** `--mm-fill` : hauteur restante sous le titre du deck (voir la feuille de style). */
useViewportFill(root)

/** Carte courante puis les deux suivantes, superposées par `z-index`. */
const stack = computed(() =>
  props.mm.currentWatch ? [props.mm.currentWatch, ...props.mm.upcomingWatches] : [],
)

/**
 * Position d'une carte en attente. Pendant la sortie de la carte du dessus, chacune
 * remonte déjà d'un cran : la suivante arrive à sa place finale au moment où la
 * carte sortie est retirée, sans saut.
 */
function depthStyle(index) {
  const depth = Math.max(0, isLeaving.value ? index - 1 : index)
  return {
    transform: `translateY(${depth * 10}px) scale(${1 - depth * 0.04})`,
    opacity: 1 - depth * 0.15,
    zIndex: 30 - index,
    transition: 'transform 360ms cubic-bezier(0.2, 0.7, 0.2, 1), opacity 360ms ease',
    willChange: 'transform',
  }
}

/* ---------------------------------------------------------------- Décision */

function commit(direction) {
  const watch = props.mm.currentWatch
  if (!watch) return
  const name = watch.model || watch.name || ''
  if (direction > 0) {
    props.mm.like(watch.id)
    announcement.value = t('matchmaking.deck.announceLiked', { name })
  } else {
    props.mm.pass(watch.id)
    announcement.value = t('matchmaking.deck.announcePassed', { name })
  }
}

const {
  cardStyle,
  likeOpacity,
  passOpacity,
  isLeaving,
  swipe,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  onTouchCancel,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onClickCapture,
} = useSwipeDeck({
  cardRef: stackRef,
  onCommit: commit,
  onTap: () => emit('open-details', props.mm.currentWatch),
  disabled: () => !props.mm.currentWatch,
})

/**
 * Écouteurs de la seule carte du dessus. Le doigt passe par les Touch Events — Safari iOS
 * annule le flux Pointer dès qu'il soupçonne un défilement —, la souris par les Pointer
 * Events ; `useSwipeDeck` n'en retient qu'un par geste. `touchmove` reste non passif : c'est
 * son `preventDefault` qui garde le geste dans la carte sur iPhone.
 */
const topCardHandlers = {
  touchstart: onTouchStart,
  touchmove: onTouchMove,
  touchend: onTouchEnd,
  touchcancel: onTouchCancel,
  pointerdown: onPointerDown,
  pointermove: onPointerMove,
  pointerup: onPointerUp,
  pointercancel: onPointerCancel,
  click: () => emit('open-details', props.mm.currentWatch),
}

function decide(direction) {
  swipe(direction)
}

/* ----------------------------------------------------------------- Clavier */

function onKeyDown(event) {
  if (props.keyboardDisabled) return
  const target = event.target
  if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return
  if (event.key === 'ArrowRight') {
    event.preventDefault()
    decide(1)
  } else if (event.key === 'ArrowLeft') {
    event.preventDefault()
    decide(-1)
  } else if (event.key === 'Enter' && props.mm.currentWatch) {
    event.preventDefault()
    emit('open-details', props.mm.currentWatch)
  }
}

/* ------------------------------------------------------------ Préchargement */

const preloaded = new Set()

function preloadUpcoming() {
  if (!canPreloadWatchImages()) return
  for (const watch of props.mm.upcomingWatches) {
    const url = watchCardImageUrl(watch?.images?.[0], { width: 640 })
    if (!url || preloaded.has(url)) continue
    preloaded.add(url)
    const image = new Image()
    image.decoding = 'async'
    image.src = url
  }
}

watch(() => props.mm.currentWatch?.id, preloadUpcoming, { immediate: true })

onMounted(() => {
  window.addEventListener('keydown', onKeyDown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeyDown)
})
</script>

<style scoped>
/* Portrait, borné par la hauteur d'écran pour garder les boutons visibles sans défiler
   (en-tête du site + titre + rangée de boutons ≈ 40 % d'un écran de téléphone). */
.matchmaking-stack {
  height: min(56vh, 640px);
  height: min(56dvh, 640px);
  min-height: 360px;
}

/* Grand écran : la pile laisse la place aux deux liens de bas de page — à 64 % de la hauteur,
   « Mes coups de cœur » passait sous la ligne de flottaison d'un portable 800 px. */
@media (min-width: 640px) {
  .matchmaking-stack {
    height: min(55vh, 620px);
    height: min(55dvh, 620px);
  }
}

/*
 * Écran étroit ou peu haut : plutôt qu'une fraction de la hauteur d'écran — qui laissait les
 * boutons sous la ligne de flottaison sur un iPhone SE, et n'y était pour rien sur un grand
 * téléphone —, la pile prend exactement ce qui reste une fois la consigne, les boutons et les
 * deux liens posés. La photo suit donc le format de l'appareil. Le plancher évite qu'elle ne
 * se réduise à rien sur un téléphone en paysage ; la page se laisse alors défiler.
 */
@media (max-width: 639px), (max-height: 699px) {
  .matchmaking-deck {
    min-height: var(--mm-fill, auto);
  }

  .matchmaking-stack {
    height: auto;
    flex: 1 1 auto;
    min-height: 14rem;
  }
}

/* Ce que Safari iOS demande en plus de `touch-action: none` pour laisser la carte prendre
   le geste : sans cela, l'appui long ouvre le menu du système ou fait décoller l'image, et
   le glissement est annulé en cours de route. */
.matchmaking-card {
  touch-action: none;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
}

.matchmaking-card :deep(img) {
  -webkit-user-drag: none;
}

@media (prefers-reduced-motion: reduce) {
  .matchmaking-action {
    transition: none;
  }
}
</style>

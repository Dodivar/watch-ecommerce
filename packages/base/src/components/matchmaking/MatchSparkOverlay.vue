<template>
  <!--
    Écran du coup de foudre (voir `watchMatchSpark.js` pour ce qui le déclenche, et pourquoi
    c'est rare). Deux temps :

    1. **L'éclair** (`intro`, ~1,8 s) : un éclair crème se dessine au trait, le titre s'écrit
       dessous. Un appui, Entrée ou Espace passent directement à la suite.
    2. **Le cadran** (`reveal`) : une trotteuse fait le tour du médaillon de la montre en
       allumant les soixante index de minute, s'arrête à midi, puis la fiche monte.

    Uniquement les tokens de la vitrine (primaire, crème, polices) : sur un autre site, la
    même scène prend ses couleurs. Tout est animé en CSS ; `prefers-reduced-motion` saute
    l'éclair et donne directement l'état final du cadran.
  -->
  <Teleport to="body">
    <Transition name="spark-fade">
      <div
        v-if="open && watch"
        ref="dialogRef"
        class="spark-root fixed inset-0 z-[10000] overflow-y-auto overscroll-contain"
        role="dialog"
        aria-modal="true"
        :aria-label="t('matchmaking.spark.dialogLabel', { name: watchName })"
        tabindex="-1"
        data-testid="match-spark"
        @keydown="onKeyDown"
      >
        <div class="spark-backdrop fixed inset-0" aria-hidden="true" />

        <Transition name="spark-act" mode="out-in" @after-enter="onActEntered">
          <!-- 1. L'éclair -->
          <div
            v-if="act === 'intro'"
            key="intro"
            class="relative flex min-h-full cursor-pointer flex-col items-center justify-center px-6 text-center"
            data-testid="match-spark-intro"
            @click="reveal"
          >
            <div class="spark-glow pointer-events-none absolute" aria-hidden="true" />
            <svg class="spark-bolt relative" viewBox="0 0 48 64" fill="none" aria-hidden="true">
              <path class="spark-bolt-fill" :d="BOLT_PATH" fill="currentColor" stroke="none" />
              <path
                class="spark-bolt-line"
                :d="BOLT_PATH"
                pathLength="1"
                stroke="currentColor"
                stroke-width="1.4"
                stroke-linejoin="round"
                stroke-linecap="round"
              />
            </svg>
            <p
              class="spark-title-intro relative mt-8 font-heading text-4xl font-bold leading-none sm:text-5xl"
              :aria-label="t('matchmaking.spark.title')"
            >
              <!-- Mot par mot, insécables : le titre passe à la ligne entre deux mots, jamais
                   au milieu d'un. -->
              <template v-for="(word, w) in titleWords" :key="w">
                <span class="inline-block whitespace-nowrap" aria-hidden="true">
                  <span
                    v-for="letter in word"
                    :key="letter.index"
                    class="spark-letter inline-block"
                    :style="{ animationDelay: `${620 + letter.index * 40}ms` }"
                    >{{ letter.char }}</span
                  >
                </span>
                {{ ' ' }}
              </template>
            </p>
            <span class="spark-rule relative mt-5 block h-px w-16" aria-hidden="true" />
          </div>

          <!-- 2. Le cadran -->
          <div
            v-else
            key="reveal"
            class="relative mx-auto flex min-h-full w-full max-w-sm flex-col items-center justify-center px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-6 text-center sm:max-w-md"
          >
            <div class="spark-dial relative shrink-0" aria-hidden="true">
              <svg class="absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 196 196">
                <g>
                  <line
                    v-for="tick in TICKS"
                    :key="`base-${tick.index}`"
                    class="spark-tick"
                    :x1="tick.x1"
                    :y1="tick.y1"
                    :x2="tick.x2"
                    :y2="tick.y2"
                    :stroke-width="tick.width"
                  />
                  <line
                    v-for="tick in TICKS"
                    :key="`lit-${tick.index}`"
                    class="spark-tick spark-tick--lit"
                    :x1="tick.x1"
                    :y1="tick.y1"
                    :x2="tick.x2"
                    :y2="tick.y2"
                    :stroke-width="tick.width"
                    :style="{ animationDelay: `${tick.delay}ms` }"
                  />
                </g>
                <line
                  class="spark-hand"
                  x1="98"
                  y1="112"
                  x2="98"
                  y2="-4"
                  stroke-width="1.2"
                  stroke-linecap="round"
                />
              </svg>
              <div class="spark-medallion absolute overflow-hidden rounded-full bg-white">
                <img
                  v-if="imageSrc"
                  :src="imageSrc"
                  alt=""
                  decoding="async"
                  draggable="false"
                  class="h-full w-full object-cover object-center"
                />
                <span v-else class="flex h-full w-full items-center justify-center text-primary">
                  <Heart class="h-10 w-10" :stroke-width="1.5" />
                </span>
              </div>
              <span class="spark-pulse absolute inset-0 rounded-full" />
            </div>

            <p
              class="spark-step spark-step--1 spark-eyebrow mt-5 text-[10px] font-semibold uppercase tracking-[0.26em]"
            >
              {{ ordinalLabel }}
            </p>
            <!-- « Coup de foudre » n'est dit qu'une fois ici, dans le surtitre : l'éclair vient
                 de l'écrire en grand, le titre parle donc du moment plutôt que de le nommer. -->
            <h2
              class="spark-step spark-step--2 spark-title mt-1.5 font-heading text-3xl font-bold leading-tight"
            >
              {{ t('matchmaking.spark.tagline') }}
            </h2>

            <!-- La carte de la montre : ce qui reste à lire une fois la trotteuse arrêtée. -->
            <div
              class="spark-step spark-step--4 mt-4 w-full rounded-2xl bg-white p-4 text-left text-black shadow-2xl"
            >
              <p
                class="truncate text-[10px] font-semibold uppercase tracking-[0.22em] text-gray-500"
              >
                {{ watch.brand }}
              </p>
              <p class="mt-0.5 text-base font-semibold leading-tight">{{ watchName }}</p>
              <div class="mt-1 flex flex-wrap items-baseline justify-between gap-x-3">
                <span class="flex items-baseline gap-2">
                  <span v-if="watch.isOnPromotion" class="text-sm text-gray-400 line-through">
                    {{ formatPrice(watch.price) }}
                  </span>
                  <span class="font-heading text-xl font-bold text-primary">
                    {{ formatPrice(effectivePrice) }}
                  </span>
                </span>
                <span v-if="cardMeta" class="text-xs text-gray-500">{{ cardMeta }}</span>
              </div>

              <template v-if="reasons.length">
                <p
                  class="mt-3 border-t border-cream-200 pt-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-gray-500"
                >
                  {{ t('matchmaking.spark.reasons') }}
                </p>
                <ul class="mt-2 flex flex-wrap gap-1.5">
                  <li
                    v-for="reason in reasons"
                    :key="`${reason.criterionId}:${reason.value}`"
                    class="inline-flex items-center gap-1.5 rounded-full bg-cream px-2.5 py-1 text-[11px] font-semibold text-primary"
                  >
                    <span
                      v-if="reason.gradient"
                      class="h-2.5 w-2.5 rounded-full border border-black/10"
                      :style="{ background: reason.gradient }"
                      aria-hidden="true"
                    />
                    {{ optionLabel(reason) }}
                  </li>
                </ul>
              </template>

              <div
                v-if="affinity !== null"
                class="mt-3 flex items-center gap-3 text-[11px] text-gray-500"
              >
                <span>{{ t('matchmaking.spark.affinity') }}</span>
                <div
                  class="h-[3px] flex-1 overflow-hidden rounded-full bg-cream-200"
                  role="meter"
                  :aria-valuenow="affinity"
                  aria-valuemin="0"
                  aria-valuemax="100"
                  :aria-label="t('matchmaking.spark.affinity')"
                >
                  <div
                    class="spark-meter h-full rounded-full bg-primary"
                    :style="{ width: `${affinity}%` }"
                  />
                </div>
                <span class="text-xs font-semibold tabular-nums text-primary"
                  >{{ affinity }} %</span
                >
              </div>
            </div>

            <p class="spark-step spark-step--5 spark-muted mt-3 text-xs">{{ rarityLabel }}</p>

            <div class="spark-step spark-step--6 mt-4 flex w-full flex-col items-center gap-3">
              <RouterLink
                v-if="watch.slug"
                :to="`/montre/${watch.slug}`"
                class="spark-cta inline-flex w-full items-center justify-center rounded-lg py-3.5 text-xs font-semibold uppercase tracking-[0.16em] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                @click="emit('close')"
              >
                {{ t('matchmaking.spark.viewPage') }}
              </RouterLink>
              <button
                ref="continueRef"
                type="button"
                class="spark-link text-sm underline underline-offset-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                @click="emit('close')"
              >
                {{ t('matchmaking.spark.continue') }}
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch as watchEffect } from 'vue'
import { Heart } from '@lucide/vue'

import { t, tc } from '@/i18n'
import { formatPrice } from '@/utils/formatters.js'
import { watchCardImageUrl } from '@/utils/watchImageUrl.js'

const props = defineProps({
  open: { type: Boolean, default: false },
  watch: { type: Object, default: null },
  /** Rang de ce coup de foudre dans la session (1 pour le premier). */
  ordinal: { type: Number, default: 1 },
  /** Montres découvertes à l'instant du coup de foudre, celle-ci comprise. */
  seenCount: { type: Number, default: 1 },
  /** Part du poids exprimé cochée, en %, ou `null` sans critère exprimé. */
  affinity: { type: Number, default: null },
  /** Préférences cochées par la montre : options de facette (`label` ou `labelKey`). */
  reasons: { type: Array, default: () => [] },
})

const emit = defineEmits(['close'])

/** Durée de l'éclair avant que le cadran ne prenne le relais. */
const INTRO_MS = 1600
/** Tour de la trotteuse : départ et durée, partagés avec la feuille de style. */
const SWEEP_DELAY_MS = 250
const SWEEP_MS = 1500

const BOLT_PATH = 'M28 2 8 36h14l-4 26 22-36H26l4-24z'

/** Les soixante index de minute, les heures plus longues et plus épaisses. */
const TICKS = Array.from({ length: 60 }, (_, index) => {
  const hour = index % 5 === 0
  const angle = (index / 60) * Math.PI * 2
  const inner = hour ? 90 : 93
  const round = (value) => Math.round(value * 100) / 100
  return {
    index,
    width: hour ? 1.8 : 0.9,
    x1: round(98 + Math.sin(angle) * inner),
    y1: round(98 - Math.cos(angle) * inner),
    x2: round(98 + Math.sin(angle) * 97),
    y2: round(98 - Math.cos(angle) * 97),
    // L'index s'allume au passage de la trotteuse.
    delay: Math.round(SWEEP_DELAY_MS + (index / 60) * SWEEP_MS),
  }
})

const dialogRef = ref(null)
const continueRef = ref(null)
/** `intro` (l'éclair) puis `reveal` (le cadran et la fiche). */
const act = ref('intro')

const watchName = computed(() => props.watch?.model || props.watch?.name || '')
const effectivePrice = computed(() => props.watch?.effectivePrice ?? props.watch?.price)
const imageSrc = computed(() => watchCardImageUrl(props.watch?.images?.[0], { width: 640 }))

/** Année et exclusivité ; « pièce unique » seulement quand le stock le dit. */
const cardMeta = computed(() =>
  [props.watch?.year, props.watch?.stockQuantity === 1 ? t('matchmaking.spark.uniquePiece') : null]
    .filter(Boolean)
    .join(' · '),
)

/** Mots, puis lettres numérotées sur tout le titre pour un décalage d'apparition continu. */
const titleWords = computed(() => {
  let index = 0
  return t('matchmaking.spark.title')
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => [...word].map((char) => ({ char, index: index++ })))
})

const ordinalLabel = computed(() =>
  props.ordinal <= 1
    ? t('matchmaking.spark.first')
    : t('matchmaking.spark.ordinal', { count: props.ordinal }),
)

/** La rareté en chiffres réels : coups de foudre rapportés aux montres découvertes. */
const rarityLabel = computed(() =>
  props.ordinal <= 1
    ? tc('matchmaking.spark.rarityFirst', Math.max(1, props.seenCount))
    : t('matchmaking.spark.rarityMany', { sparks: props.ordinal, count: props.seenCount }),
)

function optionLabel(option) {
  if (option.label) return option.label
  return option.labelKey ? t(option.labelKey) : option.value
}

/* ------------------------------------------------------------ Mise en scène */

let introTimer = null

function clearIntroTimer() {
  if (introTimer !== null) clearTimeout(introTimer)
  introTimer = null
}

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  )
}

/** Passe de l'éclair au cadran (fin du minuteur, appui, Entrée ou Espace). */
function reveal() {
  clearIntroTimer()
  act.value = 'reveal'
}

/** Le cadran monté : le focus va sur « continuer », la fiche est à une tabulation. */
function onActEntered() {
  if (act.value === 'reveal') continueRef.value?.focus({ preventScroll: true })
}

/** Le pouce sent l'éclair là où l'appareil le permet (Android) ; ailleurs, rien. */
function buzz() {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return
  try {
    navigator.vibrate([10, 50, 30])
  } catch {
    /* refusé hors geste utilisateur : sans conséquence */
  }
}

/* ----------------------------------------------------- Clavier et focus */

const FOCUSABLE = 'a[href], button:not([disabled])'

function onKeyDown(event) {
  if (event.key === 'Escape') {
    event.stopPropagation()
    emit('close')
    return
  }
  if (act.value === 'intro' && (event.key === 'Enter' || event.key === ' ')) {
    event.preventDefault()
    reveal()
    return
  }
  if (event.key !== 'Tab' || !dialogRef.value) return
  const focusables = [...dialogRef.value.querySelectorAll(FOCUSABLE)]
  if (!focusables.length) {
    event.preventDefault()
    return
  }
  const first = focusables[0]
  const last = focusables[focusables.length - 1]
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  } else if (!dialogRef.value.contains(document.activeElement)) {
    event.preventDefault()
    first.focus()
  }
}

let previouslyFocused = null
let scrollLocked = false

function lockScroll() {
  if (scrollLocked || typeof document === 'undefined') return
  document.body.style.overflow = 'hidden'
  scrollLocked = true
}

function unlockScroll() {
  if (!scrollLocked || typeof document === 'undefined') return
  document.body.style.overflow = ''
  scrollLocked = false
}

watchEffect(
  () => props.open && Boolean(props.watch),
  async (isOpen) => {
    clearIntroTimer()
    if (isOpen) {
      previouslyFocused = typeof document !== 'undefined' ? document.activeElement : null
      lockScroll()
      if (prefersReducedMotion()) {
        act.value = 'reveal'
      } else {
        act.value = 'intro'
        buzz()
        introTimer = setTimeout(reveal, INTRO_MS)
      }
      await nextTick()
      if (act.value === 'reveal') continueRef.value?.focus({ preventScroll: true })
      else dialogRef.value?.focus({ preventScroll: true })
      return
    }
    unlockScroll()
    previouslyFocused?.focus?.()
    previouslyFocused = null
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  clearIntroTimer()
  unlockScroll()
})
</script>

<style scoped>
/*
 * Couleurs tirées du thème de la vitrine seulement. Le fond part de la couleur primaire et
 * s'éclaire vers le médaillon : sur Sauvage, il retrouve à peu de chose près les surfaces
 * vertes du site (`page`, `pageAlt`, `pageRaised`).
 */
.spark-root {
  --spark-ink: var(--color-cream, #f7ede0);
  --spark-ink-soft: var(--color-cream-200, #e3d9cc);
  --spark-ink-muted: var(--color-cream-300, #d9cec0);
  --spark-dial: clamp(12rem, min(72vw, 33vh), 20rem);
  color: var(--spark-ink);
}

.spark-backdrop {
  background: var(--color-primary, #0f2a1d);
  background: radial-gradient(
    circle at 50% 30%,
    color-mix(in srgb, var(--color-primary-hover, #163d2a) 90%, #fff) 0%,
    var(--color-primary-hover, #163d2a) 36%,
    var(--color-primary, #0f2a1d) 72%
  );
}

.spark-eyebrow,
.spark-muted {
  color: var(--spark-ink-muted);
}

.spark-title {
  color: var(--spark-ink);
}

.spark-link {
  color: var(--spark-ink-soft);
}

.spark-link:focus-visible,
.spark-cta:focus-visible {
  --tw-ring-color: var(--spark-ink);
  --tw-ring-offset-color: var(--color-primary, #0f2a1d);
}

.spark-cta {
  background: #fff;
  color: var(--color-primary, #0f2a1d);
  transition: background-color 150ms ease;
}

.spark-cta:hover {
  background: var(--spark-ink);
}

/* ------------------------------------------------------------ 1. L'éclair */

.spark-bolt {
  width: 4.5rem;
  height: 6rem;
  color: var(--spark-ink);
  animation: spark-strike 520ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
}

.spark-bolt-line {
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
  animation: spark-draw 560ms cubic-bezier(0.6, 0, 0.3, 1) 80ms forwards;
}

.spark-bolt-fill {
  opacity: 0;
  animation: spark-fill 500ms ease-out 560ms forwards;
}

.spark-glow {
  width: 16rem;
  height: 16rem;
  top: 50%;
  left: 50%;
  margin: -11rem 0 0 -8rem;
  border-radius: 50%;
  background: radial-gradient(circle, var(--spark-ink) 0%, transparent 65%);
  opacity: 0;
  animation: spark-glow 1200ms ease-out 520ms both;
}

.spark-letter {
  animation: spark-letter 520ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
}

.spark-rule {
  background: var(--spark-ink-muted);
  transform-origin: center;
  animation: spark-rule 600ms cubic-bezier(0.2, 0.8, 0.2, 1) 1150ms both;
}

@keyframes spark-strike {
  from {
    opacity: 0;
    transform: translateY(-18px) scale(1.08);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@keyframes spark-draw {
  to {
    stroke-dashoffset: 0;
  }
}

@keyframes spark-fill {
  to {
    opacity: 0.16;
  }
}

@keyframes spark-glow {
  0% {
    opacity: 0;
    transform: scale(0.6);
  }
  25% {
    opacity: 0.22;
  }
  100% {
    opacity: 0;
    transform: scale(1.3);
  }
}

@keyframes spark-letter {
  from {
    opacity: 0;
    transform: translateY(0.4em);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@keyframes spark-rule {
  from {
    transform: scaleX(0);
  }
  to {
    transform: scaleX(1);
  }
}

/* ------------------------------------------------------------ 2. Le cadran */

.spark-dial {
  width: var(--spark-dial);
  height: var(--spark-dial);
}

.spark-tick {
  stroke: var(--spark-ink);
  stroke-linecap: round;
  opacity: 0.18;
}

.spark-tick--lit {
  opacity: 0;
  animation: spark-tick-on 300ms ease-out both;
}

/* Départ et durée : `SWEEP_DELAY_MS` et `SWEEP_MS` côté script. */
.spark-hand {
  stroke: var(--spark-ink);
  transform-origin: 98px 98px;
  animation:
    spark-sweep 1500ms cubic-bezier(0.45, 0.05, 0.35, 1) 250ms both,
    spark-hand-out 400ms ease 1800ms forwards;
}

.spark-medallion {
  /* Au plus près des index : la photo prend la place, l'anneau ne fait que l'encadrer. */
  inset: 8%;
  box-shadow:
    0 0 0 3px var(--color-primary, #0f2a1d),
    0 0 0 4px var(--spark-ink-muted),
    0 18px 40px rgba(0, 0, 0, 0.45);
  animation: spark-medallion 700ms cubic-bezier(0.2, 0.8, 0.2, 1) 80ms both;
}

.spark-pulse {
  border: 1px solid var(--spark-ink);
  opacity: 0;
  animation: spark-pulse 1100ms cubic-bezier(0.1, 0.6, 0.3, 1) 1750ms;
}

.spark-step {
  animation: spark-step 600ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
}
.spark-step--1 {
  animation-delay: 1500ms;
}
.spark-step--2 {
  animation-delay: 1600ms;
}
.spark-step--4 {
  animation-delay: 1850ms;
}
.spark-step--5 {
  animation-delay: 2000ms;
}
.spark-step--6 {
  animation-delay: 2050ms;
}

.spark-meter {
  transform-origin: left center;
  animation: spark-meter 900ms cubic-bezier(0.2, 0.8, 0.2, 1) 1900ms both;
}

@keyframes spark-tick-on {
  from {
    opacity: 0.18;
  }
  to {
    opacity: 1;
  }
}

@keyframes spark-sweep {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes spark-hand-out {
  to {
    opacity: 0;
  }
}

@keyframes spark-medallion {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@keyframes spark-pulse {
  0% {
    opacity: 0.8;
    transform: scale(1);
  }
  100% {
    opacity: 0;
    transform: scale(1.35);
  }
}

@keyframes spark-step {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@keyframes spark-meter {
  from {
    transform: scaleX(0);
  }
  to {
    transform: scaleX(1);
  }
}

/* -------------------------------------------------------- Enchaînements */

.spark-fade-enter-active {
  transition: opacity 220ms ease-out;
}

.spark-fade-leave-active {
  transition: opacity 260ms ease-in;
}

.spark-fade-enter-from,
.spark-fade-leave-to {
  opacity: 0;
}

/* L'éclair s'efface en montant légèrement ; le cadran apparaît sur place. */
.spark-act-leave-active {
  transition:
    opacity 340ms ease-in,
    transform 340ms ease-in,
    filter 340ms ease-in;
}

.spark-act-leave-to {
  opacity: 0;
  transform: translateY(-16px) scale(1.04);
  filter: blur(4px);
}

.spark-act-enter-active {
  transition: opacity 200ms ease-out;
}

.spark-act-enter-from {
  opacity: 0;
}

/* Mouvement réduit : pas d'éclair, le cadran directement dans son état final. */
@media (prefers-reduced-motion: reduce) {
  .spark-hand,
  .spark-pulse {
    display: none;
  }

  .spark-tick--lit {
    animation: none;
    opacity: 1;
  }

  .spark-medallion,
  .spark-step,
  .spark-meter,
  .spark-bolt,
  .spark-bolt-line,
  .spark-bolt-fill,
  .spark-glow,
  .spark-letter,
  .spark-rule {
    animation: none;
  }

  .spark-fade-enter-active,
  .spark-fade-leave-active,
  .spark-act-enter-active,
  .spark-act-leave-active {
    transition: none;
  }
}
</style>

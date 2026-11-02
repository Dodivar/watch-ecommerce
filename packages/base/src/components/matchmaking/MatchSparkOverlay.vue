<template>
  <!--
    Écran de célébration du coup de foudre (voir `watchMatchSpark.js` pour ce qui le
    déclenche, et pourquoi c'est rare). La mise en scène se joue en une seconde et demie :
    l'éclair frappe, l'écran blanchit, la montre jaillit dans son médaillon au milieu d'une
    gerbe d'étincelles, puis le titre s'écrit et la fiche monte. Tout ce qui est animé l'est
    en CSS — rien n'attend la fin d'une animation pour être cliquable ou lu, et
    `prefers-reduced-motion` donne directement l'état final.
  -->
  <Teleport to="body">
    <Transition name="spark-fade">
      <div
        v-if="open && watch"
        ref="dialogRef"
        class="spark-root fixed inset-0 z-[10000] overflow-y-auto overscroll-contain text-white"
        role="dialog"
        aria-modal="true"
        :aria-label="t('matchmaking.spark.dialogLabel', { name: watchName })"
        tabindex="-1"
        data-testid="match-spark"
        @keydown="onKeyDown"
      >
        <div class="spark-backdrop fixed inset-0" aria-hidden="true" @click="emit('close')" />
        <div class="spark-flash pointer-events-none fixed inset-0" aria-hidden="true" />
        <div class="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
          <span
            v-for="star in stars"
            :key="star.id"
            class="spark-star absolute rounded-full bg-white"
            :style="star.style"
          />
        </div>

        <div
          class="relative mx-auto flex min-h-full w-full max-w-sm flex-col sm:max-w-md items-center justify-center px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-16 text-center"
        >
          <!-- Scène : l'éclair, l'anneau, le médaillon et sa gerbe. -->
          <div class="spark-stage relative flex items-center justify-center" aria-hidden="true">
            <svg class="spark-bolt absolute" viewBox="0 0 24 24" fill="none">
              <defs>
                <linearGradient :id="boltGradientId" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#fff7d6" />
                  <stop offset="55%" stop-color="#ffd166" />
                  <stop offset="100%" stop-color="#f4a62a" />
                </linearGradient>
              </defs>
              <path
                class="spark-bolt-path"
                d="M13.5 1.5 3.8 13.6h6.9L9.4 22.5l10.8-13h-7.1l.4-8z"
                :fill="`url(#${boltGradientId})`"
                stroke="#fff7d6"
                stroke-width="0.6"
                stroke-linejoin="round"
              />
            </svg>

            <span class="spark-shockwave absolute rounded-full" />
            <span class="spark-shockwave spark-shockwave--late absolute rounded-full" />
            <span class="spark-ring absolute rounded-full" />

            <div class="spark-medallion relative overflow-hidden rounded-full bg-white">
              <img
                v-if="imageSrc"
                :src="imageSrc"
                alt=""
                decoding="async"
                draggable="false"
                class="h-full w-full object-cover object-center"
              />
              <span v-else class="flex h-full w-full items-center justify-center text-primary">
                <Heart class="h-12 w-12" :stroke-width="1.5" />
              </span>
            </div>

            <span
              v-for="particle in particles"
              :key="particle.id"
              class="spark-particle absolute"
              :class="particle.heart ? 'text-[#ff5d7a]' : 'text-[#ffd166]'"
              :style="particle.style"
            >
              <Heart
                v-if="particle.heart"
                class="h-full w-full"
                fill="currentColor"
                :stroke-width="0"
              />
              <span v-else class="block h-full w-full rounded-full bg-current" />
            </span>
          </div>

          <p
            class="spark-rise spark-rise--1 mt-6 text-[11px] font-semibold uppercase tracking-[0.3em] text-[#ffd166]"
          >
            {{ ordinalLabel }}
          </p>
          <h2
            class="spark-title mt-2 font-heading text-4xl font-bold leading-none sm:text-5xl"
            :aria-label="t('matchmaking.spark.title')"
          >
            <!-- Mot par mot, insécables : le titre peut passer à la ligne entre deux mots,
                 jamais au milieu d'un (« foud / re »). -->
            <template v-for="(word, w) in titleWords" :key="w">
              <span class="inline-block whitespace-nowrap" aria-hidden="true">
                <span
                  v-for="letter in word"
                  :key="letter.index"
                  class="spark-letter inline-block"
                  :style="{ animationDelay: `${520 + letter.index * 45}ms` }"
                  >{{ letter.char }}</span
                >
              </span>
              {{ ' ' }}
            </template>
          </h2>
          <p class="spark-rise spark-rise--2 mt-3 text-sm text-white/75">
            {{ t('matchmaking.spark.tagline') }}
          </p>

          <!-- La montre elle-même : ce qui reste à lire une fois l'éclair passé. -->
          <div
            class="spark-rise spark-rise--3 spark-card mt-5 w-full rounded-2xl border border-white/15 bg-white/10 p-4 text-left sm:p-5 backdrop-blur-md"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <p
                  class="truncate text-[11px] font-semibold uppercase tracking-[0.2em] text-white/60"
                >
                  {{ watch.brand }}
                </p>
                <p class="mt-0.5 text-lg font-semibold leading-tight">{{ watchName }}</p>
              </div>
              <span
                v-if="isUniquePiece"
                class="shrink-0 rounded-full border border-[#ffd166]/60 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-[#ffd166]"
              >
                {{ t('matchmaking.spark.uniquePiece') }}
              </span>
            </div>

            <div class="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span v-if="watch.isOnPromotion" class="text-sm text-white/50 line-through">
                {{ formatPrice(watch.price) }}
              </span>
              <span class="text-2xl font-bold">{{ formatPrice(effectivePrice) }}</span>
              <span v-if="watch.year" class="text-sm text-white/60">· {{ watch.year }}</span>
            </div>

            <template v-if="reasons.length">
              <p class="mt-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/60">
                {{ t('matchmaking.spark.reasons') }}
              </p>
              <ul class="mt-2 flex flex-wrap gap-2">
                <li
                  v-for="(reason, index) in reasons"
                  :key="`${reason.criterionId}:${reason.value}`"
                  class="spark-chip inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium"
                  :style="{ animationDelay: `${1100 + index * 90}ms` }"
                >
                  <span
                    v-if="reason.gradient"
                    class="h-3 w-3 rounded-full border border-white/40"
                    :style="{ background: reason.gradient }"
                    aria-hidden="true"
                  />
                  <Check
                    v-else
                    class="h-3.5 w-3.5 text-[#ffd166]"
                    :stroke-width="3"
                    aria-hidden="true"
                  />
                  {{ optionLabel(reason) }}
                </li>
              </ul>
            </template>

            <div v-if="affinity !== null" class="mt-4">
              <div class="flex items-baseline justify-between text-xs">
                <span class="font-semibold uppercase tracking-[0.2em] text-white/60">
                  {{ t('matchmaking.spark.affinity') }}
                </span>
                <span class="text-sm font-bold tabular-nums text-[#ffd166]">{{ affinity }} %</span>
              </div>
              <div
                class="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/15"
                role="meter"
                :aria-valuenow="affinity"
                aria-valuemin="0"
                aria-valuemax="100"
                :aria-label="t('matchmaking.spark.affinity')"
              >
                <div class="spark-meter h-full rounded-full" :style="{ width: `${affinity}%` }" />
              </div>
            </div>
          </div>

          <p class="spark-rise spark-rise--4 mt-4 text-xs text-white/60">{{ rarityLabel }}</p>

          <div class="spark-rise spark-rise--5 mt-5 flex w-full flex-col gap-3">
            <RouterLink
              v-if="watch.slug"
              :to="`/montre/${watch.slug}`"
              class="spark-cta inline-flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-sm font-bold uppercase tracking-wide text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              @click="emit('close')"
            >
              {{ t('matchmaking.spark.viewPage') }}
              <ArrowRight class="h-5 w-5" :stroke-width="2.5" />
            </RouterLink>
            <button
              ref="continueRef"
              type="button"
              class="inline-flex w-full items-center justify-center rounded-full border border-white/40 py-3 text-sm font-semibold uppercase tracking-wide text-white hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              @click="emit('close')"
            >
              {{ t('matchmaking.spark.continue') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref, useId, watch as watchEffect } from 'vue'
import { ArrowRight, Check, Heart } from '@lucide/vue'

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

const dialogRef = ref(null)
const continueRef = ref(null)
const boltGradientId = `spark-bolt-${useId()}`

const watchName = computed(() => props.watch?.model || props.watch?.name || '')
const effectivePrice = computed(() => props.watch?.effectivePrice ?? props.watch?.price)
const imageSrc = computed(() => watchCardImageUrl(props.watch?.images?.[0], { width: 640 }))
/** Annoncée seulement quand le stock le dit : une promesse d'exclusivité doit être vraie. */
const isUniquePiece = computed(() => props.watch?.stockQuantity === 1)

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

const particles = ref([])
const stars = ref([])

/** Gerbe tirée à chaque ouverture : jamais deux coups de foudre tout à fait pareils. */
function scatter() {
  const count = 26
  particles.value = Array.from({ length: count }, (_, index) => {
    const angle = (index / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.4
    const distance = 110 + Math.random() * 90
    const size = 6 + Math.random() * 10
    return {
      id: index,
      heart: index % 3 === 0,
      style: {
        width: `${size}px`,
        height: `${size}px`,
        '--dx': `${Math.cos(angle) * distance}px`,
        '--dy': `${Math.sin(angle) * distance}px`,
        '--spin': `${(Math.random() - 0.5) * 220}deg`,
        animationDelay: `${260 + Math.random() * 120}ms`,
      },
    }
  })
  stars.value = Array.from({ length: 28 }, (_, index) => {
    const size = 1 + Math.random() * 2.5
    return {
      id: index,
      style: {
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        width: `${size}px`,
        height: `${size}px`,
        animationDelay: `${Math.random() * 3}s`,
        animationDuration: `${2.4 + Math.random() * 2.4}s`,
      },
    }
  })
}

/** Le pouce sent l'éclair là où l'appareil le permet (Android) ; ailleurs, rien. */
function buzz() {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
  try {
    navigator.vibrate([14, 60, 28, 40, 90])
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
  if (event.key !== 'Tab' || !dialogRef.value) return
  const focusables = [...dialogRef.value.querySelectorAll(FOCUSABLE)]
  if (!focusables.length) return
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
    if (isOpen) {
      scatter()
      buzz()
      previouslyFocused = typeof document !== 'undefined' ? document.activeElement : null
      lockScroll()
      await nextTick()
      // Le focus va sur « continuer » : Entrée ou Espace referment, comme on s'y attend
      // après une célébration ; la fiche est à une tabulation.
      ;(continueRef.value ?? dialogRef.value)?.focus({ preventScroll: true })
      return
    }
    unlockScroll()
    previouslyFocused?.focus?.()
    previouslyFocused = null
  },
  { immediate: true },
)

onBeforeUnmount(unlockScroll)
</script>

<style scoped>
.spark-root {
  --spark-gold: #ffd166;
  /* Bornée aussi par la hauteur : sur un portable 800 px ou un iPhone SE, la fiche et les
     deux boutons doivent tenir sous le médaillon sans défiler. */
  --spark-medallion: clamp(7rem, min(38vw, 19vh), 11rem);
}

.spark-backdrop {
  background: #0b0a10;
  background:
    radial-gradient(
      circle at 50% 28%,
      color-mix(in srgb, var(--color-primary, #7a1f3d) 70%, #ff5d7a) 0%,
      color-mix(in srgb, var(--color-primary, #7a1f3d) 45%, #0b0a10) 32%,
      #0b0a10 72%
    ),
    #0b0a10;
}

/* --------------------------------------------------------------- L'éclair */

.spark-flash {
  background: radial-gradient(circle at 50% 30%, #fff 0%, #fff7d6 35%, transparent 75%);
  opacity: 0;
  animation: spark-flash 700ms ease-out 140ms both;
}

@keyframes spark-flash {
  0% {
    opacity: 0;
  }
  12% {
    opacity: 0.95;
  }
  22% {
    opacity: 0.25;
  }
  32% {
    opacity: 0.8;
  }
  100% {
    opacity: 0;
  }
}

.spark-stage {
  width: var(--spark-medallion);
  height: var(--spark-medallion);
}

.spark-bolt {
  width: 70%;
  height: 70%;
  top: -48%;
  left: 60%;
  z-index: 2;
  filter: drop-shadow(0 0 10px rgba(255, 209, 102, 0.9))
    drop-shadow(0 0 28px rgba(255, 140, 60, 0.6));
  transform-origin: 50% 100%;
  animation:
    spark-bolt-strike 420ms cubic-bezier(0.6, 0, 0.9, 0.4) both,
    spark-bolt-glow 2.6s ease-in-out 1.2s infinite;
}

@keyframes spark-bolt-strike {
  0% {
    opacity: 0;
    transform: translate(40%, -140%) rotate(14deg) scale(1.6);
  }
  60% {
    opacity: 1;
  }
  100% {
    opacity: 1;
    transform: translate(0, 0) rotate(14deg) scale(1);
  }
}

@keyframes spark-bolt-glow {
  0%,
  100% {
    filter: drop-shadow(0 0 10px rgba(255, 209, 102, 0.9))
      drop-shadow(0 0 28px rgba(255, 140, 60, 0.6));
  }
  50% {
    filter: drop-shadow(0 0 16px rgba(255, 230, 160, 1))
      drop-shadow(0 0 40px rgba(255, 140, 60, 0.85));
  }
}

/* ------------------------------------------------------------ Le médaillon */

.spark-medallion {
  width: 100%;
  height: 100%;
  z-index: 1;
  box-shadow:
    0 0 0 4px rgba(255, 255, 255, 0.95),
    0 0 40px 6px rgba(255, 209, 102, 0.55),
    0 20px 50px rgba(0, 0, 0, 0.5);
  animation: spark-pop 720ms cubic-bezier(0.2, 1.5, 0.4, 1) 220ms both;
}

@keyframes spark-pop {
  0% {
    opacity: 0;
    transform: scale(0.2) rotate(-18deg);
  }
  100% {
    opacity: 1;
    transform: scale(1) rotate(0);
  }
}

.spark-ring {
  inset: -14px;
  background: conic-gradient(
    from 0deg,
    transparent 0deg,
    var(--spark-gold) 60deg,
    #fff 90deg,
    transparent 150deg,
    transparent 200deg,
    #ff5d7a 260deg,
    var(--spark-gold) 300deg,
    transparent 360deg
  );
  mask: radial-gradient(circle, transparent 62%, #000 64%, #000 70%, transparent 72%);
  -webkit-mask: radial-gradient(circle, transparent 62%, #000 64%, #000 70%, transparent 72%);
  animation:
    spark-fade-in 400ms ease-out 600ms both,
    spark-spin 6s linear 600ms infinite;
}

@keyframes spark-spin {
  to {
    transform: rotate(360deg);
  }
}

.spark-shockwave {
  inset: 0;
  border: 2px solid rgba(255, 247, 214, 0.9);
  opacity: 0;
  animation: spark-shockwave 900ms cubic-bezier(0.1, 0.6, 0.3, 1) 280ms both;
}

.spark-shockwave--late {
  border-color: rgba(255, 93, 122, 0.7);
  animation-delay: 440ms;
}

@keyframes spark-shockwave {
  0% {
    opacity: 0.9;
    transform: scale(0.6);
  }
  100% {
    opacity: 0;
    transform: scale(2.4);
  }
}

/* ---------------------------------------------------------------- La gerbe */

.spark-particle {
  left: 50%;
  top: 50%;
  z-index: 3;
  opacity: 0;
  animation: spark-burst 1100ms cubic-bezier(0.15, 0.7, 0.3, 1) both;
}

@keyframes spark-burst {
  0% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(0.3) rotate(0);
  }
  70% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(1)
      rotate(var(--spin));
  }
}

.spark-star {
  opacity: 0;
  animation: spark-twinkle ease-in-out infinite;
}

@keyframes spark-twinkle {
  0%,
  100% {
    opacity: 0;
    transform: scale(0.6);
  }
  50% {
    opacity: 0.8;
    transform: scale(1);
  }
}

/* ------------------------------------------------------------- Le texte */

.spark-letter {
  animation: spark-letter 560ms cubic-bezier(0.2, 1.4, 0.4, 1) both;
  text-shadow: 0 0 24px rgba(255, 209, 102, 0.55);
}

@keyframes spark-letter {
  0% {
    opacity: 0;
    transform: translateY(0.6em) scale(0.6);
    filter: blur(6px);
  }
  100% {
    opacity: 1;
    transform: none;
    filter: none;
  }
}

.spark-rise {
  animation: spark-rise 600ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
}

.spark-rise--1 {
  animation-delay: 440ms;
}
.spark-rise--2 {
  animation-delay: 900ms;
}
.spark-rise--3 {
  animation-delay: 1000ms;
}
.spark-rise--4 {
  animation-delay: 1300ms;
}
.spark-rise--5 {
  animation-delay: 1400ms;
}

@keyframes spark-rise {
  0% {
    opacity: 0;
    transform: translateY(16px);
  }
  100% {
    opacity: 1;
    transform: none;
  }
}

.spark-chip {
  animation: spark-chip 420ms cubic-bezier(0.2, 1.5, 0.4, 1) both;
}

@keyframes spark-chip {
  0% {
    opacity: 0;
    transform: scale(0.6);
  }
  100% {
    opacity: 1;
    transform: none;
  }
}

.spark-meter {
  background: linear-gradient(90deg, #ff5d7a, var(--spark-gold));
  transform-origin: left center;
  animation: spark-meter 900ms cubic-bezier(0.2, 0.8, 0.2, 1) 1250ms both;
}

@keyframes spark-meter {
  from {
    transform: scaleX(0);
  }
  to {
    transform: scaleX(1);
  }
}

.spark-cta {
  background: linear-gradient(135deg, #fff7d6 0%, var(--spark-gold) 55%, #f4a62a 100%);
  box-shadow: 0 10px 30px rgba(255, 209, 102, 0.35);
  transition: transform 150ms ease;
}

.spark-cta:hover {
  transform: translateY(-1px);
}

@keyframes spark-fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* --------------------------------------------------------- Entrée / sortie */

.spark-fade-enter-active {
  transition: opacity 180ms ease-out;
}

.spark-fade-leave-active {
  transition:
    opacity 260ms ease-in,
    transform 260ms ease-in;
}

.spark-fade-enter-from,
.spark-fade-leave-to {
  opacity: 0;
}

.spark-fade-leave-to {
  transform: scale(1.03);
}

/* Mouvement réduit : l'état final d'emblée, sans éclair ni gerbe. */
@media (prefers-reduced-motion: reduce) {
  .spark-flash,
  .spark-particle,
  .spark-shockwave,
  .spark-star {
    display: none;
  }

  .spark-bolt,
  .spark-medallion,
  .spark-ring,
  .spark-letter,
  .spark-rise,
  .spark-chip,
  .spark-meter,
  .spark-cta {
    animation: none;
    transition: none;
  }

  .spark-fade-enter-active,
  .spark-fade-leave-active {
    transition: none;
  }
}
</style>

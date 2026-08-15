<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'

const dialRef = ref(null)
const secondHandAngle = ref(-90)
const parallaxX = ref(0)
const parallaxY = ref(0)

let animationFrame = null
let reducedMotion = false
let pointerFine = false

const dialTransform = computed(() => {
  const tiltX = parallaxY.value * -4
  const tiltY = parallaxX.value * 4
  return `perspective(900px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`
})

function tick() {
  const now = new Date()
  secondHandAngle.value = (now.getSeconds() + now.getMilliseconds() / 1000) * 6 - 90
  animationFrame = requestAnimationFrame(tick)
}

function handlePointerMove(event) {
  if (!pointerFine || reducedMotion || !dialRef.value) return

  const rect = dialRef.value.getBoundingClientRect()
  const centerX = rect.left + rect.width / 2
  const centerY = rect.top + rect.height / 2
  const normalizedX = (event.clientX - centerX) / (rect.width / 2)
  const normalizedY = (event.clientY - centerY) / (rect.height / 2)

  parallaxX.value = Math.max(-1, Math.min(1, normalizedX)) * 0.35
  parallaxY.value = Math.max(-1, Math.min(1, normalizedY)) * 0.35
}

function resetParallax() {
  parallaxX.value = 0
  parallaxY.value = 0
}

onMounted(() => {
  reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  pointerFine = window.matchMedia('(pointer: fine)').matches

  if (!reducedMotion) {
    animationFrame = requestAnimationFrame(tick)
  }

  if (pointerFine && !reducedMotion) {
    window.addEventListener('pointermove', handlePointerMove, { passive: true })
    window.addEventListener('pointerleave', resetParallax)
  }
})

onUnmounted(() => {
  if (animationFrame) cancelAnimationFrame(animationFrame)
  window.removeEventListener('pointermove', handlePointerMove)
  window.removeEventListener('pointerleave', resetParallax)
})
</script>

<template>
  <div
    class="hero-visual pointer-events-none absolute inset-0 overflow-hidden"
    aria-hidden="true"
  >
    <div class="hero-visual__orbit hero-visual__orbit--outer">
      <span class="hero-visual__orbit-dot" />
    </div>
    <div class="hero-visual__orbit hero-visual__orbit--inner">
      <span class="hero-visual__orbit-dot hero-visual__orbit-dot--small" />
    </div>

    <div
      ref="dialRef"
      class="hero-visual__dial-wrap"
      :style="{ transform: dialTransform }"
    >
      <svg
        class="hero-visual__dial"
        viewBox="0 0 420 420"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g class="hero-visual__bezel-spin">
          <circle cx="210" cy="210" r="198" stroke="var(--hero-ring)" stroke-width="2.5" />
          <circle cx="210" cy="210" r="188" stroke="var(--hero-line-soft)" stroke-width="1" />
          <g stroke="var(--hero-line)" stroke-width="1.5">
            <line
              v-for="index in 60"
              :key="`tick-${index}`"
              x1="210"
              y1="24"
              x2="210"
              :y2="index % 5 === 0 ? 38 : 32"
              :transform="`rotate(${(index - 1) * 6} 210 210)`"
            />
          </g>
        </g>

        <circle
          cx="210"
          cy="210"
          r="168"
          fill="var(--hero-face)"
          stroke="var(--hero-line-soft)"
          stroke-width="1"
        />

        <g stroke="var(--hero-mark)" stroke-width="1">
          <line x1="210" y1="58" x2="210" y2="78" />
          <line x1="210" y1="342" x2="210" y2="362" />
          <line x1="58" y1="210" x2="78" y2="210" />
          <line x1="342" y1="210" x2="362" y2="210" />
        </g>

        <g class="hero-visual__tourbillon">
          <circle cx="210" cy="286" r="34" stroke="var(--hero-mark-soft)" stroke-width="1" />
          <circle
            cx="210"
            cy="286"
            r="24"
            stroke="var(--hero-mark-soft)"
            stroke-width="1"
            stroke-dasharray="3 5"
          />
          <g stroke="var(--hero-mark)" stroke-width="1.2" stroke-linecap="round">
            <line x1="210" y1="262" x2="210" y2="310" />
            <line x1="186" y1="286" x2="234" y2="286" />
            <line x1="193" y1="269" x2="227" y2="303" />
            <line x1="227" y1="269" x2="193" y2="303" />
          </g>
          <circle cx="210" cy="286" r="4" fill="var(--hero-hand)" />
        </g>

        <g transform="rotate(305 210 210)">
          <path
            d="M210 210 L210 118"
            stroke="var(--hero-hand)"
            stroke-width="5"
            stroke-linecap="round"
          />
        </g>

        <g transform="rotate(60 210 210)">
          <path
            d="M210 210 L210 96"
            stroke="var(--hero-hand)"
            stroke-width="4"
            stroke-linecap="round"
          />
        </g>

        <g :transform="`rotate(${secondHandAngle} 210 210)`">
          <path
            d="M210 210 L210 82"
            stroke="var(--hero-second)"
            stroke-width="1.5"
            stroke-linecap="round"
          />
          <circle cx="210" cy="210" r="5" fill="var(--hero-hand)" />
        </g>
      </svg>

      <div class="hero-visual__glass-edge" />
    </div>

    <div class="hero-visual__particles">
      <span v-for="index in 10" :key="`particle-${index}`" class="hero-visual__particle" />
    </div>
  </div>
</template>

<style scoped>
/*
 * Aplats uniquement — aucun dégradé, aucun halo flouté : le cadran est un
 * disque plein posé sur le fond, cerclé de filets fins.
 * Les teintes viennent de la palette du site et basculent avec le thème.
 */
/* `:where()` garde ces valeurs par défaut à spécificité nulle : le thème vert
   les redéfinit depuis `assets/theme-dark.css`, où vivent les choix de thème. */
:where(.hero-visual) {
  --hero-face: var(--color-cream);
  --hero-ring: var(--color-primary);
  --hero-line: rgba(15, 42, 29, 0.3);
  --hero-line-soft: rgba(15, 42, 29, 0.12);
  --hero-mark: rgba(15, 42, 29, 0.35);
  --hero-mark-soft: rgba(15, 42, 29, 0.15);
  --hero-hand: var(--color-primary);
  --hero-second: #8b1d1d;
  --hero-orbit: rgba(15, 42, 29, 0.18);
  --hero-orbit-dot: var(--color-primary);
}

.hero-visual__orbit {
  position: absolute;
  top: 50%;
  right: min(8vw, 96px);
  width: min(72vw, 620px);
  aspect-ratio: 1;
  translate: 0 -50%;
  border: 1px solid var(--hero-orbit);
  border-radius: 9999px;
  animation: hero-orbit-spin 48s linear infinite;
}

.hero-visual__orbit--inner {
  width: min(58vw, 500px);
  right: min(14vw, 150px);
  animation-direction: reverse;
  animation-duration: 36s;
}

.hero-visual__orbit-dot {
  position: absolute;
  top: -3px;
  left: 50%;
  width: 7px;
  height: 7px;
  translate: -50% 0;
  border-radius: 9999px;
  background: var(--hero-orbit-dot);
}

.hero-visual__orbit-dot--small {
  width: 5px;
  height: 5px;
}

.hero-visual__dial-wrap {
  position: absolute;
  top: 50%;
  right: min(4vw, 48px);
  width: min(78vw, 520px);
  translate: 0 -50%;
  transform-origin: center;
  transition: transform 500ms cubic-bezier(0.22, 1, 0.36, 1);
  will-change: transform;
}

.hero-visual__dial {
  position: relative;
  z-index: 1;
  width: 100%;
  height: auto;
  display: block;
}

.hero-visual__bezel-spin {
  transform-origin: 210px 210px;
  animation: hero-bezel-spin 120s linear infinite;
}

.hero-visual__tourbillon {
  transform-origin: 210px 286px;
  animation: hero-tourbillon 14s linear infinite;
}

.hero-visual__glass-edge {
  position: absolute;
  inset: 6%;
  border-radius: 9999px;
  border: 1px solid var(--hero-ring);
}

.hero-visual__particles {
  position: absolute;
  inset: 0;
}

.hero-visual__particle {
  position: absolute;
  width: 3px;
  height: 3px;
  border-radius: 9999px;
  background: var(--hero-orbit-dot);
  opacity: 0.45;
  animation: hero-float 12s ease-in-out infinite;
}

.hero-visual__particle:nth-child(1) { top: 18%; right: 24%; animation-delay: 0s; }
.hero-visual__particle:nth-child(2) { top: 28%; right: 12%; animation-delay: -1.4s; }
.hero-visual__particle:nth-child(3) { top: 42%; right: 30%; animation-delay: -2.8s; }
.hero-visual__particle:nth-child(4) { top: 56%; right: 18%; animation-delay: -4.1s; }
.hero-visual__particle:nth-child(5) { top: 66%; right: 28%; animation-delay: -5.5s; }
.hero-visual__particle:nth-child(6) { top: 24%; right: 36%; animation-delay: -6.2s; }
.hero-visual__particle:nth-child(7) { top: 48%; right: 8%; animation-delay: -7.4s; }
.hero-visual__particle:nth-child(8) { top: 72%; right: 14%; animation-delay: -8.1s; }
.hero-visual__particle:nth-child(9) { top: 34%; right: 42%; animation-delay: -9.3s; }
.hero-visual__particle:nth-child(10) { top: 58%; right: 38%; animation-delay: -10.6s; }

@media (max-width: 1023px) {
  .hero-visual__dial-wrap {
    top: auto;
    bottom: -8%;
    right: 50%;
    width: min(92vw, 420px);
    translate: 50% 0;
    opacity: 0.92;
  }

  .hero-visual__orbit {
    top: auto;
    bottom: 4%;
    right: 50%;
    translate: 50% 0;
  }

  .hero-visual__orbit--inner {
    right: 50%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero-visual__bezel-spin,
  .hero-visual__tourbillon,
  .hero-visual__orbit,
  .hero-visual__particle {
    animation: none !important;
  }

  .hero-visual__dial-wrap {
    transition: none;
  }
}

@keyframes hero-orbit-spin {
  to {
    rotate: 360deg;
  }
}

@keyframes hero-bezel-spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes hero-tourbillon {
  to {
    transform: rotate(360deg);
  }
}

@keyframes hero-float {
  0%,
  100% {
    transform: translate3d(0, 0, 0);
    opacity: 0.25;
  }
  50% {
    transform: translate3d(0, -16px, 0);
    opacity: 0.7;
  }
}
</style>

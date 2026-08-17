<script setup>
/**
 * Hero « vitrine » : le discours à gauche, une pièce du catalogue posée dans un
 * panneau blanc à droite, comme une devanture.
 *
 * Le texte vient de `home.hero` (voir `site/homeHero.js`) ; la montre exposée
 * est la première du catalogue encore en vente, donc la vitrine se renouvelle
 * toute seule. Sans catalogue joignable, le panneau disparaît et le discours
 * occupe toute la largeur.
 *
 * Le panneau s'oriente vers le pointeur (ou suit l'inclinaison du téléphone) :
 * la mécanique vit dans `useTiltMotion`, le rendu 3D dans le style ci-dessous.
 */
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { BadgeCheck, MapPin, ShieldCheck } from '@lucide/vue'

import { getSiteConfig } from '@/site/getSiteConfig.js'
import { isHomeHeroCtaVisible } from '@/site/homeHero.js'
import { getLatestAvailableWatches } from '@/services/watchService.js'
import { useTiltMotion } from '@/composables/useTiltMotion.js'
import { watchCardImageUrl } from '@/utils/watchImageUrl.js'
import { buildWatchPath } from '@/utils/watchSlug.js'

/** Une icône par point de réassurance, dans l'ordre déclaré par la config. */
const HIGHLIGHT_ICONS = [ShieldCheck, BadgeCheck, MapPin]

const site = getSiteConfig()
const hero = computed(() => site.home?.hero ?? {})
const features = computed(() => site.features ?? {})

const highlights = computed(() =>
  (hero.value.highlights ?? []).slice(0, HIGHLIGHT_ICONS.length),
)

/** Montre exposée : chargée au montage, `null` tant qu'elle n'est pas connue. */
const piece = ref(null)
const isLoadingPiece = ref(true)

const pieceImage = computed(() => {
  const url = piece.value?.images?.[0]
  if (!url) return null
  return watchCardImageUrl(url, { width: 800 }) ?? url
})

const piecePath = computed(() =>
  features.value.collection && piece.value ? buildWatchPath(piece.value) : null,
)

/** Le panneau n'existe que s'il a une vraie pièce et une vraie photo à montrer. */
const showPiece = computed(() => Boolean(piece.value && pieceImage.value))
const showPanel = computed(() => isLoadingPiece.value || showPiece.value)

const { tiltRef, tiltStyle } = useTiltMotion()

const showPrimaryCta = computed(() =>
  isHomeHeroCtaVisible(hero.value.primaryCta, features.value),
)
const showSecondaryCta = computed(() =>
  isHomeHeroCtaVisible(hero.value.secondaryCta, features.value),
)

onMounted(async () => {
  try {
    const [latest] = await getLatestAvailableWatches(1)
    piece.value = latest ?? null
  } catch {
    // Catalogue injoignable : le hero reste lisible sans son panneau.
    piece.value = null
  } finally {
    isLoadingPiece.value = false
  }
})
</script>

<template>
  <section id="accueil" class="bg-cream border-b border-cream-200">
    <div
      class="vitrine-layout mx-auto grid max-w-7xl gap-y-12 px-4 py-14 sm:px-6 lg:gap-x-16 lg:gap-y-6 lg:px-8 lg:py-20"
      :class="showPanel ? 'lg:grid-cols-[1.05fr_1fr] vitrine-has-panel' : ''"
    >
      <div class="vitrine-col-top flex flex-col">
        <p
          v-if="hero.eyebrow"
          class="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-primary"
        >
          <span class="block w-8 border-t border-gray-300" aria-hidden="true" />
          {{ hero.eyebrow }}
        </p>

        <h1
          class="mt-6 text-4xl font-bold leading-[1.08] text-text-main sm:text-5xl lg:text-[3rem]"
        >
          {{ hero.title }}
        </h1>
      </div>

      <div v-if="showPanel" ref="tiltRef" class="vitrine-col-panel vitrine-tilt" :style="tiltStyle">
        <component
          :is="piecePath ? RouterLink : 'div'"
          :to="piecePath"
          class="vitrine-panel flex h-full flex-col bg-white p-7 sm:p-10"
        >
          <div class="flex items-baseline justify-between gap-4 border-b border-gray-200 pb-5">
            <p class="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500">
              Pièce en vitrine
            </p>
            <p
              v-if="showPiece"
              class="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary"
            >
              En stock
            </p>
          </div>

          <div class="vitrine-stage flex flex-1 items-center justify-center py-8 sm:py-10">
            <div class="vitrine-piece aspect-square w-full max-w-[19rem] lg:max-w-[24rem]">
              <img
                v-if="showPiece"
                :src="pieceImage"
                :alt="piece.name"
                class="h-full w-full object-contain"
                width="800"
                height="800"
                fetchpriority="high"
                decoding="async"
              />
            </div>
          </div>

          <div class="border-t border-gray-200 pt-5">
            <template v-if="showPiece">
              <p
                v-if="piece.brand"
                class="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500"
              >
                {{ piece.brand }}
              </p>
              <p v-if="piece.model" class="mt-1.5 text-lg font-semibold text-text-main">
                {{ piece.model }}
              </p>
            </template>
          </div>
        </component>
      </div>

      <div class="vitrine-col-bottom flex flex-col">
        <p
          v-if="hero.subtitle"
          class="max-w-xl text-lg leading-relaxed text-gray-600"
        >
          {{ hero.subtitle }}
        </p>

        <div
          v-if="showPrimaryCta || showSecondaryCta"
          class="mt-9 flex flex-col gap-3 sm:flex-row sm:gap-4"
        >
          <RouterLink
            v-if="showPrimaryCta"
            :to="hero.primaryCta.to"
            class="inline-flex items-center justify-center bg-primary px-7 py-4 text-base font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            {{ hero.primaryCta.label }}
          </RouterLink>
          <RouterLink
            v-if="showSecondaryCta"
            :to="hero.secondaryCta.to"
            class="inline-flex items-center justify-center border border-primary px-7 py-4 text-base font-semibold text-primary transition-colors hover:bg-cream-100"
          >
            {{ hero.secondaryCta.label }}
          </RouterLink>
        </div>

        <ul
          v-if="highlights.length"
          class="mt-12 grid gap-5 border-t border-gray-200 pt-8 sm:grid-cols-3"
        >
          <li
            v-for="(highlight, index) in highlights"
            :key="highlight"
            class="flex items-start gap-3"
          >
            <component
              :is="HIGHLIGHT_ICONS[index]"
              class="mt-0.5 h-5 w-5 shrink-0 text-primary"
              :stroke-width="1.5"
              aria-hidden="true"
            />
            <span class="text-sm leading-snug text-gray-600">{{ highlight }}</span>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>

<style scoped>
/*
 * Mobile : les trois blocs (titre, panneau, description) s'empilent dans l'ordre
 * du DOM. Desktop : le panneau reprend sa place à droite, sur toute la hauteur,
 * via des zones nommées — sans ça le `gap` du grid s'appliquerait aussi entre
 * le titre et la description, ce que les marges internes gèrent déjà.
 */
@media (min-width: 1024px) {
  .vitrine-layout.vitrine-has-panel {
    grid-template-areas: 'top panel' 'bottom panel';
  }

  .vitrine-col-top {
    grid-area: top;
  }

  .vitrine-col-panel {
    grid-area: panel;
  }

  .vitrine-col-bottom {
    grid-area: bottom;
  }
}

/*
 * Le `transform` (perspective + rotations) est posé en style inline par
 * `useTiltMotion`, qui publie aussi `--tilt-x` / `--tilt-y` (-1 → 1). Ici on ne
 * fait qu'en tirer les conséquences : profondeur des calques et ombre portée.
 */
.vitrine-tilt {
  /* La chaîne complète doit rester en 3D pour que la montre décolle du panneau. */
  transform-style: preserve-3d;
  will-change: transform;
}

.vitrine-panel,
.vitrine-stage {
  transform-style: preserve-3d;
}

.vitrine-panel {
  /* L'ombre glisse à l'opposé de l'inclinaison : la carte paraît décollée. */
  box-shadow:
    calc(var(--tilt-x, 0) * -20px) calc(14px - var(--tilt-y, 0) * 16px) 40px -12px
    rgba(15, 42, 29, 0.4);
}

/* La montre flotte au-dessus du panneau : la perspective en fait un parallaxe. */
.vitrine-piece {
  transform: translateZ(46px);
}

@media (hover: hover) and (pointer: fine) {
  .vitrine-tilt {
    transition: scale 320ms cubic-bezier(0.22, 1, 0.36, 1);
  }

  /* `scale` est une propriété à part : elle n'écrase pas le `transform` inline. */
  .vitrine-tilt:hover {
    scale: 1.015;
  }
}

@media (prefers-reduced-motion: reduce) {
  .vitrine-tilt {
    transform: none !important;
    scale: 1 !important;
    transition: none;
  }

  .vitrine-piece {
    transform: none;
  }
}
</style>

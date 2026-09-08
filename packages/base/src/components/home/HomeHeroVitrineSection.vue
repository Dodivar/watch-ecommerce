<script setup>
import { t } from '@/i18n'
/**
 * Hero « vitrine » : le discours à gauche, une pièce du catalogue posée dans un
 * panneau blanc à droite, comme une devanture.
 *
 * Le texte vient de `home.hero` (voir `site/homeHero.js`) ; la montre exposée
 * est celle choisie dans l'admin « Montre en vitrine », et à défaut la première
 * du catalogue encore en vente — la vitrine se renouvelle donc toute seule tant
 * que personne n'y a posé de choix (voir `services/homeVitrineService.js`).
 * Sans catalogue joignable, le panneau disparaît et le discours occupe toute la
 * largeur.
 *
 * Le panneau est réglé pour que la montre, et non le blanc autour, occupe le
 * regard : les deux étiquettes tiennent sur une ligne haut et bas, et la photo
 * prend tout ce qui reste, jusqu'aux bords. Un halo l'éclaire comme un spot de
 * vitrine — il suit l'inclinaison, sinon la montre paraîtrait posée sur du vide.
 *
 * Le panneau s'oriente vers le pointeur (ou suit l'inclinaison du téléphone) :
 * la mécanique vit dans `useTiltMotion`, le rendu 3D dans le style ci-dessous.
 */
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { ArrowRight, BadgeCheck, MapPin, ShieldCheck } from '@lucide/vue'

import { getSiteConfig } from '@/site/getSiteConfig.js'
import { isHomeHeroCtaVisible } from '@/site/homeHero.js'
import { loadVitrineWatch } from '@/services/homeVitrineService.js'
import { useTiltMotion } from '@/composables/useTiltMotion.js'
import { watchCardImageUrl } from '@/utils/watchImageUrl.js'
import { buildWatchPath } from '@/utils/watchSlug.js'

/** Une icône par point de réassurance, dans l'ordre déclaré par la config. */
const HIGHLIGHT_ICONS = [ShieldCheck, BadgeCheck, MapPin]

/**
 * La montre couvre jusqu'à ~520 px de large sur grand écran : en dessous de
 * cette largeur de rendu, elle serait molle sur un écran à densité double.
 */
const PIECE_IMAGE_WIDTH = 1100

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
  return watchCardImageUrl(url, { width: PIECE_IMAGE_WIDTH }) ?? url
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
    piece.value = await loadVitrineWatch()
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
          class="vitrine-panel relative flex h-full flex-col bg-white"
        >
          <span class="vitrine-halo" aria-hidden="true" />

          <!--
            `items-baseline` et non `items-start` : la pastille « En stock » porte
            une hauteur de fond propre, l'aligner par le haut ferait descendre son
            texte d'un cran sous celui de l'étiquette d'en face.
          -->
          <div
            class="relative z-10 flex items-baseline justify-between gap-4 px-5 pt-5 sm:px-6 sm:pt-6"
          >
            <p class="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500">
              {{ t('home.vitrineShowcase') }}
            </p>
            <p
              v-if="showPiece"
              class="bg-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary"
            >
              {{ t('home.vitrineInStock') }}
            </p>
          </div>

          <!--
            La scène est un carré calé sur la largeur du panneau, et non un reste
            de place : c'est ce qui garantit une montre grande sur tous les écrans
            plutôt qu'écrasée par la hauteur de la colonne de gauche. `flex-auto`
            lui laisse absorber la hauteur en trop quand le discours est plus long,
            et `object-contain` met la photo à l'échelle sans jamais la recadrer.
          -->
          <div class="vitrine-stage relative aspect-square flex-auto">
            <div v-if="showPiece" class="vitrine-piece absolute inset-3 sm:inset-4">
              <img
                :src="pieceImage"
                :alt="piece.name"
                class="h-full w-full object-contain"
                :width="PIECE_IMAGE_WIDTH"
                :height="PIECE_IMAGE_WIDTH"
                fetchpriority="high"
                decoding="async"
              />
            </div>
          </div>

          <div
            class="relative z-10 flex items-end justify-between gap-4 px-5 pb-5 sm:px-6 sm:pb-6"
          >
            <div v-if="showPiece" class="min-w-0">
              <p
                v-if="piece.brand"
                class="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500"
              >
                {{ piece.brand }}
              </p>
              <p v-if="piece.model" class="mt-1 truncate text-lg font-semibold text-text-main">
                {{ piece.model }}
              </p>
            </div>
            <ArrowRight
              v-if="showPiece && piecePath"
              class="vitrine-arrow mb-1.5 h-5 w-5 shrink-0 text-primary"
              :stroke-width="1.5"
              aria-hidden="true"
            />
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
 *
 * Pas d'`overflow` sur cette chaîne : une valeur autre que `visible` aplatirait
 * le `preserve-3d` et recollerait la montre au panneau.
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

/*
 * Le spot de vitrine : sans lui, une photo détourée sur fond blanc se dissout
 * dans le panneau. Son centre suit l'inclinaison, à contre-sens du regard, pour
 * que la lumière paraisse fixe pendant que la carte tourne.
 */
.vitrine-halo {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    62% 52% at calc(50% - var(--tilt-x, 0) * 7%) calc(45% - var(--tilt-y, 0) * 5%),
    rgba(15, 42, 29, 0.1),
    rgba(15, 42, 29, 0.035) 55%,
    rgba(15, 42, 29, 0) 74%
  );
}

/* La montre flotte au-dessus du panneau : la perspective en fait un parallaxe. */
.vitrine-piece {
  transform: translateZ(34px);
}

@media (hover: hover) and (pointer: fine) {
  .vitrine-tilt {
    transition: scale 320ms cubic-bezier(0.22, 1, 0.36, 1);
  }

  .vitrine-arrow {
    transition: transform 320ms cubic-bezier(0.22, 1, 0.36, 1);
  }

  /* `scale` est une propriété à part : elle n'écrase pas le `transform` inline. */
  .vitrine-tilt:hover {
    scale: 1.015;
  }

  /*
   * Zoom du panneau entier, jamais de la seule photo : la montre affleure déjà
   * les bords, un agrandissement à elle seule la ferait déborder de la vitrine.
   */
  .vitrine-panel:hover .vitrine-arrow {
    transform: translateX(4px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .vitrine-tilt {
    transform: none !important;
    scale: 1 !important;
    transition: none;
  }

  .vitrine-piece,
  .vitrine-arrow {
    transform: none;
    scale: 1;
    transition: none;
  }
}
</style>

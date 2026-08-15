<script setup>
/**
 * Hero « vitrine » — sans animation : le discours à gauche, une pièce du
 * catalogue posée dans un panneau blanc à droite, comme une devanture.
 *
 * Le texte vient de `home.hero` (voir `site/homeHero.js`) ; la montre exposée
 * est la première du catalogue encore en vente, donc la vitrine se renouvelle
 * toute seule. Sans catalogue joignable, le panneau disparaît et le discours
 * occupe toute la largeur.
 */
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { BadgeCheck, MapPin, ShieldCheck } from '@lucide/vue'

import { getSiteConfig } from '@/site/getSiteConfig.js'
import { isHomeHeroCtaVisible } from '@/site/homeHero.js'
import { getLatestAvailableWatches } from '@/services/watchService.js'
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
      class="mx-auto grid max-w-7xl gap-12 px-4 py-14 sm:px-6 lg:gap-16 lg:px-8 lg:py-20"
      :class="showPanel ? 'lg:grid-cols-[1.05fr_1fr]' : ''"
    >
      <div class="flex flex-col justify-center">
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

        <p
          v-if="hero.subtitle"
          class="mt-6 max-w-xl text-lg leading-relaxed text-gray-600"
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

      <component
        :is="piecePath ? RouterLink : 'div'"
        v-if="showPanel"
        :to="piecePath"
        class="flex flex-col bg-white p-7 shadow-lg sm:p-10"
        :class="piecePath ? 'transition-shadow hover:shadow-xl' : ''"
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

        <div class="flex flex-1 items-center justify-center py-8 sm:py-10">
          <div class="aspect-square w-full max-w-[19rem] lg:max-w-[24rem]">
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
  </section>
</template>

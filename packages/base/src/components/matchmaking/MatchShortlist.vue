<template>
  <section aria-labelledby="matchmaking-shortlist-title">
    <header class="text-center">
      <p class="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
        {{ t('matchmaking.eyebrow') }}
      </p>
      <h1
        id="matchmaking-shortlist-title"
        class="mt-3 text-2xl font-bold text-text-main sm:text-3xl"
      >
        {{ t('matchmaking.shortlist.title') }}
      </h1>
      <p class="mt-2 text-gray-600">
        {{
          entries.length ? t('matchmaking.shortlist.subtitle') : t('matchmaking.shortlist.empty')
        }}
      </p>
    </header>

    <!-- Deux colonnes dès le téléphone, comme les collections du site : une seule donnait des
         vignettes hautes d'un demi-écran, et comparer ses coups de cœur demandait de faire
         défiler la page entre deux montres. -->
    <ul v-if="entries.length" class="mt-8 grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3">
      <li v-for="entry in entries" :key="entry.id" class="flex flex-col">
        <!-- Montre encore au catalogue -->
        <template v-if="entry.watch">
          <button
            type="button"
            class="block aspect-[4/5] w-full text-left focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            :aria-label="
              t('matchmaking.shortlist.detailsLabel', {
                name: entry.watch.model || entry.watch.name,
              })
            "
            @click="emit('open-details', entry.watch)"
          >
            <MatchWatchCard :watch="entry.watch" image-loading="lazy" />
          </button>
          <!-- Une seule rangée sous la vignette. « Revoir » n'y est plus : la vignette elle-même
               ouvre le détail, et les deux rangées qu'il fallait pour tenir trois boutons dans
               une colonne étroite reviennent à la photo. Reste la fiche — le seul chemin vers
               l'achat, donc le seul bouton en couleur de marque, sur toute la largeur libre — et
               le retrait, réduit à son icône. -->
          <div class="mt-2 flex items-center gap-2 sm:mt-3">
            <RouterLink
              v-if="entry.watch.slug"
              :to="`/montre/${entry.watch.slug}`"
              class="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-2 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wide text-white shadow-sm hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 sm:px-3 sm:text-xs"
            >
              {{ t('matchmaking.shortlist.viewPage') }}
              <ArrowRight class="h-4 w-4 shrink-0" :stroke-width="2" />
            </RouterLink>
            <!-- Montre sans slug : pas de fiche à ouvrir, le détail reprend la place du bouton. -->
            <button
              v-else
              type="button"
              class="inline-flex flex-1 items-center justify-center rounded-lg border border-gray-300 bg-white px-2 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wide text-gray-700 hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary sm:px-3 sm:text-xs"
              @click="emit('open-details', entry.watch)"
            >
              {{ t('matchmaking.shortlist.details') }}
            </button>
            <button
              type="button"
              class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-500 hover:border-red-500 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
              :aria-label="
                t('matchmaking.shortlist.removeLabel', {
                  name: entry.watch.model || entry.watch.name,
                })
              "
              :title="t('matchmaking.shortlist.remove')"
              @click="mm.removeLiked(entry.id)"
            >
              <Trash2 class="h-4 w-4" :stroke-width="2" />
            </button>
          </div>
        </template>

        <!-- Coup de cœur disparu du catalogue -->
        <template v-else>
          <div
            class="flex aspect-[4/5] w-full flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white/60 p-3 text-center sm:p-6"
          >
            <HeartCrack class="h-8 w-8 text-gray-400" :stroke-width="1.5" />
            <p class="mt-3 text-sm font-semibold text-gray-700">
              {{ t('matchmaking.shortlist.unavailable') }}
            </p>
            <p class="mt-1 text-xs text-gray-500">
              {{ t('matchmaking.shortlist.unavailableText') }}
            </p>
            <RouterLink
              v-if="features.recherche"
              to="/recherche"
              class="mt-4 text-xs font-semibold uppercase tracking-wide text-primary underline-offset-4 hover:underline"
            >
              {{ t('matchmaking.cta.sourcing.button') }}
            </RouterLink>
          </div>
          <div class="mt-3 flex justify-end">
            <button
              type="button"
              class="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-500 hover:border-red-500 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
              :aria-label="t('matchmaking.shortlist.remove')"
              :title="t('matchmaking.shortlist.remove')"
              @click="mm.removeLiked(entry.id)"
            >
              <Trash2 class="h-4 w-4" :stroke-width="2" />
            </button>
          </div>
        </template>
      </li>
    </ul>

    <div class="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm">
      <button
        v-if="mm.deck.length > 0"
        type="button"
        class="inline-flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-white hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        @click="mm.resumeDiscovery()"
      >
        {{ t('matchmaking.shortlist.resume') }}
        <span class="opacity-80">({{ mm.deck.length }})</span>
      </button>
      <button
        type="button"
        class="inline-flex items-center gap-1.5 text-gray-600 underline-offset-4 hover:underline focus:outline-none focus:ring-2 focus:ring-primary"
        @click="mm.editPreferences()"
      >
        <SlidersHorizontal class="h-4 w-4" :stroke-width="2" />
        {{ t('matchmaking.end.editPreferences') }}
      </button>
      <button
        type="button"
        class="inline-flex items-center gap-1.5 text-gray-500 underline-offset-4 hover:underline focus:outline-none focus:ring-2 focus:ring-primary"
        @click="mm.restart()"
      >
        <RotateCcw class="h-4 w-4" :stroke-width="2" />
        {{ t('matchmaking.end.restart') }}
      </button>
    </div>

    <MatchCtaFooter :preferences="mm.session.preferences" class="mt-10" />
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { ArrowRight, HeartCrack, RotateCcw, SlidersHorizontal, Trash2 } from '@lucide/vue'

import { t } from '@/i18n'
import { getSiteConfig } from '@/site/getSiteConfig.js'

import MatchWatchCard from './MatchWatchCard.vue'
import MatchCtaFooter from './MatchCtaFooter.vue'

const props = defineProps({
  /** Objet réactif de `useWatchMatchmaking()`. */
  mm: { type: Object, required: true },
})

const emit = defineEmits(['open-details'])

const features = getSiteConfig().features

const entries = computed(() => props.mm.likedEntries)
</script>

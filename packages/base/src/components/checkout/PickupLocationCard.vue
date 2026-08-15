<script setup>
import { Clock, MapPin } from '@lucide/vue'

defineProps({
  name: { type: String, required: true },
  address: { type: String, required: true },
  estimatedDays: { type: String, default: '' },
  /** Affiche le bandeau « Gratuit » (masqué dans les listes où le prix est déjà visible). */
  showFreeBadge: { type: Boolean, default: true },
})
</script>

<template>
  <div
    class="relative overflow-hidden rounded-xl border border-cream-200 bg-white px-4 py-3.5 sm:px-5 sm:py-4"
  >
    <div
      class="absolute inset-y-0 left-0 w-1 rounded-l-xl bg-primary"
      aria-hidden="true"
    />

    <div class="flex items-start justify-between gap-4 pl-2.5">
      <div class="min-w-0 flex items-start gap-2">
        <MapPin class="mt-0.5 h-4 w-4 shrink-0 text-primary/70" :stroke-width="1.5" />
        <p class="font-semibold text-gray-900 leading-snug">{{ name }}</p>
      </div>

      <span
        v-if="showFreeBadge"
        class="shrink-0 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-primary"
      >
        Gratuit
      </span>
    </div>

    <p class="mt-2 pl-6 text-sm text-gray-600 leading-relaxed">{{ address }}</p>

    <p
      v-if="estimatedDays"
      class="mt-2.5 pl-6 flex items-center gap-1.5 text-xs text-gray-500"
    >
      <Clock class="h-3.5 w-3.5 shrink-0" :stroke-width="1.5" />
      <span>{{ estimatedDays }}</span>
    </p>
  </div>
</template>

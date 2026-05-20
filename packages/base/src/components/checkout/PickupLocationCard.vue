<script setup>
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
    class="relative overflow-hidden rounded-xl border border-cream-200 bg-gradient-to-br from-cream/80 to-white px-4 py-3.5 sm:px-5 sm:py-4"
  >
    <div
      class="absolute inset-y-0 left-0 w-1 rounded-l-xl bg-primary"
      aria-hidden="true"
    />

    <div class="flex items-start justify-between gap-4 pl-2.5">
      <div class="min-w-0 flex items-start gap-2">
        <svg
          class="mt-0.5 h-4 w-4 shrink-0 text-primary/70"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1.5"
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
          />
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1.5"
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
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
      <svg
        class="h-3.5 w-3.5 shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="1.5"
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span>{{ estimatedDays }}</span>
    </p>
  </div>
</template>
